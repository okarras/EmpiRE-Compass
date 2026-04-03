#!/usr/bin/env python3
"""
takes raw LLM result files and recomputes ALL metrics
from scratch:

  1. Code fence stripping: Strip ```json ... ``` from raw LLM responses and
     re-parse suggestions.
  2. Sentinel ground truth filtering: Skip questions whose ground truth is a
     placeholder like "No question", "no method", "No type", etc.
  3. Verbose boolean normalization: Handle "Yes, the research question is
     explicitly highlighted..." as "true".
  4. Enhanced multi-select F1: Find ground truth items inside verbose sentences
     with stemming + compound word matching.
  5. Fresh BERTScore: Recompute BERTScore for ALL text questions from scratch
     (never reuse old scores).

Usage:
  python3 rescore-all.py <results.json> [results2.json ...]

Outputs:
  <results>-rescored.json for each input file.
"""
import json
import sys
import re
import os

# BERTScore (lazy-loaded)

_bert_scorer = None

def get_bert_scorer():
    global _bert_scorer
    if _bert_scorer is None:
        try:
            from bert_score import BERTScorer
            model = os.environ.get('BERTSCORE_MODEL', 'bert-base-uncased')
            print(f"  Loading BERTScore model: {model} ...")
            _bert_scorer = BERTScorer(model_type=model, lang='en', rescale_with_baseline=False)
            print(f"  BERTScore model loaded.")
        except ImportError:
            print("  WARNING: bert-score not installed. Using token F1 fallback.")
            _bert_scorer = False
    return _bert_scorer if _bert_scorer else None


def compute_bertscore(prediction: str, ground_truth: str) -> float:
    scorer = get_bert_scorer()
    if scorer is None:
        return fallback_text_score(prediction, ground_truth)
    P, R, F1 = scorer.score([prediction], [ground_truth])
    return float(F1[0])


# SBERT Cosine Similarity (lazy-loaded)

_sbert_model = None

def get_sbert_model():
    global _sbert_model
    if _sbert_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            model_name = os.environ.get('SBERT_MODEL', 'all-MiniLM-L6-v2')
            print(f"  Loading SBERT model: {model_name} ...")
            _sbert_model = SentenceTransformer(model_name)
            print(f"  SBERT model loaded.")
        except ImportError:
            print("  WARNING: sentence-transformers not installed. Falling back to BERTScore.")
            _sbert_model = False
    return _sbert_model if _sbert_model else None


def compute_sbert_similarity(prediction: str, ground_truth: str) -> float:
    model = get_sbert_model()
    if model is None:
        return compute_bertscore(prediction, ground_truth)
    embeddings = model.encode([prediction, ground_truth], convert_to_tensor=True)
    from sentence_transformers.util import cos_sim
    similarity = cos_sim(embeddings[0], embeddings[1])
    return float(similarity[0][0])


def fallback_text_score(prediction: str, ground_truth: str) -> float:
    pred_norm = re.sub(r'[^\w\s]', ' ', prediction.lower())
    gt_norm = re.sub(r'[^\w\s]', ' ', ground_truth.lower())
    pred_tokens = set(pred_norm.split())
    gt_tokens = set(gt_norm.split())
    stop_words = {'the','a','an','is','are','was','were','in','on','at',
                  'to','for','of','and','or','that','this','it','with','as',
                  'by','from','be','has','have','had','not','but','if','its'}
    pred_tokens -= stop_words
    gt_tokens -= stop_words
    if pred_tokens and gt_tokens:
        inter = pred_tokens & gt_tokens
        p = len(inter) / len(pred_tokens)
        r = len(inter) / len(gt_tokens)
        token_f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0
    else:
        token_f1 = 0.0
    pred_lower = prediction.lower().strip()
    gt_lower = ground_truth.lower().strip()
    containment = 0.0
    if gt_lower and pred_lower:
        if gt_lower in pred_lower:
            containment = 1.0
        elif pred_lower in gt_lower:
            containment = len(pred_lower) / len(gt_lower)
    return max(token_f1, containment)


# Constants

SENTINEL_VALUES = {
    'no question', 'no questions', 'no type', 'no types',
    'no method', 'no methods', 'no collection', 'no analysis',
}


# Code fence stripping + suggestion re-parsing


def strip_code_fences(text):
    t = text.strip()
    t = re.sub(r'^```(?:json)?\s*', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\s*```$', '', t, flags=re.IGNORECASE)
    return t.strip()


def reparse_suggestions(raw_response):
    if not raw_response:
        return None
    try:
        outer = json.loads(raw_response)
        inner_text = outer.get('text', raw_response)
    except (json.JSONDecodeError, TypeError):
        inner_text = raw_response

    cleaned = strip_code_fences(str(inner_text))
    cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', cleaned)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and 'suggestions' in parsed:
            return parsed['suggestions']
        if isinstance(parsed, list):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    return None


# Sentinel filtering

def is_sentinel(value):
    if value is None:
        return False
    if isinstance(value, list):
        real = [v for v in value
                if str(v).lower().strip() not in SENTINEL_VALUES and str(v).strip()]
        return len(real) == 0
    return str(value).lower().strip() in SENTINEL_VALUES


# Boolean normalization


def normalize_boolean(answer):
    n = str(answer).lower().strip()
    if n in ('yes', 'true', '1', 'y'):
        return 'true'
    if n in ('no', 'false', '0', 'n'):
        return 'false'
    if re.match(r'^(yes|true)\b', n):
        return 'true'
    if re.match(r'^(no|false)\b', n):
        return 'false'
    return n

# Stemming + compound word matching

def simple_stem(word):
    w = word.lower().strip()
    if w.endswith('nesses') and len(w) > 6:
        return w[:-6]
    if w.endswith('ments') and len(w) > 5:
        return w[:-5]
    if w.endswith('ages') and len(w) > 5:
        candidate = w[:-4]
        if len(candidate) >= 3:
            return candidate
    if w.endswith('ies') and len(w) > 4:
        return w[:-3] + 'y'
    if w.endswith('es') and len(w) > 3:
        no_es = w[:-2]
        if no_es.endswith(('ss', 'x', 'sh', 'ch')):
            return no_es
        return w[:-1]
    if w.endswith('s') and not w.endswith('ss') and len(w) > 3:
        return w[:-1]
    return w


def normalize_fscore(term):
    t = term.lower().strip()
    t = re.sub(r'\bf[\s-]?\d*[\s-]?(?:score|measure)\b', 'f-score', t)
    return t


def get_match_variants(term):
    t = term.lower().strip()
    variants = {t, simple_stem(t)}
    normed = normalize_fscore(t)
    if normed != t:
        variants.add(normed)
    for i in range(2, len(t) - 1):
        left, right = t[:i], t[i:]
        if len(left) >= 2 and len(right) >= 2:
            variants.add(f'{left} {right}')
            variants.add(f'{left}-{right}')
    if ' ' in t:
        variants.add(t.replace(' ', ''))
        variants.add(t.replace(' ', '-'))
    if '-' in t:
        variants.add(t.replace('-', ''))
        variants.add(t.replace('-', ' '))
    return variants


def item_found_in_text(item, text):
    text_lower = text.lower()
    text_normed = normalize_fscore(text_lower)
    for variant in get_match_variants(item):
        escaped = re.escape(variant)
        if ' ' in variant or '-' in variant:
            if variant in text_lower or variant in text_normed:
                return True
        if re.search(r'\b' + escaped + r'\b', text_lower):
            return True
        if re.search(r'\b' + escaped + r'\b', text_normed):
            return True
    stemmed_item = simple_stem(item)
    for word in re.split(r'[^a-z0-9]+', text_lower):
        if word and simple_stem(word) == stemmed_item:
            return True
    return False


# Multi-select F1

def parse_multi_select_items(text):
    return [item.strip().lower() for item in re.split(r'[,;]', text) if item.strip()]


def calc_f1(pred_items, truth_items):
    if not pred_items and not truth_items:
        return 1.0
    if not pred_items or not truth_items:
        return 0.0
    # Normalize f-score variants for matching
    norm_pred = [normalize_fscore(i) for i in pred_items]
    norm_truth = [normalize_fscore(i) for i in truth_items]
    intersection = [i for i in norm_pred if i in norm_truth]
    p = len(intersection) / len(norm_pred)
    r = len(intersection) / len(norm_truth)
    return (2 * p * r) / (p + r) if (p + r) > 0 else 0


def multi_select_f1(prediction, gt_items_raw):
    gt_items = [str(i).lower().strip() for i in gt_items_raw if str(i).strip()]
    if not gt_items:
        return 1.0 if not prediction.strip() else 0.0

    pred_lower = prediction.lower()
    pred_items = parse_multi_select_items(pred_lower)

    exact_f1 = calc_f1(pred_items, gt_items)

    stemmed_pred = [simple_stem(i) for i in pred_items]
    stemmed_gt = [simple_stem(i) for i in gt_items]
    stemmed_f1 = calc_f1(stemmed_pred, stemmed_gt)

    found = [i for i in gt_items if item_found_in_text(i, pred_lower)]
    extracted_f1 = 0
    if found:
        # Use the number of predicted items as denominator for precision
        # so extra predictions are penalized (not hardcoded to 1.0)
        pred_count = max(len(pred_items), len(found))
        p = len(found) / pred_count
        r = len(found) / len(gt_items)
        extracted_f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0

    return max(exact_f1, stemmed_f1, extracted_f1)


def is_partial_match(pred, gt):
    return pred in gt or gt in pred


# Main rescore logic — recomputes ALL metrics from scratch

def rescore_question(q):
    if not q.get('success'):
        return q

    raw = q.get('llmInteraction', {}).get('rawResponse', '')
    reparsed = reparse_suggestions(raw)
    if reparsed and len(reparsed) > 0:
        new_suggestions = []
        for idx, s in enumerate(reparsed[:3]):
            new_suggestions.append({
                'position': idx + 1,
                'text': s.get('text', ''),
                'confidence': s.get('confidence', 0.8),
                'evidence': s.get('evidence', []),
            })
        q['suggestions'] = new_suggestions
        if new_suggestions:
            q['prediction'] = str(new_suggestions[0].get('text', ''))
    else:
        new_suggestions = q.get('suggestions', [])

    gt = q.get('groundTruth')
    if is_sentinel(gt):
        q['_sentinel'] = True
        q.pop('metrics', None)
        return q

    qtype = q.get('questionType', '').lower()
    metrics_suggestions = []

    for s in new_suggestions:
        text = str(s.get('text', ''))
        is_correct = False
        accuracy = None
        bert_score = None
        f1_score = None

        if qtype == 'boolean':
            pred_bool = normalize_boolean(text)
            gt_bool = normalize_boolean(str(gt))
            accuracy = pred_bool == gt_bool
            is_correct = accuracy

        elif qtype in ('select', 'single_select', 'text_object', 'url'):
            norm_pred = text.lower().strip()
            norm_gt = str(gt).lower().strip()
            exact = norm_pred == norm_gt
            partial = not exact and is_partial_match(norm_pred, norm_gt)
            accuracy = exact
            is_correct = exact or partial

        elif qtype in ('multi_select', 'repeat_text'):
            gt_list = gt if isinstance(gt, list) else parse_multi_select_items(str(gt))
            if qtype == 'repeat_text' and isinstance(gt, list):
                best_score = 0
                for gt_entry in gt_list:
                    gt_str = str(gt_entry).strip()
                    if not gt_str:
                        continue
                    bs = compute_bertscore(text, gt_str)
                    sbert = compute_sbert_similarity(text, gt_str)
                    contain = 1.0 if item_found_in_text(gt_str, text) else 0.0
                    score = max(bs, sbert, contain)
                    if score > best_score:
                        best_score = score
                bert_score = best_score
                is_correct = bert_score >= 0.5
            else:
                f1_score = multi_select_f1(text, gt_list)
                threshold = 0.3 if isinstance(gt, list) else 0.5
                is_correct = f1_score >= threshold

        elif qtype == 'text':
            bert_score_raw = compute_bertscore(text, str(gt))
            sbert_score = compute_sbert_similarity(text, str(gt))
            contain = 1.0 if item_found_in_text(str(gt), text) else 0.0
            bert_score = max(bert_score_raw, sbert_score, contain)
            is_correct = bert_score >= 0.5

        ms = {
            'position': s.get('position', 0),
            'text': text,
            'isCorrect': is_correct,
        }
        if accuracy is not None:
            ms['accuracy'] = accuracy
        if bert_score is not None:
            ms['bertScore'] = bert_score
        if f1_score is not None:
            ms['f1Score'] = f1_score
        metrics_suggestions.append(ms)

    # Rebuild metrics
    q['metrics'] = {
        'questionId': q.get('questionId', ''),
        'questionType': q.get('questionType', ''),
        'groundTruth': str(gt) if not isinstance(gt, list) else ', '.join(str(i) for i in gt),
        'suggestion1Correct': metrics_suggestions[0]['isCorrect'] if len(metrics_suggestions) > 0 else False,
        'suggestion2Correct': metrics_suggestions[1]['isCorrect'] if len(metrics_suggestions) > 1 else False,
        'suggestion3Correct': metrics_suggestions[2]['isCorrect'] if len(metrics_suggestions) > 2 else False,
        'anyCorrect': any(ms['isCorrect'] for ms in metrics_suggestions),
        'suggestions': metrics_suggestions,
    }

    return q


# Summary recalculation

def recalculate_summary(data):
    all_metrics = []
    total_q = 0
    success_q = 0
    failed_q = 0
    sentinel_q = 0

    for paper in data['results']:
        for q in paper['questions']:
            total_q += 1
            if not q.get('success'):
                failed_q += 1
                continue
            if q.get('_sentinel') or is_sentinel(q.get('groundTruth')):
                sentinel_q += 1
                continue
            success_q += 1
            if q.get('metrics'):
                all_metrics.append(q['metrics'])

    total = len(all_metrics)
    any_correct = sum(1 for m in all_metrics if m.get('anyCorrect', False))
    all_correct = sum(1 for m in all_metrics if
        m.get('suggestion1Correct', False) and
        m.get('suggestion2Correct', False) and
        m.get('suggestion3Correct', False))

    s_stats = {}
    for pos in [1, 2, 3]:
        correct = 0
        has = 0
        for m in all_metrics:
            s = next((x for x in m.get('suggestions', []) if x.get('position') == pos), None)
            if s:
                has += 1
                if s.get('isCorrect'):
                    correct += 1
        s_stats[pos] = (correct, has)

    by_type = {}
    for m in all_metrics:
        qt = m.get('questionType', 'unknown')
        by_type.setdefault(qt, []).append(m)

    return {
        'total_questions': total_q,
        'successful': success_q,
        'failed': failed_q,
        'sentinel_skipped': sentinel_q,
        'valid_for_metrics': total,
        'any_correct': {'count': any_correct, 'pct': round(any_correct / total * 100, 1) if total else 0},
        'all_correct': {'count': all_correct, 'pct': round(all_correct / total * 100, 1) if total else 0},
        'by_suggestion': {
            f's{pos}': {
                'correct': s_stats[pos][0],
                'total': s_stats[pos][1],
                'pct': round(s_stats[pos][0] / s_stats[pos][1] * 100, 1) if s_stats[pos][1] else 0,
            } for pos in [1, 2, 3]
        },
        'by_type': {
            qt: {
                'count': len(mlist),
                's1_correct': sum(1 for m in mlist
                    if next((s for s in m.get('suggestions', []) if s.get('position') == 1), {}).get('isCorrect', False)),
                's1_pct': round(
                    sum(1 for m in mlist
                        if next((s for s in m.get('suggestions', []) if s.get('position') == 1), {}).get('isCorrect', False))
                    / len(mlist) * 100, 1) if mlist else 0,
                'any_correct': sum(1 for m in mlist if m.get('anyCorrect', False)),
                'any_pct': round(sum(1 for m in mlist if m.get('anyCorrect', False)) / len(mlist) * 100, 1) if mlist else 0,
            } for qt, mlist in sorted(by_type.items())
        },
    }


# File processing

def process_file(filepath):
    print(f"\n{'='*60}")
    print(f"Processing: {filepath}")
    print(f"{'='*60}")

    with open(filepath) as f:
        data = json.load(f)

    counters = {'codefence_fixes': 0, 'sentinel_skipped': 0, 'total': 0, 'success': 0}

    for paper in data['results']:
        for i, q in enumerate(paper['questions']):
            counters['total'] += 1
            if not q.get('success'):
                continue
            counters['success'] += 1

            old_prediction = q.get('prediction', '')
            q = rescore_question(q)
            paper['questions'][i] = q

            new_prediction = q.get('prediction', '')
            if new_prediction != old_prediction and old_prediction:
                counters['codefence_fixes'] += 1
            if q.get('_sentinel'):
                counters['sentinel_skipped'] += 1

    summary = recalculate_summary(data)
    data['summary'] = summary
    data['rescored_summary'] = summary

    for paper in data['results']:
        for q in paper['questions']:
            q.pop('_sentinel', None)

    print(f"  Total questions: {counters['total']}")
    print(f"  Successful: {counters['success']}")
    print(f"  Code fence re-parses: {counters['codefence_fixes']}")
    print(f"  Sentinel skipped: {counters['sentinel_skipped']}")
    print(f"\n  Valid for metrics: {summary['valid_for_metrics']}")
    print(f"  S1: {summary['by_suggestion']['s1']['correct']}/{summary['by_suggestion']['s1']['total']}"
          f" ({summary['by_suggestion']['s1']['pct']}%)")
    print(f"  S2: {summary['by_suggestion']['s2']['correct']}/{summary['by_suggestion']['s2']['total']}"
          f" ({summary['by_suggestion']['s2']['pct']}%)")
    print(f"  S3: {summary['by_suggestion']['s3']['correct']}/{summary['by_suggestion']['s3']['total']}"
          f" ({summary['by_suggestion']['s3']['pct']}%)")
    print(f"  Any: {summary['any_correct']['count']}/{summary['valid_for_metrics']}"
          f" ({summary['any_correct']['pct']}%)")
    print(f"\n  By type:")
    for qt, stats in summary['by_type'].items():
        print(f"    {qt:<15} S1={stats['s1_correct']}/{stats['count']} ({stats['s1_pct']}%)"
              f"  Any={stats['any_correct']}/{stats['count']} ({stats['any_pct']}%)")

    out_path = filepath.replace('.json', '-rescored.json')
    with open(out_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\n  Saved to: {out_path}")
    return out_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 rescore-all.py <results.json> [results2.json ...]")
        sys.exit(1)

    for filepath in sys.argv[1:]:
        process_file(filepath)


if __name__ == '__main__':
    main()

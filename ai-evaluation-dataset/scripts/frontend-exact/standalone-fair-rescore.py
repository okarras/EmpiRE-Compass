#!/usr/bin/env python3
"""
Standalone Fair Rescore

Takes -rescored.json files and applies fair matching ONLY for standalone
repeat_text questions (statistical_tests, ml_algorithms, data_urls,
other_analysis_methods). These have no sibling dependency so all models
get the same treatment — pick the best individual GT match.

Group questions are NOT touched (no asymmetry between context/no-context).

Output: *-final.json files
"""
import json, os, sys, glob, re
import torch

# BERTScore (lazy)
_bert_scorer = None

def get_bert_scorer():
    global _bert_scorer
    if _bert_scorer is None:
        try:
            from bert_score import BERTScorer
            _bert_scorer = BERTScorer(model_type='bert-base-uncased', lang='en', rescale_with_baseline=False)
            print("  BERTScorer loaded (bert-base-uncased)")
        except ImportError:
            print("  WARNING: bert-score not installed, using token F1 fallback")
            _bert_scorer = 'fallback'
    return _bert_scorer

def compute_bertscore(prediction: str, ground_truth: str) -> float:
    scorer = get_bert_scorer()
    if scorer == 'fallback':
        return fallback_text_score(prediction, ground_truth)
    P, R, F1 = scorer.score([prediction], [ground_truth])
    return round(F1.item(), 4)

def fallback_text_score(prediction: str, ground_truth: str) -> float:
    pred_tokens = set(prediction.lower().split())
    gt_tokens = set(ground_truth.lower().split())
    if not gt_tokens:
        return 1.0 if not pred_tokens else 0.0
    if not pred_tokens:
        return 0.0
    common = pred_tokens & gt_tokens
    p = len(common) / len(pred_tokens)
    r = len(common) / len(gt_tokens)
    f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
    containment = len(common) / len(gt_tokens)
    return round(max(f1, containment), 4)

# SBERT (lazy)
_sbert_model = None

def get_sbert_model():
    global _sbert_model
    if _sbert_model is None:
        from sentence_transformers import SentenceTransformer
        _sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("  SBERT model loaded (all-MiniLM-L6-v2)")
    return _sbert_model

def compute_sbert_similarity(prediction: str, ground_truth: str) -> float:
    model = get_sbert_model()
    embs = model.encode([prediction, ground_truth], convert_to_tensor=True)
    cos = torch.nn.functional.cosine_similarity(embs[0].unsqueeze(0), embs[1].unsqueeze(0))
    return max(0.0, cos.item())

# Containment (same logic as rescore-all.py)
def simple_stem(word):
    w = word.lower().strip()
    if w.endswith('nesses') and len(w) > 6: return w[:-6]
    if w.endswith('ments') and len(w) > 5: return w[:-5]
    if w.endswith('ages') and len(w) > 5:
        candidate = w[:-4]
        if len(candidate) >= 3: return candidate
    if w.endswith('ies') and len(w) > 4: return w[:-3] + 'y'
    if w.endswith('es') and len(w) > 3:
        no_es = w[:-2]
        if no_es.endswith(('ss', 'x', 'sh', 'ch')): return no_es
        return w[:-1]
    if w.endswith('s') and not w.endswith('ss') and len(w) > 3: return w[:-1]
    return w

def normalize_fscore(term):
    t = term.lower().strip()
    t = re.sub(r'\bf[\s-]?\d*[\s-]?(?:score|measure)\b', 'f-score', t)
    return t

def get_match_variants(term):
    t = term.lower().strip()
    variants = {t, simple_stem(t)}
    normed = normalize_fscore(t)
    if normed != t: variants.add(normed)
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
            if variant in text_lower or variant in text_normed: return True
        if re.search(r'\b' + escaped + r'\b', text_lower): return True
        if re.search(r'\b' + escaped + r'\b', text_normed): return True
    stemmed_item = simple_stem(item)
    for word in re.split(r'[^a-z0-9]+', text_lower):
        if word and simple_stem(word) == stemmed_item: return True
    return False

def triple_max_score(text, gt_str):
    """Score using max(BERTScore, SBERT, containment) — same as rescore-all.py."""
    bs = compute_bertscore(text, gt_str)
    sbert = compute_sbert_similarity(text, gt_str)
    contain = 1.0 if item_found_in_text(gt_str, text) else 0.0
    return max(bs, sbert, contain)

# Helpers
SENTINEL_VALUES = {
    'no question', 'no questions', 'no type', 'no types',
    'no method', 'no methods', 'no collection', 'no analysis',
}

STANDALONE_QUESTIONS = {'statistical_tests', 'ml_algorithms', 'data_urls', 'other_analysis_methods'}

def is_sentinel(value):
    if value is None:
        return False
    if isinstance(value, list):
        real = [v for v in value if str(v).lower().strip() not in SENTINEL_VALUES and str(v).strip()]
        return len(real) == 0
    return str(value).lower().strip() in SENTINEL_VALUES

def normalize_boolean(answer):
    s = str(answer).lower().strip()
    if s in ('true', 'yes', '1', 'y'):
        return 'true'
    if s in ('false', 'no', '0', 'n'):
        return 'false'
    return s

def is_partial_match(pred, gt):
    return gt in pred or pred in gt

def score_suggestion(text, gt_val, qtype):
    """Score a single suggestion against a GT value."""
    qtype = qtype.lower()
    result = {'isCorrect': False}
    text = str(text)

    if qtype == 'boolean':
        pred_bool = normalize_boolean(text)
        gt_bool = normalize_boolean(str(gt_val))
        result['accuracy'] = pred_bool == gt_bool
        result['isCorrect'] = result['accuracy']
    elif qtype in ('select', 'single_select', 'text_object', 'url'):
        norm_pred = text.lower().strip()
        norm_gt = str(gt_val).lower().strip()
        exact = norm_pred == norm_gt
        partial = not exact and is_partial_match(norm_pred, norm_gt)
        result['accuracy'] = exact
        result['isCorrect'] = exact or partial
    elif qtype == 'text':
        score = triple_max_score(text, str(gt_val))
        result['bertScore'] = score
        result['isCorrect'] = score >= 0.5
    elif qtype in ('multi_select', 'repeat_text'):
        score = triple_max_score(text, str(gt_val))
        result['bertScore'] = score
        result['f1Score'] = score  # approximate
        result['isCorrect'] = score >= 0.5
    return result


def load_metadata(dataset_path, paper_id):
    meta_path = os.path.join(dataset_path, paper_id, 'metadata.json')
    if not os.path.exists(meta_path):
        return None
    with open(meta_path) as f:
        return json.load(f)


def get_standalone_gt_values(metadata):
    qd = metadata.get('questionnaire_data', {})
    result = {}

    tests = qd.get('data_analysis', {}).get('statistical_tests', [])
    if isinstance(tests, list):
        valid = [t for t in tests if t and not is_sentinel(str(t))]
        if valid:
            result['statistical_tests'] = valid

    algos = qd.get('data_analysis', {}).get('ml_algorithms', [])
    if isinstance(algos, list):
        valid = [a for a in algos if a and not is_sentinel(str(a))]
        if valid:
            result['ml_algorithms'] = valid

    urls = qd.get('data_collection', {}).get('data_urls', [])
    if isinstance(urls, list):
        valid = [u for u in urls if u and str(u).strip()]
        if valid:
            result['data_urls'] = valid

    other = qd.get('data_analysis', {}).get('other_methods', [])
    if isinstance(other, list):
        valid = [m for m in other if m and not is_sentinel(str(m))]
        if valid:
            result['other_analysis_methods'] = valid

    return result


def fair_rescore_standalone(question, all_gt_values):
    if not question.get('metrics') or not question['metrics'].get('suggestions'):
        return False

    changed = False

    for s in question['metrics']['suggestions']:
        text = str(s.get('text', ''))
        best_score = -1

        for gt_val in all_gt_values:
            score = triple_max_score(text, str(gt_val))
            if score > best_score:
                best_score = score

        if best_score > -1:
            old_correct = s.get('isCorrect', False)
            old_bert = s.get('bertScore')

            s['isCorrect'] = best_score >= 0.5
            s['bertScore'] = best_score
            # Remove f1Score if present (repeat_text now uses bertScore)
            s.pop('f1Score', None)

            if s['isCorrect'] != old_correct or s.get('bertScore') != old_bert:
                changed = True

    # Update top-level metrics
    slist = question['metrics']['suggestions']
    question['metrics']['suggestion1Correct'] = slist[0]['isCorrect'] if len(slist) > 0 else False
    question['metrics']['suggestion2Correct'] = slist[1]['isCorrect'] if len(slist) > 1 else False
    question['metrics']['suggestion3Correct'] = slist[2]['isCorrect'] if len(slist) > 2 else False
    question['metrics']['anyCorrect'] = any(s['isCorrect'] for s in slist)
    return changed


def recalculate_summary(data):
    all_q = []
    for paper in data['results']:
        for q in paper['questions']:
            if q.get('success') and q.get('metrics'):
                all_q.append(q)

    total = len(all_q)
    if total == 0:
        return

    s1 = sum(1 for q in all_q if q['metrics'].get('suggestion1Correct'))
    s2 = sum(1 for q in all_q if q['metrics'].get('suggestion2Correct'))
    s3 = sum(1 for q in all_q if q['metrics'].get('suggestion3Correct'))
    any_c = sum(1 for q in all_q if q['metrics'].get('anyCorrect'))

    data['summary']['totalQuestions'] = total
    data['summary']['suggestion1Accuracy'] = round(s1 / total, 4)
    data['summary']['suggestion2Accuracy'] = round(s2 / total, 4)
    data['summary']['suggestion3Accuracy'] = round(s3 / total, 4)
    data['summary']['anyCorrectAccuracy'] = round(any_c / total, 4)


def process_file(filepath, dataset_path):
    print(f"\nProcessing: {filepath}")
    with open(filepath) as f:
        data = json.load(f)

    total_changed = 0
    total_standalone = 0

    for paper in data['results']:
        pid = paper.get('paperId', '')
        metadata = load_metadata(dataset_path, pid)
        if not metadata:
            continue

        standalone_gt = get_standalone_gt_values(metadata)
        if not standalone_gt:
            continue

        for q in paper['questions']:
            qid = q.get('questionId', '')
            if qid not in STANDALONE_QUESTIONS:
                continue
            if not q.get('success') or not q.get('metrics'):
                continue

            gt_values = standalone_gt.get(qid)
            if not gt_values or len(gt_values) <= 1:
                continue  # Only 1 GT value, no benefit from fair matching

            total_standalone += 1
            if fair_rescore_standalone(q, gt_values):
                total_changed += 1

    recalculate_summary(data)

    out_path = filepath.replace('-rescored.json', '-final.json')
    with open(out_path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"  Standalone questions checked: {total_standalone}")
    print(f"  Changed: {total_changed}")
    print(f"  Written: {out_path}")
    return out_path


def main():
    dataset_path = os.path.join(os.path.dirname(__file__), '..', '..', 'dataset')
    dataset_path = os.path.abspath(dataset_path)

    files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'results-*-rescored.json')))
    if not files:
        print("No -rescored.json files found")
        sys.exit(1)

    print(f"Dataset: {dataset_path}")
    print(f"Files to process: {len(files)}")

    for f in files:
        process_file(f, dataset_path)

    print("\nDone!")


if __name__ == '__main__':
    main()

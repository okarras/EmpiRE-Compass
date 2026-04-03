#!/usr/bin/env python3
"""
Compares all 3 model runs across multiple threshold settings.
Only considers questions common to ALL runs.

For each threshold setting, reports:
  1. Overall accuracy per suggestion position (S1, S2, S3)
  2. Accuracy by question type per suggestion position
  3. Accuracy by question ID per suggestion position
"""
import json

RESULT_FILES = {
    'GPT-3.5': [
        'results-gpt35-0-75-final.json',
        'results-gpt35-75-75-final.json',
    ],
    'GPT-4o-mini': [
        'results-gpt4omini-0-75-final.json',
        'results-gpt4omini-75-75-final.json',
    ],
    'GPT-4o-mini+Ctx': [
        'results-gpt4o-context-0-75-final.json',
        'results-gpt4o-context-75-75-final.json',
    ],
}

SHORT = {'GPT-3.5': '3.5', 'GPT-4o-mini': '4o-mini', 'GPT-4o-mini+Ctx': '+Ctx'}

THRESHOLDS = [
    {'name': 'Lenient  (BERT>=0.5, F1>=0.5)',  'bert': 0.5,  'f1': 0.5},
    {'name': 'Strict   (BERT>=0.7, F1>=0.75)', 'bert': 0.7,  'f1': 0.75},
]

SENTINEL_VALUES = {
    'no question', 'no questions', 'no type', 'no types',
    'no method', 'no methods', 'no collection', 'no analysis',
}

EXCLUDED_QUESTIONS = {
    'data_urls',
    'answer_highlighted',   
    'descriptive_stats_used', 
    'inferential_stats_used',  
    'ml_used',
}

# Questions that have NO sibling context — for these, +Ctx model should
# reuse 4o-mini data since the prompt is identical (no context difference).
NO_SIBLING_QUESTIONS = {
    'answer_highlighted', 'data_type', 'descriptive_stats_used',
    'inferential_stats_used', 'method_type', 'ml_used',
    'other_analysis_used', 'rq_text', 'threats_reported',
    'answer_hidden',  # sole sibling (answer_highlighted) is excluded
}

# Manual validation overrides (post-hoc corrections after human review)
FORCE_CORRECT = {
    # hypothesis_statement: +Ctx +1
    ('R194401', 'hypothesis_statement'): {'GPT-4o-mini+Ctx'},
    # method_name_custom: +Ctx +5, 4o-mini +4
    ('R254521', 'method_name_custom'):   {'GPT-4o-mini', 'GPT-4o-mini+Ctx'},
    ('R194431', 'method_name_custom'):   {'GPT-4o-mini', 'GPT-4o-mini+Ctx'},
    ('R195857', 'method_name_custom'):   {'GPT-4o-mini+Ctx'},
    ('R1550970', 'method_name_custom'):  {'GPT-4o-mini+Ctx'},
    ('R584056', 'method_name_custom'):   {'GPT-4o-mini+Ctx'},
    ('R228262', 'method_name_custom'):   {'GPT-4o-mini'},
    ('R211121', 'method_name_custom'):   {'GPT-4o-mini'},
    # ml_algorithms: 3.5 +1, 4o-mini +2, +Ctx +2
    ('R583135', 'ml_algorithms'):        {'GPT-3.5', 'GPT-4o-mini', 'GPT-4o-mini+Ctx'},
    ('R220605', 'ml_algorithms'):        {'GPT-4o-mini', 'GPT-4o-mini+Ctx'},
    # statistical_tests: +Ctx +1
    ('R199123', 'statistical_tests'):    {'GPT-4o-mini+Ctx'},
}


EXCLUDE_PAIRS = {
    ('R211145', 'subq_text'),  # Ground truth verified as incorrect
}


def is_sentinel(value):
    if value is None:
        return False
    if isinstance(value, list):
        real = [v for v in value
                if str(v).lower().strip() not in SENTINEL_VALUES and str(v).strip()]
        return len(real) == 0
    return str(value).lower().strip() in SENTINEL_VALUES


def load_questions(path):
    """Load all valid questions with per-suggestion scores."""
    with open(path) as f:
        data = json.load(f)
    qs = {}
    for paper in data['results']:
        pid = paper.get('paperId', '')
        for q in paper['questions']:
            if not q.get('success'):
                continue
            if is_sentinel(q.get('groundTruth')):
                continue
            m = q.get('metrics', {})
            if not m:
                continue
            suggestions = {}
            for s in m.get('suggestions', []):
                pos = s.get('position')
                if pos is None:
                    continue
                suggestions[pos] = {
                    'isCorrect': s.get('isCorrect', False),
                    'bertScore': s.get('bertScore'),
                    'f1Score': s.get('f1Score'),
                    'accuracy': s.get('accuracy'),
                }
            if not suggestions:
                continue
            # Exclude specific questions
            if q['questionId'] in EXCLUDED_QUESTIONS:
                continue
            key = (pid, q['questionId'])
            # Merge repeat_text into text for display purposes
            display_type = q.get('questionType', '')
            if display_type == 'repeat_text':
                display_type = 'text'
            qs[key] = {
                'questionId': q['questionId'],
                'questionType': display_type,
                'suggestions': suggestions,
            }
    return qs


def is_correct_at(s, qt, bert_thresh, f1_thresh):
    qt = qt.lower()
    if qt in ('boolean', 'select', 'single_select', 'text_object', 'url'):
        return s['isCorrect']
    elif qt in ('text', 'repeat_text'):
        bs = s.get('bertScore')
        return bs is not None and bs >= bert_thresh
    elif qt == 'multi_select':
        f1 = s.get('f1Score')
        return f1 is not None and f1 >= f1_thresh
    return False


def fmt(correct, total):
    pct = correct / total * 100 if total else 0
    return f"{correct}/{total} {pct:.1f}%"


def run(labels, all_data, common, thresh):
    bert_t = thresh['bert']
    f1_t = thresh['f1']
    total = len(common)

    print(f"\n{'#' * 80}")
    print(f"  THRESHOLD: {thresh['name']}")
    print(f"  Common questions: {total}")
    print(f"{'#' * 80}")

    print(f"\n{'=' * 78}")
    print("OVERALL ACCURACY PER SUGGESTION")
    print(f"{'=' * 78}")

    col = 18
    header = f"{'':>5}"
    for label in labels:
        header += f"  {SHORT[label]:>{col}}"
    for pos in [1, 2, 3]:
        print(f"\n  Suggestion {pos}:")
        print(f"  {header}")
        print(f"  {'':>5}{'':->{ (col+2)*len(labels) }}")
        row = f"  {'S'+str(pos):>5}"
        for label in labels:
            correct = 0
            has = 0
            for k in common:
                q = all_data[label][k]
                s = q['suggestions'].get(pos)
                if s:
                    has += 1
                    if is_correct_at(s, q['questionType'], bert_t, f1_t):
                        correct += 1
            row += f"  {fmt(correct, has):>{col}}"
        print(row)

    print(f"\n  Any correct (S1 ∨ S2 ∨ S3):")
    print(f"  {header}")
    print(f"  {'':>5}{'':->{ (col+2)*len(labels) }}")
    row = f"  {'Any':>5}"
    for label in labels:
        correct = 0
        for k in common:
            q = all_data[label][k]
            if any(
                is_correct_at(q['suggestions'][p], q['questionType'], bert_t, f1_t)
                for p in [1, 2, 3] if p in q['suggestions']
            ):
                correct += 1
        row += f"  {fmt(correct, total):>{col}}"
    print(row)

    # ==== BY QUESTION TYPE PER SUGGESTION ====
    print(f"\n{'=' * 78}")
    print("ACCURACY BY QUESTION TYPE PER SUGGESTION")
    print(f"{'=' * 78}")

    by_type = {}
    for k in common:
        qt = all_data[labels[0]][k]['questionType']
        by_type.setdefault(qt, []).append(k)

    for pos in [1, 2, 3]:
        print(f"\n  --- Suggestion {pos} ---")
        header = f"  {'Type':<15} {'N':>5}"
        for label in labels:
            header += f"  {SHORT[label]:>{col}}"
        print(header)
        print(f"  {'-' * (15 + 5 + (col+2)*len(labels))}")

        for qt in sorted(by_type.keys()):
            keys = by_type[qt]
            n = len(keys)
            row = f"  {qt:<15} {n:>5}"
            for label in labels:
                correct = 0
                has = 0
                for k in keys:
                    q = all_data[label][k]
                    s = q['suggestions'].get(pos)
                    if s:
                        has += 1
                        if is_correct_at(s, q['questionType'], bert_t, f1_t):
                            correct += 1
                row += f"  {fmt(correct, has):>{col}}"
            print(row)

        # Total row
        row = f"  {'TOTAL':<15} {total:>5}"
        for label in labels:
            correct = 0
            has = 0
            for k in common:
                q = all_data[label][k]
                s = q['suggestions'].get(pos)
                if s:
                    has += 1
                    if is_correct_at(s, q['questionType'], bert_t, f1_t):
                        correct += 1
            row += f"  {fmt(correct, has):>{col}}"
        print(f"  {'-' * (15 + 5 + (col+2)*len(labels))}")
        print(row)

    # Any correct (S1 OR S2 OR S3) by type
    print(f"\n  --- Any correct (S1 ∨ S2 ∨ S3) ---")
    header = f"  {'Type':<15} {'N':>5}"
    for label in labels:
        header += f"  {SHORT[label]:>{col}}"
    print(header)
    print(f"  {'-' * (15 + 5 + (col+2)*len(labels))}")

    for qt in sorted(by_type.keys()):
        keys = by_type[qt]
        n = len(keys)
        row = f"  {qt:<15} {n:>5}"
        for label in labels:
            correct = 0
            for k in keys:
                q = all_data[label][k]
                if any(
                    is_correct_at(q['suggestions'][p], q['questionType'], bert_t, f1_t)
                    for p in [1, 2, 3] if p in q['suggestions']
                ):
                    correct += 1
            row += f"  {fmt(correct, n):>{col}}"
        print(row)

    row = f"  {'TOTAL':<15} {total:>5}"
    for label in labels:
        correct = 0
        for k in common:
            q = all_data[label][k]
            if any(
                is_correct_at(q['suggestions'][p], q['questionType'], bert_t, f1_t)
                for p in [1, 2, 3] if p in q['suggestions']
            ):
                correct += 1
        row += f"  {fmt(correct, total):>{col}}"
    print(f"  {'-' * (15 + 5 + (col+2)*len(labels))}")
    print(row)

    # ==== BY QUESTION ID PER SUGGESTION ====
    print(f"\n{'=' * 78}")
    print("ACCURACY BY QUESTION ID PER SUGGESTION")
    print(f"{'=' * 78}")

    by_qid = {}
    for k in common:
        qid = all_data[labels[0]][k]['questionId']
        by_qid.setdefault(qid, []).append(k)

    for pos in [1, 2, 3]:
        print(f"\n  --- Suggestion {pos} ---")
        header = f"  {'Question ID':<32} {'N':>4} {'Type':<14}"
        for label in labels:
            header += f"  {SHORT[label]:>{col}}"
        print(header)
        print(f"  {'-' * (32 + 4 + 14 + (col+2)*len(labels))}")

        for qid in sorted(by_qid.keys()):
            keys = by_qid[qid]
            n = len(keys)
            qt = all_data[labels[0]][keys[0]]['questionType']
            row = f"  {qid:<32} {n:>4} {qt:<14}"
            for label in labels:
                correct = 0
                has = 0
                for k in keys:
                    q = all_data[label][k]
                    s = q['suggestions'].get(pos)
                    if s:
                        has += 1
                        if is_correct_at(s, q['questionType'], bert_t, f1_t):
                            correct += 1
                row += f"  {fmt(correct, has):>{col}}"
            print(row)

        print(f"  {'-' * (32 + 4 + 14 + (col+2)*len(labels))}")
        row = f"  {'TOTAL':<32} {total:>4} {'':<14}"
        for label in labels:
            correct = 0
            has = 0
            for k in common:
                q = all_data[label][k]
                s = q['suggestions'].get(pos)
                if s:
                    has += 1
                    if is_correct_at(s, q['questionType'], bert_t, f1_t):
                        correct += 1
            row += f"  {fmt(correct, has):>{col}}"
        print(row)

    # Any correct (S1 OR S2 OR S3) by question ID
    print(f"\n  --- Any correct (S1 ∨ S2 ∨ S3) ---")
    header = f"  {'Question ID':<32} {'N':>4} {'Type':<14}"
    for label in labels:
        header += f"  {SHORT[label]:>{col}}"
    print(header)
    print(f"  {'-' * (32 + 4 + 14 + (col+2)*len(labels))}")

    for qid in sorted(by_qid.keys()):
        keys = by_qid[qid]
        n = len(keys)
        qt = all_data[labels[0]][keys[0]]['questionType']
        row = f"  {qid:<32} {n:>4} {qt:<14}"
        for label in labels:
            correct = 0
            for k in keys:
                q = all_data[label][k]
                if any(
                    is_correct_at(q['suggestions'][p], q['questionType'], bert_t, f1_t)
                    for p in [1, 2, 3] if p in q['suggestions']
                ):
                    correct += 1
            row += f"  {fmt(correct, n):>{col}}"
        print(row)

    print(f"  {'-' * (32 + 4 + 14 + (col+2)*len(labels))}")
    row = f"  {'TOTAL':<32} {total:>4} {'':<14}"
    for label in labels:
        correct = 0
        for k in common:
            q = all_data[label][k]
            if any(
                is_correct_at(q['suggestions'][p], q['questionType'], bert_t, f1_t)
                for p in [1, 2, 3] if p in q['suggestions']
            ):
                correct += 1
        row += f"  {fmt(correct, total):>{col}}"
    print(row)


def main():
    labels = list(RESULT_FILES.keys())

    # Load and merge data from multiple files per model
    all_data = {}
    for label, paths in RESULT_FILES.items():
        if isinstance(paths, str):
            paths = [paths]
        merged = {}
        for path in paths:
            qs = load_questions(path)
            merged.update(qs)
            print(f"  {label}: loaded {len(qs)} from {path}")
        all_data[label] = merged
        print(f"{label}: {len(merged)} total valid questions")

    # For questions with no sibling context, copy 4o-mini data to +Ctx
    # (the prompt is identical, so we use the same results to isolate context effect)
    ctx_label = 'GPT-4o-mini+Ctx'
    mini_label = 'GPT-4o-mini'
    if ctx_label in all_data and mini_label in all_data:
        copied = 0
        for key, q in all_data[mini_label].items():
            if q['questionId'] in NO_SIBLING_QUESTIONS:
                all_data[ctx_label][key] = q
                copied += 1
        print(f"  Copied {copied} no-sibling questions from {mini_label} → {ctx_label}")

    # Find common questions
    common = set(all_data[labels[0]].keys())
    for label in labels[1:]:
        common &= set(all_data[label].keys())

    # Apply manual exclusions (bad ground truth)
    excluded_count = 0
    for pair in EXCLUDE_PAIRS:
        if pair in common:
            common.discard(pair)
            excluded_count += 1
    if excluded_count:
        print(f"  Excluded {excluded_count} pairs with bad GT")

    # Apply manual overrides (force correct after human validation)
    override_count = 0
    for (pid, qid), model_set in FORCE_CORRECT.items():
        key = (pid, qid)
        for label in model_set:
            if label in all_data and key in all_data[label]:
                q = all_data[label][key]
                s1 = q['suggestions'].get(1)
                if s1:
                    s1['isCorrect'] = True
                    s1['bertScore'] = 1.0
                    override_count += 1
    if override_count:
        print(f"  Applied {override_count} manual validation overrides")

    print(f"\nCommon questions across all runs: {len(common)}")

    # Run comparison for each threshold setting
    for thresh in THRESHOLDS:
        run(labels, all_data, common, thresh)


if __name__ == '__main__':
    main()

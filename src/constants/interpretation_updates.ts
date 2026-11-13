/**
 * Interpretation texts are stored in Firestore (`dataAnalysisInformation.dataInterpretation`),
 * not in the repo constants. This file is the repo-side source of truth for the
 * text corrections needed after the 2026-10-05 data snapshot. Apply each `find` ->
 * `replace` to the matching question's interpretation (Admin > edit question, or a
 * one-off script), then set `INTERPRETATION_SNAPSHOT_NOTE` as a visible note.
 */
export const INTERPRETATION_SNAPSHOT_DATE = '2026-10-05';

export const INTERPRETATION_SNAPSHOT_NOTE = `Interpretations reflect the ORKG data snapshot of ${INTERPRETATION_SNAPSHOT_DATE}.`;

export interface InterpretationUpdate {
  templateId: 'R186491' | 'R1544125';
  questionId: number;
  find: string;
  replace: string;
}

export const INTERPRETATION_UPDATES: InterpretationUpdate[] = [
  // R186491 Q2/Q4: data analysis counts (503 + 105 + 117 + 380 of 581 papers)
  ...[2, 4].flatMap((questionId) =>
    [
      [
        'descriptive statistics</em> (671 times)',
        'descriptive statistics</em> (503 times)',
      ],
      [
        'inferential statistics</em> (125 times)',
        'inferential statistics</em> (105 times)',
      ],
      [
        'machine learning</em> (153 times)',
        'machine learning</em> (117 times)',
      ],
      ['(579 times)', '(380 times)'],
    ].map(([find, replace]) => ({
      templateId: 'R186491' as const,
      questionId,
      find,
      replace,
    }))
  ),
  // R186491 Q4: data collection counts. Every method row counts, as in the
  // EmpiRE-Analysis notebook (978 rows). Reverts an earlier per-paper dedup
  // (889 combinations) that had already been applied to the stored text.
  ...[
    ['<em>case study</em> (230 times)', '<em>case study</em> (242 times)'],
    ['<em>experiment</em> (141 times)', '<em>experiment</em> (155 times)'],
    ['<em>survey</em> (108 times)', '<em>survey</em> (116 times)'],
    [
      '<em>secondary research</em> (111 times)',
      '<em>secondary research</em> (116 times)',
    ],
    ['<em>interview</em> (103 times)', '<em>interview</em> (110 times)'],
    [
      '<em>others</em> as a default category (186 times)',
      '<em>others</em> as a default category (229 times)',
    ],
  ].map(([find, replace]) => ({
    templateId: 'R186491' as const,
    questionId: 4,
    find,
    replace,
  })),
  // R186491 Q15: combined collection + analysis methods, outer merge of both
  // queries as in the notebook (611 papers)
  {
    templateId: 'R186491',
    questionId: 15,
    find: 'three (29.3%) to four (22.6%)',
    replace: 'three (29.1%) to four (22.4%)',
  },
  // NLP4RE
  {
    templateId: 'R1544125',
    questionId: 1,
    find: 'Accuracy</strong> (10; 8.8%)',
    replace: 'Accuracy</strong> (10; 8.6%)',
  },
  {
    templateId: 'R1544125',
    questionId: 7,
    find: 'Information Extraction follows with 19 datasets',
    replace: 'Information Extraction follows with 20 datasets',
  },
  {
    templateId: 'R1544125',
    questionId: 2,
    find: 'only 7 out of 50 made',
    replace: 'only 7 out of 48 made',
  },
  {
    templateId: 'R1544125',
    questionId: 5,
    find: '29 out of 50 NLP4RE ID Cards',
    replace: '29 out of 48 NLP4RE ID Cards',
  },
  {
    templateId: 'R1544125',
    questionId: 6,
    find: '29 out of 50 NLP4RE ID Cards',
    replace: '29 out of 48 NLP4RE ID Cards',
  },
];

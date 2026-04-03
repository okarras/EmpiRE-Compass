/**
 * Sibling Context Provider
 * Enabled via --with-context CLI flag.
 */

import type { EvaluationQuestion } from './evaluation-runner';

export interface SiblingEntry {
  questionId: string;
  questionText: string;
  answer: string;
}

const SIBLING_MAP: Record<string, string[]> = {
  rq_text: [],
  rq_highlighted: ['rq_text'],
  rq_hidden: ['rq_text', 'rq_highlighted'],
  rq_type: ['rq_text', 'rq_highlighted', 'rq_hidden'],
  subq_text: ['rq_text', 'rq_highlighted', 'rq_hidden', 'rq_type'],
  subq_type: ['rq_text', 'rq_highlighted', 'rq_hidden', 'rq_type', 'subq_text'],

  answer_highlighted: [],
  answer_hidden: ['answer_highlighted'],

  method_type: [],
  method_name_custom: ['method_type'],

  data_type: [],
  data_urls: ['data_type'],

  descriptive_stats_used: [],
  measures_frequency: ['descriptive_stats_used'],
  measures_central: ['descriptive_stats_used', 'measures_frequency'],
  measures_dispersion: [
    'descriptive_stats_used',
    'measures_frequency',
    'measures_central',
  ],
  measures_position: [
    'descriptive_stats_used',
    'measures_frequency',
    'measures_central',
    'measures_dispersion',
  ],

  inferential_stats_used: [],
  hypothesis_statement: ['inferential_stats_used'],
  hypothesis_type: ['inferential_stats_used', 'hypothesis_statement'],
  statistical_tests: [
    'inferential_stats_used',
    'hypothesis_statement',
    'hypothesis_type',
  ],

  ml_used: [],
  ml_algorithms: ['ml_used'],
  ml_metrics: ['ml_used', 'ml_algorithms'],

  other_analysis_used: [],
  other_analysis_methods: ['other_analysis_used'],

  threats_reported: [],
  threats_mentioned_uncategorized: ['threats_reported'],
};

const QUESTION_LABELS: Record<string, string> = {
  doi: "What is the paper's DOI?",
  venue_series: 'In which venue series was the paper published?',
  research_paradigm: 'Which research paradigm underpins the study?',
  rq_text: 'What is the stated research question?',
  rq_highlighted: 'Is the research question explicitly highlighted?',
  rq_hidden: 'Is the research question hidden in the running text?',
  rq_type: 'What is the type of the research question?',
  subq_text: 'What is the stated sub-question?',
  subq_type: 'What is the sub-question type?',
  answer_highlighted:
    'Is the answer to the research question explicitly highlighted?',
  answer_hidden:
    'Is the answer to the research question hidden in the running text?',
  method_type: 'What is the type of this data collection method?',
  method_name_custom: 'How is the data collection method called in the paper?',
  data_type: 'What is the type of the collected data?',
  data_urls: 'Where are the data available?',
  analysis_methods: 'Which types of data analysis are described?',
  descriptive_stats_used: 'Does the study report any descriptive statistics?',
  measures_frequency: 'Which measures of frequency are reported?',
  measures_central: 'Which measures of central tendency are reported?',
  measures_dispersion: 'Which measures of dispersion are reported?',
  measures_position: 'Which measures of position are reported?',
  inferential_stats_used: 'Does the study report any inferential statistics?',
  hypothesis_statement: 'What is the hypothesis statement?',
  hypothesis_type: 'What is the hypothesis type?',
  statistical_tests: 'Which statistical tests are reported?',
  ml_used: 'Does the study report any machine learning analysis?',
  ml_algorithms: 'Which algorithms are used?',
  ml_metrics: 'Which evaluation metrics are reported?',
  other_analysis_used: 'Does the study report any other data analysis methods?',
  other_analysis_methods: 'What other data analysis methods are used?',
  threats_reported: 'Which threats to validity are discussed?',
  threats_mentioned_uncategorized:
    'Are threats to validity mentioned but not classified?',
};

export class SiblingContextProvider {
  buildSiblingContextSection(
    questionId: string,
    allQuestions: EvaluationQuestion[]
  ): string {
    const siblingIds = SIBLING_MAP[questionId];
    if (!siblingIds || siblingIds.length === 0) {
      return '';
    }

    const gtLookup = new Map<string, any>();
    for (const q of allQuestions) {
      if (
        q.groundTruth !== null &&
        q.groundTruth !== undefined &&
        q.groundTruth !== ''
      ) {
        gtLookup.set(q.id, q.groundTruth);
      }
    }

    const siblings: SiblingEntry[] = [];
    for (const sibId of siblingIds) {
      const gt = gtLookup.get(sibId);
      if (gt === null || gt === undefined || gt === '') continue;

      const label = QUESTION_LABELS[sibId] || sibId;
      const answerStr = Array.isArray(gt) ? gt.join(', ') : String(gt);

      siblings.push({
        questionId: sibId,
        questionText: label,
        answer: answerStr,
      });
    }

    if (siblings.length === 0) {
      return '';
    }

    const siblingLines = siblings
      .map(
        (s, idx) => `\n${idx + 1}. ${s.questionText}\n   Answer: "${s.answer}"`
      )
      .join('\n');

    return `
SIBLING QUESTIONS (Already Answered):
${siblingLines}

IMPORTANT: Generate suggestions that:
- Are CONSISTENT and ALIGNED with sibling answers
- Complement and build upon the information in sibling answers
- Maintain the same level of detail and perspective as siblings
- Ensure coherence across all questions at this level
- Avoid contradicting information provided in sibling answers
`;
  }
}

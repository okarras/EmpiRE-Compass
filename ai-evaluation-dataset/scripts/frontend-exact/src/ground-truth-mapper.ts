/**
 * Ground Truth Mapper - Maps questionnaire questions to dataset metadata
 *
 * This module maps questions from the frontend questionnaire template
 * to the ground truth answers stored in the dataset metadata.json files.
 */

import type { EvaluationQuestion } from './evaluation-runner';

const SENTINEL_VALUES = new Set([
  'no question',
  'no questions',
  'no type',
  'no types',
  'no method',
  'no methods',
  'no collection',
  'no analysis',
]);

function isSentinelValue(value: any): boolean {
  if (typeof value !== 'string') return false;
  return SENTINEL_VALUES.has(value.toLowerCase().trim());
}

export interface GroundTruthMapping {
  questionId: string;
  metadataPath: string[];
  transformer?: (value: any) => any;
  defaultValue?: any;
}

export class GroundTruthMapper {
  private mappings: GroundTruthMapping[] = [
    // Context section
    {
      questionId: 'doi',
      metadataPath: ['doi'],
    },

    // Research Paradigm section
    {
      questionId: 'research_paradigm',
      metadataPath: ['questionnaire_data', 'research_paradigm'],
    },

    // Research Questions section
    {
      questionId: 'research_questions_list',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0) return [];
        const firstQuestion = questions[0];
        if (isSentinelValue(firstQuestion.question)) return [];
        return [
          {
            text: firstQuestion.question || '',
            highlighted:
              firstQuestion.highlighted_question === '1' ||
              firstQuestion.highlighted_question === true,
            answer_highlighted:
              firstQuestion.highlighted_answer === '1' ||
              firstQuestion.highlighted_answer === true,
          },
        ].filter((q) => q.text.length > 0);
      },
    },

    // Data Collection section
    {
      questionId: 'data_collection_methods',
      metadataPath: ['questionnaire_data', 'data_collection', 'methods'],
      transformer: (methods: any[]) => {
        if (!Array.isArray(methods)) return [];
        return methods
          .map((m) => m.name)
          .filter((n) => Boolean(n) && !isSentinelValue(n));
      },
    },

    {
      questionId: 'data_type',
      metadataPath: ['questionnaire_data', 'data_collection', 'data_type'],
      transformer: (dataType: any) => {
        if (Array.isArray(dataType)) return dataType;
        if (typeof dataType === 'string') return [dataType];
        return [];
      },
    },

    // Data Analysis section
    {
      questionId: 'analysis_methods',
      metadataPath: ['questionnaire_data', 'data_analysis'],
      transformer: (analysis: any) => {
        const methods: string[] = [];
        if (analysis?.descriptive?.length > 0) {
          methods.push('descriptive statistics');
        }
        if (analysis?.inferential?.length > 0) {
          methods.push('inferential statistics');
        }
        if (analysis?.machine_learning?.length > 0) {
          methods.push('machine learning');
        }
        return methods;
      },
    },

    {
      questionId: 'descriptive_stats_used',
      metadataPath: ['questionnaire_data', 'data_analysis', 'descriptive'],
      transformer: (descriptive: any[]) => {
        if (Array.isArray(descriptive) && descriptive.length > 0) {
          return 'yes';
        }
        return 'no';
      },
    },

    {
      questionId: 'measures_frequency',
      metadataPath: [
        'questionnaire_data',
        'data_analysis',
        'descriptive_measures',
        'frequency',
      ],
      transformer: (measures: any) => {
        if (!Array.isArray(measures)) return [];
        return measures.filter(Boolean);
      },
    },

    {
      questionId: 'measures_central',
      metadataPath: [
        'questionnaire_data',
        'data_analysis',
        'descriptive_measures',
        'central_tendency',
      ],
      transformer: (measures: any) => {
        if (!Array.isArray(measures)) return [];
        return measures.filter(Boolean);
      },
    },

    {
      questionId: 'measures_dispersion',
      metadataPath: [
        'questionnaire_data',
        'data_analysis',
        'descriptive_measures',
        'dispersion',
      ],
      transformer: (measures: any) => {
        if (!Array.isArray(measures)) return [];
        return measures.filter(Boolean);
      },
    },

    {
      questionId: 'measures_position',
      metadataPath: [
        'questionnaire_data',
        'data_analysis',
        'descriptive_measures',
        'position',
      ],
      transformer: (measures: any) => {
        if (!Array.isArray(measures)) return [];
        return measures.filter(Boolean);
      },
    },

    {
      questionId: 'inferential_stats_used',
      metadataPath: ['questionnaire_data', 'data_analysis', 'inferential'],
      transformer: (inferential: any[]) => {
        if (Array.isArray(inferential) && inferential.length > 0) {
          return 'yes';
        }
        return 'no';
      },
    },

    {
      questionId: 'statistical_tests',
      metadataPath: [
        'questionnaire_data',
        'data_analysis',
        'statistical_tests',
      ],
      transformer: (tests: any) => {
        if (!Array.isArray(tests) || tests.length === 0) return [];
        const valid = tests.filter(
          (t: any) => t && !isSentinelValue(String(t))
        );
        return valid.length > 0 ? valid : [];
      },
    },

    {
      questionId: 'ml_used',
      metadataPath: ['questionnaire_data', 'data_analysis', 'machine_learning'],
      transformer: (ml: any[]) => {
        if (Array.isArray(ml) && ml.length > 0) {
          return 'yes';
        }
        return 'no';
      },
    },

    {
      questionId: 'ml_algorithms',
      metadataPath: ['questionnaire_data', 'data_analysis', 'ml_algorithms'],
      transformer: (algorithms: any) => {
        if (!Array.isArray(algorithms) || algorithms.length === 0) return [];
        const valid = algorithms.filter(
          (a: any) => a && !isSentinelValue(String(a))
        );
        return valid.length > 0 ? valid : [];
      },
    },

    {
      questionId: 'ml_metrics',
      metadataPath: ['questionnaire_data', 'data_analysis', 'ml_metrics'],
      transformer: (metrics: any) => {
        if (!Array.isArray(metrics)) return [];
        return metrics.filter(Boolean);
      },
    },

    {
      questionId: 'other_analysis_used',
      metadataPath: ['questionnaire_data', 'data_analysis', 'other_methods'],
      transformer: (other: any[]) => {
        if (!Array.isArray(other) || other.length === 0) {
          return 'no';
        }
        const real = other.filter(
          (m) => Boolean(m) && !isSentinelValue(String(m))
        );
        if (real.length === 0) return 'no';
        return 'yes';
      },
    },

    {
      questionId: 'other_analysis_methods',
      metadataPath: ['questionnaire_data', 'data_analysis', 'other_methods'],
      transformer: (methods: any) => {
        if (!Array.isArray(methods) || methods.length === 0) return [];
        const valid = methods.filter(
          (m: any) => m && !isSentinelValue(String(m))
        );
        return valid.length > 0 ? valid : [];
      },
    },

    // Threats to Validity section
    {
      questionId: 'threats_reported',
      metadataPath: ['questionnaire_data', 'threats_to_validity'],
      transformer: (threats: any) => {
        const reportedThreats: string[] = [];

        if (threats?.external === '1')
          reportedThreats.push('external validity');
        if (threats?.internal === '1')
          reportedThreats.push('internal validity');
        if (threats?.construct === '1')
          reportedThreats.push('construct validity');
        if (threats?.conclusion === '1')
          reportedThreats.push('conclusion validity');
        if (threats?.reliability === '1') reportedThreats.push('reliability');
        if (threats?.generalizability === '1')
          reportedThreats.push('generalizability');
        if (threats?.repeatability === '1')
          reportedThreats.push('repeatability');
        if (threats?.content_validity === '1')
          reportedThreats.push('content validity');
        if (threats?.descriptive_validity === '1')
          reportedThreats.push('descriptive validity');
        if (threats?.theoretical_validity === '1')
          reportedThreats.push('theoretical validity');

        return reportedThreats;
      },
    },

    {
      questionId: 'threats_mentioned_uncategorized',
      metadataPath: [
        'questionnaire_data',
        'threats_to_validity',
        'mentioned_uncategorized',
      ],
      transformer: (mentioned: any) => {
        if (mentioned === '1' || mentioned === true) {
          return 'yes';
        }
        return 'no';
      },
    },

    // Answer highlighting questions — stored as top-level booleans in questionnaire_data
    {
      questionId: 'answer_highlighted',
      metadataPath: ['questionnaire_data', 'answer_highlighted'],
      transformer: (value: any) => {
        if (value === true || value === 'true' || value === '1') return 'yes';
        if (value === false || value === 'false' || value === '0') return 'no';
        return undefined;
      },
    },

    {
      questionId: 'answer_hidden',
      metadataPath: ['questionnaire_data', 'answer_hidden'],
      transformer: (value: any) => {
        if (value === true || value === 'true' || value === '1') return 'yes';
        if (value === false || value === 'false' || value === '0') return 'no';
        return undefined;
      },
    },

    // Questions inside research_data group
    {
      questionId: 'data_urls',
      metadataPath: ['questionnaire_data', 'data_collection', 'data_urls'],
      transformer: (urls: any) => {
        if (!Array.isArray(urls) || urls.length === 0) return [];
        const valid = urls.filter((u: any) => u && String(u).trim());
        return valid.length > 0 ? valid : [];
      },
    },

    // Questions inside research_questions_list repeat_group
    {
      questionId: 'rq_text',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0) return '';
        const q = questions[0]?.question || '';
        if (isSentinelValue(q)) return '';
        return q;
      },
    },

    {
      questionId: 'rq_highlighted',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0)
          return undefined;
        const firstQuestion = questions[0];
        if (!firstQuestion?.question || isSentinelValue(firstQuestion.question))
          return undefined;
        return (
          firstQuestion.highlighted_question === '1' ||
          firstQuestion.highlighted_question === true
        );
      },
    },

    {
      questionId: 'rq_hidden',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0)
          return undefined;
        const firstQuestion = questions[0];
        if (!firstQuestion?.question || isSentinelValue(firstQuestion.question))
          return undefined;
        return firstQuestion.hidden === '1' || firstQuestion.hidden === true;
      },
    },

    {
      questionId: 'rq_type',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0) return '';
        const t = questions[0]?.type || '';
        if (isSentinelValue(t)) return '';
        return t;
      },
    },

    // Questions inside subquestions repeat_group (nested inside research_questions_list)
    {
      questionId: 'subq_text',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0) return '';
        const firstQuestion = questions[0];
        if (isSentinelValue(firstQuestion?.question)) return '';
        if (
          Array.isArray(firstQuestion?.subquestions) &&
          firstQuestion.subquestions.length > 0
        ) {
          return firstQuestion.subquestions[0]?.question || '';
        }
        return '';
      },
    },

    {
      questionId: 'subq_type',
      metadataPath: ['questionnaire_data', 'research_questions'],
      transformer: (questions: any[]) => {
        if (!Array.isArray(questions) || questions.length === 0) return '';
        const firstQuestion = questions[0];
        if (isSentinelValue(firstQuestion?.question)) return '';
        if (
          Array.isArray(firstQuestion?.subquestions) &&
          firstQuestion.subquestions.length > 0
        ) {
          const t = firstQuestion.subquestions[0]?.type || '';
          if (isSentinelValue(t)) return '';
          return t;
        }
        return '';
      },
    },

    // Questions inside data_collection_methods repeat_group
    {
      questionId: 'method_type',
      metadataPath: ['questionnaire_data', 'data_collection', 'methods'],
      transformer: (methods: any[]) => {
        if (!Array.isArray(methods) || methods.length === 0) return '';
        const t = methods[0]?.type || '';
        if (isSentinelValue(t)) return '';
        return t;
      },
    },

    {
      questionId: 'method_name_custom',
      metadataPath: ['questionnaire_data', 'data_collection', 'methods'],
      transformer: (methods: any[]) => {
        if (!Array.isArray(methods) || methods.length === 0) return '';
        const n = methods[0]?.name || '';
        if (isSentinelValue(n)) return '';
        return n;
      },
    },

    // Questions inside hypotheses repeat_group
    {
      questionId: 'hypothesis_statement',
      metadataPath: ['questionnaire_data', 'data_analysis', 'hypotheses'],
      transformer: (hypotheses: any[]) => {
        if (!Array.isArray(hypotheses) || hypotheses.length === 0) return '';
        const statements = hypotheses
          .map((h) => h?.statement || '')
          .filter((s) => s && !isSentinelValue(s));
        return statements.length > 0 ? statements.join(' | ') : '';
      },
    },

    {
      questionId: 'hypothesis_type',
      metadataPath: ['questionnaire_data', 'data_analysis', 'hypotheses'],
      transformer: (hypotheses: any[]) => {
        if (!Array.isArray(hypotheses) || hypotheses.length === 0) return '';
        const types = hypotheses
          .map((h) => h?.type || '')
          .filter((t) => t && !isSentinelValue(t));
        return types.length > 0 ? types.join(' | ') : '';
      },
    },
  ];

  /**
   * Map questions to their ground truth values from metadata
   */
  mapQuestionsToGroundTruth(
    questions: EvaluationQuestion[],
    metadata: any
  ): EvaluationQuestion[] {
    const mappedQuestions: EvaluationQuestion[] = [];

    for (const question of questions) {
      const mapping = this.mappings.find((m) => m.questionId === question.id);

      if (!mapping) {
        console.log(
          `No ground truth mapping found for question: ${question.id}`
        );
        continue;
      }

      const groundTruth = this.extractValueFromMetadata(metadata, mapping);

      if (this.hasValidGroundTruth(groundTruth)) {
        mappedQuestions.push({
          ...question,
          groundTruth,
        });
      } else {
        console.log(`No valid ground truth for question: ${question.id}`);
      }
    }

    console.log(
      `Mapped ${mappedQuestions.length}/${questions.length} questions to ground truth`
    );
    return mappedQuestions;
  }

  /**
   * Extract value from metadata using a path
   */
  private extractValueFromMetadata(
    metadata: any,
    mapping: GroundTruthMapping
  ): any {
    let value = metadata;

    for (const key of mapping.metadataPath) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined && mapping.transformer) {
      try {
        value = mapping.transformer(value);
      } catch (error) {
        console.warn(`Transformer failed for ${mapping.questionId}:`, error);
        value = undefined;
      }
    }

    return value;
  }

  private hasValidGroundTruth(groundTruth: any): boolean {
    if (groundTruth === null || groundTruth === undefined) {
      return false;
    }

    if (typeof groundTruth === 'string') {
      const trimmed = groundTruth.trim();
      if (trimmed.length === 0) return false;
      if (isSentinelValue(trimmed)) return false;
      return true;
    }

    if (Array.isArray(groundTruth)) {
      const valid = groundTruth.filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          String(item).trim().length > 0 &&
          !isSentinelValue(String(item))
      );
      return valid.length > 0;
    }

    return true;
  }
}

import {
  fetchStatementsBundle,
  type ORKGStatement,
} from './orkgStatisticsService.js';

export interface MappedPaper {
  title: string;
  doi?: string;
  authors?: string;
  year?: number;
  venue?: string;
}

export interface MappedAnswers {
  paper: MappedPaper;
  answers: Record<string, unknown>;
  unmappedNotes: string[];
}

/**
 * ORKG curators record an explicit placeholder resource (e.g. a "no method"
 * node) rather than leaving a property unset when a category genuinely
 * doesn't apply to a paper.
 */
const NO_VALUE_RE = /^no (question|method|collection|analysis|type)$/i;

const isRealValue = (value: string | undefined): value is string =>
  typeof value === 'string' &&
  value.trim() !== '' &&
  !NO_VALUE_RE.test(value.trim());

const yesNo = (flag: boolean): 'yes' | 'no' => (flag ? 'yes' : 'no');
const isTrue = (label: string | undefined): boolean => label === 'true';

const KNOWN_OPTIONS = {
  research_paradigm: [
    'descriptive',
    'evaluative',
    'prescriptive',
    'explanatory',
    'comparative',
    'interpretive',
    'predictive',
    'confirmatory',
    'exploratory',
  ],
  question_type: [
    'comparative',
    'descriptive',
    'interpretive',
    'predictive',
    'relationship-based',
    'exploratory',
  ],
  method_type: [
    'study',
    'action research',
    'survey',
    'experiment',
    'secondary research',
    'interview',
    'case study',
  ],
};

const matchOption = (
  value: string | undefined,
  options: string[]
): string | undefined => {
  if (!isRealValue(value)) return undefined;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized);
};

// Property IDs from src/templates/empire_questionnaire.json's `maps_to_fields`
// / src/components/Admin/FetchKgEmpireButton.tsx's SPARQL query — both encode
// the same "Empirical Research Practice" ORKG template (R186708).
const PID = {
  hasContribution: 'P31',
  doi: 'P26',
  year: 'P29',
  hasAuthors: 'hasAuthors',
  hasListElement: 'hasListElement',
  venueSeries: 'P135046',
  researchParadigm: 'P57003',

  researchQuestion: 'P37330',
  rqText: 'P44139',
  rqHidden: 'P55038',
  rqHighlighted: 'P55039',
  rqType: 'P41928',
  subquestion: 'P57000',
  rqAnswer: 'P57004',

  dataCollection: 'P56008',
  method: 'P1005',
  methodName: 'P145012',
  methodType: 'P94003',
  data: 'DATA',
  dataType: 'P7055',
  qualitative: 'P57038',
  quantitative: 'P57039',
  dataUrl: 'url',

  dataAnalysis: 'P15124',
  descriptiveStats: 'P56048',
  freqMeasures: 'P56049',
  freqCount: 'P55023',
  freqPercent: 'P56050',
  centralMeasures: 'P57005',
  centralMean: 'P47000',
  centralMedian: 'P57006',
  centralMode: 'P57007',
  centralMin: 'P44107',
  centralMax: 'P44108',
  dispersionMeasures: 'P57008',
  dispRange: 'P4013',
  dispVariance: 'P57009',
  dispStddev: 'P44087',
  positionMeasures: 'P57010',
  positionBoxplot: 'P59065',

  inferentialStats: 'P56043',
  statisticalTest: 'P35133',
  hypothesis: 'P30001',
  hypothesisStatement: 'P56046',
  hypothesisType: 'P41703',
  hypothesisTypeNull: 'P35106',
  hypothesisTypeAlt: 'P35107',

  machineLearning: 'P57016',
  mlAlgorithm: 'P2001',
  mlMetrics: 'P2006',
  mlAccuracy: 'P18048',
  mlPrecision: 'P3004',
  mlRecall: 'P5073',
  mlFscore: 'P59137',

  threats: 'P39099',
  threatConstruct: 'P55037',
  threatInternal: 'P55035',
  threatExternal: 'P55034',
  threatConclusion: 'P55036',
  reliability: 'P59109',
  generalizability: 'P60006',
  repeatability: 'P97002',
  contentValidity: 'P68005',
  descriptiveValidity: 'P97000',
  theoreticalValidity: 'P97001',
  mentionedUncategorized: 'P145000',
} as const;

const THREAT_PROPERTY_TO_OPTION: Record<string, string> = {
  [PID.threatConstruct]: 'construct validity',
  [PID.threatInternal]: 'internal validity',
  [PID.threatExternal]: 'external validity',
  [PID.threatConclusion]: 'conclusion validity',
  [PID.reliability]: 'reliability',
  [PID.generalizability]: 'generalizability',
  [PID.repeatability]: 'repeatability',
  [PID.contentValidity]: 'content validity',
  [PID.descriptiveValidity]: 'descriptive validity',
  [PID.theoreticalValidity]: 'theoretical validity',
};

/** Fetches the full nested statement tree for a paper via ORKG's live REST API (not the SPARQL triplestore mirror, which lags/omits resources). */
export async function fetchPaperStatements(
  paperId: string
): Promise<ORKGStatement[]> {
  return fetchStatementsBundle(paperId);
}

function children(
  statements: ORKGStatement[],
  subjectId: string | undefined,
  predicateId: string
): ORKGStatement[] {
  if (!subjectId) return [];
  return statements.filter(
    (s) => s.subject.id === subjectId && s.predicate.id === predicateId
  );
}

function child(
  statements: ORKGStatement[],
  subjectId: string | undefined,
  predicateId: string
): ORKGStatement | undefined {
  return children(statements, subjectId, predicateId)[0];
}

const label = (stmt: ORKGStatement | undefined): string | undefined =>
  stmt?.object?.label;
const objectId = (stmt: ORKGStatement | undefined): string | undefined =>
  stmt?.object?.id;

function distinctRealLabels(statements: ORKGStatement[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const stmt of statements) {
    const value = stmt.object.label;
    if (!isRealValue(value) || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function mapResearchQuestions(
  statements: ORKGStatement[],
  contriId: string
): { items: Record<string, unknown>[]; notes: string[] } {
  const notes: string[] = [];
  const rqStatements = children(statements, contriId, PID.researchQuestion);

  const items = rqStatements
    .map((rqStmt) => {
      const rqId = objectId(rqStmt);
      const rqText = label(child(statements, rqId, PID.rqText));
      if (!isRealValue(rqText)) return null;

      const rqTypeRaw = label(child(statements, rqId, PID.rqType));
      const rqType = matchOption(rqTypeRaw, KNOWN_OPTIONS.question_type);
      if (rqTypeRaw && isRealValue(rqTypeRaw) && !rqType) {
        notes.push(
          `Unrecognized research question type "${rqTypeRaw}" for RQ "${rqText}" — left blank for review.`
        );
      }

      const subquestions = children(statements, rqId, PID.subquestion)
        .map((subqStmt) => {
          const subqId = objectId(subqStmt);
          const subqText = label(child(statements, subqId, PID.rqText));
          if (!isRealValue(subqText)) return null;
          const subqTypeRaw = label(child(statements, subqId, PID.rqType));
          const subqType = matchOption(subqTypeRaw, KNOWN_OPTIONS.question_type);
          if (subqTypeRaw && isRealValue(subqTypeRaw) && !subqType) {
            notes.push(
              `Unrecognized sub-question type "${subqTypeRaw}" — left blank for review.`
            );
          }
          return { subq_text: subqText, subq_type: subqType ?? '' };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return {
        rq_text: rqText,
        rq_highlighted: yesNo(isTrue(label(child(statements, rqId, PID.rqHighlighted)))),
        rq_hidden: yesNo(isTrue(label(child(statements, rqId, PID.rqHidden)))),
        rq_type: rqType ?? '',
        subquestions,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return { items, notes };
}

function mapDataCollectionMethods(
  statements: ORKGStatement[],
  dataCollectionId: string | undefined
): { items: Record<string, unknown>[]; notes: string[] } {
  const notes: string[] = [];
  const items = children(statements, dataCollectionId, PID.method)
    .map((methodStmt) => {
      const methodId = objectId(methodStmt);
      const methodNameRaw = label(child(statements, methodId, PID.methodName));
      const methodTypeRaw = label(child(statements, methodId, PID.methodType));
      if (!isRealValue(methodNameRaw) && !isRealValue(methodTypeRaw)) return null;

      const methodType = matchOption(methodTypeRaw, KNOWN_OPTIONS.method_type);
      if (methodTypeRaw && isRealValue(methodTypeRaw) && !methodType) {
        notes.push(
          `Unrecognized data collection method type "${methodTypeRaw}" — left blank for review.`
        );
      }
      return {
        method_type: methodType ?? '',
        method_name_custom: isRealValue(methodNameRaw) ? methodNameRaw : '',
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return { items, notes };
}

function mapHypotheses(
  statements: ORKGStatement[],
  inferentialStatsId: string | undefined
): Record<string, unknown>[] {
  return children(statements, inferentialStatsId, PID.hypothesis)
    .map((hypStmt) => {
      const hypId = objectId(hypStmt);
      const statement = label(child(statements, hypId, PID.hypothesisStatement));
      if (!isRealValue(statement)) return null;

      const hypTypeId = objectId(child(statements, hypId, PID.hypothesisType));
      const hypothesisType = child(statements, hypTypeId, PID.hypothesisTypeNull)
        ? 'Null hypothesis'
        : child(statements, hypTypeId, PID.hypothesisTypeAlt)
          ? 'Alternative hypothesis'
          : '';

      return { hypothesis_statement: statement, hypothesis_type: hypothesisType };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Maps a paper's live ORKG statement tree onto the EmpiRE questionnaire's
 * `answers` shape (see src/templates/empire_questionnaire.json /
 * @orkg/scidquest's ResearchQuestionnaireApp). Anything that can't be
 * confidently resolved is left blank and reported in `unmappedNotes` instead
 * of guessed, so the reviewing admin/author can fill it in.
 */
export function mapPaperStatementsToAnswers(
  statements: ORKGStatement[],
  paperId: string
): MappedAnswers | null {
  const paperStmt = statements.find((s) => s.subject.id === paperId);
  const contriStmt = child(statements, paperId, PID.hasContribution);
  if (!paperStmt || !contriStmt) return null;

  const contriId = objectId(contriStmt);
  const notes: string[] = [];

  const authorsListId = objectId(child(statements, paperId, PID.hasAuthors));
  const authors = distinctRealLabels(
    children(statements, authorsListId, PID.hasListElement)
  ).join(', ');

  const paradigmRaw = label(child(statements, contriId, PID.researchParadigm));
  const paradigm = matchOption(paradigmRaw, KNOWN_OPTIONS.research_paradigm);
  if (paradigmRaw && isRealValue(paradigmRaw) && !paradigm) {
    notes.push(`Unrecognized research paradigm "${paradigmRaw}" — left blank for review.`);
  }

  const { items: rqItems, notes: rqNotes } = mapResearchQuestions(statements, contriId!);
  notes.push(...rqNotes);

  const answerId = objectId(child(statements, contriId, PID.rqAnswer));

  const dataCollectionId = objectId(child(statements, contriId, PID.dataCollection));
  const { items: dcItems, notes: dcNotes } = mapDataCollectionMethods(
    statements,
    dataCollectionId
  );
  notes.push(...dcNotes);

  const dataId = objectId(child(statements, dataCollectionId, PID.data));
  const dataTypeId = objectId(child(statements, dataId, PID.dataType));
  const dataType: string[] = [];
  if (isTrue(label(child(statements, dataTypeId, PID.qualitative))))
    dataType.push('qualitative');
  if (isTrue(label(child(statements, dataTypeId, PID.quantitative))))
    dataType.push('quantitative');

  const analysisId = objectId(child(statements, contriId, PID.dataAnalysis));

  const descriptiveStatsId = objectId(
    child(statements, analysisId, PID.descriptiveStats)
  );
  const freqId = objectId(child(statements, descriptiveStatsId, PID.freqMeasures));
  const centralId = objectId(child(statements, descriptiveStatsId, PID.centralMeasures));
  const dispersionId = objectId(
    child(statements, descriptiveStatsId, PID.dispersionMeasures)
  );
  const positionId = objectId(
    child(statements, descriptiveStatsId, PID.positionMeasures)
  );

  const inferentialStatsId = objectId(
    child(statements, analysisId, PID.inferentialStats)
  );
  const mlId = objectId(child(statements, analysisId, PID.machineLearning));
  const mlMetricsId = objectId(child(statements, mlId, PID.mlMetrics));
  const otherAnalysisMethods = distinctRealLabels(
    children(statements, analysisId, PID.method)
  );

  const analysisMethods: string[] = [];
  if (descriptiveStatsId) analysisMethods.push('descriptive statistics');
  if (inferentialStatsId) analysisMethods.push('inferential statistics');
  if (mlId) analysisMethods.push('machine learning');

  const threatsId = objectId(child(statements, contriId, PID.threats));
  const threatsReported = Object.entries(THREAT_PROPERTY_TO_OPTION)
    .filter(([propertyId]) => isTrue(label(child(statements, threatsId, propertyId))))
    .map(([, option]) => option);

  const answers: Record<string, unknown> = {
    doi: label(child(statements, paperId, PID.doi)) ?? '',
    venue_series: label(child(statements, contriId, PID.venueSeries)) ?? '',
    contact_email: '',

    research_paradigm: paradigm ?? '',

    research_questions_list: rqItems,
    answer_highlighted: yesNo(isTrue(label(child(statements, answerId, PID.rqHighlighted)))),
    answer_hidden: yesNo(isTrue(label(child(statements, answerId, PID.rqHidden)))),

    data_collection_methods: dcItems,
    research_data: {
      data_type: dataType,
      data_urls: distinctRealLabels(children(statements, dataId, PID.dataUrl)),
    },

    analysis_methods: analysisMethods,
    descriptive_stats: {
      descriptive_stats_used: yesNo(!!descriptiveStatsId),
      measures_frequency: [
        ...(isTrue(label(child(statements, freqId, PID.freqCount))) ? ['count'] : []),
        ...(isTrue(label(child(statements, freqId, PID.freqPercent))) ? ['percent'] : []),
      ],
      measures_central: [
        ...(isTrue(label(child(statements, centralId, PID.centralMean))) ? ['mean'] : []),
        ...(isTrue(label(child(statements, centralId, PID.centralMedian))) ? ['median'] : []),
        ...(isTrue(label(child(statements, centralId, PID.centralMode))) ? ['mode'] : []),
        ...(isTrue(label(child(statements, centralId, PID.centralMin))) ? ['minimum'] : []),
        ...(isTrue(label(child(statements, centralId, PID.centralMax))) ? ['maximum'] : []),
      ],
      measures_dispersion: [
        ...(isTrue(label(child(statements, dispersionId, PID.dispRange))) ? ['range'] : []),
        ...(isTrue(label(child(statements, dispersionId, PID.dispVariance)))
          ? ['variance']
          : []),
        ...(isTrue(label(child(statements, dispersionId, PID.dispStddev)))
          ? ['standard deviation']
          : []),
      ],
      measures_position: [
        ...(isTrue(label(child(statements, positionId, PID.positionBoxplot)))
          ? ['boxplot']
          : []),
      ],
    },
    inferential_stats: {
      inferential_stats_used: yesNo(!!inferentialStatsId),
      hypotheses: mapHypotheses(statements, inferentialStatsId),
      statistical_tests: distinctRealLabels(
        children(statements, inferentialStatsId, PID.statisticalTest)
      ),
    },
    machine_learning: {
      ml_used: yesNo(!!mlId),
      ml_algorithms: distinctRealLabels(children(statements, mlId, PID.mlAlgorithm)),
      ml_metrics: [
        ...(isTrue(label(child(statements, mlMetricsId, PID.mlAccuracy)))
          ? ['accuracy']
          : []),
        ...(isTrue(label(child(statements, mlMetricsId, PID.mlPrecision)))
          ? ['precision']
          : []),
        ...(isTrue(label(child(statements, mlMetricsId, PID.mlRecall))) ? ['recall'] : []),
        ...(isTrue(label(child(statements, mlMetricsId, PID.mlFscore)))
          ? ['f-score']
          : []),
      ],
    },
    other_analysis: {
      other_analysis_used: yesNo(otherAnalysisMethods.length > 0),
      other_analysis_methods: otherAnalysisMethods,
    },

    threats_reported: threatsReported,
    threats_mentioned_uncategorized: yesNo(
      isTrue(label(child(statements, threatsId, PID.mentionedUncategorized)))
    ),
  };

  const paper: MappedPaper = {
    title: isRealValue(paperStmt.subject.label) ? paperStmt.subject.label! : 'Untitled paper',
    doi: (answers.doi as string) || undefined,
    authors: authors || undefined,
    year: (() => {
      const y = label(child(statements, paperId, PID.year));
      return y ? Number(y) : undefined;
    })(),
    venue: (answers.venue_series as string) || undefined,
  };

  return { paper, answers, unmappedNotes: notes };
}

/**
 * Utility for building dynamic query objects from state and data
 */

export interface DynamicQuery {
  title: string;
  id: number;
  uid: string;
  dataAnalysisInformation: {
    question: string;
    questionExplanation: string;
    requiredDataForAnalysis: string | string[];
    dataAnalysis: string | string[];
    dataInterpretation: string | string[];
  };
  chartSettings?: {
    series: Array<{ dataKey: string; label: string }>;
    colors?: string[];
    yAxis: Array<{ label: string; dataKey: string }>;
    seriesHeadingTemplate?: string;
    noHeadingInSeries?: boolean;
    height: number;
    sx: Record<string, unknown>;
  };
  chartType?: 'bar' | 'pie';
  dataProcessingFunction?: (
    data: Record<string, unknown>[]
  ) => Record<string, unknown>[];
}

interface BuildDynamicQueryParams {
  question: string;
  transformedData: Record<string, unknown>[];
  questionInterpretation?: string;
  dataCollectionInterpretation?: string;
  dataAnalysisInterpretation?: string;
}

/**
 * Build a dynamic query object from state and transformed data
 */
export const buildDynamicQuery = ({
  question,
  transformedData,
  questionInterpretation,
  dataCollectionInterpretation,
  dataAnalysisInterpretation,
}: BuildDynamicQueryParams): DynamicQuery => {
  return {
    title: `Dynamic Query: ${question}`,
    id: Date.now(),
    uid: 'dynamic-query',
    dataAnalysisInformation: {
      question,
      questionExplanation:
        questionInterpretation ||
        `This is a dynamically generated query based on the user's question: "${question}". The query was generated using AI and executed against the ORKG database.`,
      requiredDataForAnalysis:
        dataCollectionInterpretation ||
        `The query requires data from the ORKG database to answer: "${question}". The SPARQL query extracts relevant information based on the research question.`,
      dataAnalysis:
        dataAnalysisInterpretation ||
        `The data is analyzed to provide insights related to: "${question}". The results show patterns and trends in the Requirements Engineering research domain.`,
      dataInterpretation: `The results should be interpreted in the context of Requirements Engineering research, specifically addressing: "${question}".`,
    },
    chartSettings: {
      series: Object.keys(transformedData[0] || {})
        .filter(
          (key) =>
            key !== 'year' &&
            key !== 'paper' &&
            typeof (transformedData[0] as Record<string, unknown>)?.[key] ===
              'number'
        )
        .map((key) => ({
          dataKey: key,
          label: key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
      colors: ['#e86161', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
      yAxis: [
        {
          label: 'Count',
          dataKey: 'value',
        },
      ],
      height: 400,
      sx: { width: '100%' },
    },
    chartType: 'bar',
  };
};

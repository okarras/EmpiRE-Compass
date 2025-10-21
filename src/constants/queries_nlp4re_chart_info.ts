import { axisClasses } from '@mui/x-charts';
import { Query1DataProcessingFunction } from './data_processing_helper_functions_nlp4re';

const chartStyles = {
  [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
    transform: 'translateX(-10px)',
  },
};

const chartHeight = 400;

function xAxisSettings(dataKey = 'year', label = 'Year') {
  return [
    {
      scaleType: 'band',
      dataKey: dataKey,
      valueFormatter: (v: any) => v.toString(),
      tickPlacement: 'middle',
      label: label,
    },
  ];
}

export interface ChartSetting {
  heading?: string;
  seriesHeadingTemplate?: string;
  className?: string;
  colors?: string[];
  xAxis?: any;
  yAxis: any;
  series: any;
  height: number;
  sx: Record<string, unknown>;
  barLabel?: string;
  layout?: string;
  margin?: Record<string, unknown>;
  noHeadingInSeries?: boolean;
  barCategoryGap?: number;
  barGap?: number;
  barWidth?: number;
  tabs?: {
    tab1_name: string;
    tab2_name: string;
  };
}
export interface Query {
  title: string;
  id: number;
  uid: string; // data collection
  uid_2?: string; // data analysis
  uid_2_merge?: string; // merged query 1 and 2 (for Question 15 and 16) TODO: need refactoring
  chartSettings2?: ChartSetting;
  chartSettings?: ChartSetting;
  chartType?: 'bar' | 'pie';
  //TODO: fix types
  dataProcessingFunction2?: (data: any, data2?: any) => any[];
  dataProcessingFunction?: (
    data: any,
    query_id?: string,
    options?: Record<string, unknown>
  ) => any[];
  dataAnalysisInformation: {
    question: string;
    questionExplanation?: string;
    dataAnalysis?: string;
    dataInterpretation?: string;
    requiredDataForAnalysis?: string;
  };
}

export const queries: Query[] = [
  // Query 1
  {
    title: 'Number of papers with an empirical study per year',
    id: 1,
    uid: 'query_1',
    chartType: 'bar',
    chartSettings: {
      className: 'fullWidth',
      xAxis: xAxisSettings('metricLabel', 'Metrics'),
      heading:
        'Top-3 Most Frequently Used Evaluation Metrics in NLP Approaches',
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of papers',
          dataKey: 'count',
        },
      ],
      series: [{ dataKey: 'count' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query1DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'What are top-3 most frequently used evaluation metrics to assess a developed NLP approach?',
    },
  },
];

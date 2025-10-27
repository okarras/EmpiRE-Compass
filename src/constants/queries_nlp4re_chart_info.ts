/* eslint-disable @typescript-eslint/no-explicit-any */
import { axisClasses } from '@mui/x-charts';
import { Query1DataProcessingFunction } from './data_processing_helper_functions_nlp4re';
import { Query2DataProcessingFunction } from './data_processing_helper_functions_nlp4re';
import { Query3DataProcessingFunction } from './data_processing_helper_functions_nlp4re';
import { Query4DataProcessingFunction } from './data_processing_helper_functions_nlp4re';

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
      valueFormatter: (v: any) => v?.toString() || '',
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
  // Query 1 - Evaluation Metrics
  {
    title: 'Top-3 Most Frequently Used Evaluation Metrics',
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
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query1DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'What are top-3 most frequently used evaluation metrics to assess a developed NLP approach?',
      requiredDataForAnalysis:
        'As a researcher, I want to know the established evaluation metrics so that I can assess my own NLP4RE approach according to the state-of-the-art metrics. (Asked by: Oliver Karras, Related ID Card: VII.1)',
    },
  },

  // Query 2 - Papers with Annotation Guidelines (yearly counts)
  {
    title: 'Papers with Annotation Guidelines (by Year)',
    id: 2,
    uid: 'query_2',
    chartType: 'bar',
    chartSettings: {
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      heading: 'Papers with Annotation Guidelines — papers per year',
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of Papers',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query2DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'Which papers are associated with annotation guidelines (distribution by year)?',
      requiredDataForAnalysis:
        'As a researcher, I want to understand the annotation process so that I can reuse it to replicate dataset creation. (Asked by: Sallam Abualhaija, Related ID Card: V.6)',
    },
  },

  // Query 3 - Input Granularity
  {
    title: 'Input Granularity — Distribution of NLP Task Input Types',
    id: 3,
    uid: 'query_3',
    chartType: 'pie',
    chartSettings: {
      className: 'fullWidth',
      heading: 'Distribution of Input Granularity Levels Used in NLP Tasks',
      series: [
        {
          dataKey: 'count',
          nameKey: 'inputType',
          labelKey: 'inputType',
        },
      ],

      yAxis: [
        {
          label: 'Number of Papers',
          dataKey: 'count',
        },
      ],

      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query3DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'What are the different levels of granularity at which inputs can be represented and how is this related to the RE task?',
      requiredDataForAnalysis:
        'As a developer, I want to work at the right level of granularity so that I can accurately compare my method against existing ones. (Asked by: Sallam Abualhaija, Related ID Card: III.1 and I.1)',
    },
  },

  // Query 4 - Baseline Types
  {
    title: 'Types of Baselines',
    id: 4,
    uid: 'query_4',
    chartType: 'bar',
    chartSettings: {
      layout: 'horizontal',
      barLabel: 'value',
      heading: 'Distribution of Reported Baseline Types in NLP4RE Papers',
      className: 'fullWidth fixText',
      xAxis: [
        {
          label: 'Number of Papers',
        },
      ],
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'baseline_typeLabel',
          label: 'Baseline Type',
        },
      ],

      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
      margin: {
        left: 150,
      },
    },
    dataProcessingFunction: Query4DataProcessingFunction,
    dataAnalysisInformation: {
      question: 'What are the types of baselines reported in the papers?',
      requiredDataForAnalysis:
        'As a reviewer, I want to be able to position the paper against existing work so that I can make a more informed decision. (Asked by: Sallam Abualhaija, Related ID Card: VII.3)',
    },
  },

  // Query 5 - Format of Textual Requirements
  {
    title: 'Format of Textual Requirements',
    id: 5,
    uid: 'query_5',
    dataAnalysisInformation: {
      question: 'What is the most common format of textual requirements?',
      requiredDataForAnalysis:
        'As a researcher, I want to collect diverse requirements so that I validate the generalizability of my proposed method. (Asked by: Sallam Abualhaija, Related ID Card: IV.5)',
    },
  },

  // Query 6 - Dataset Validation
  {
    title: 'Dataset Quality Validation',
    id: 6,
    uid: 'query_6',
    dataAnalysisInformation: {
      question:
        'What is the state of practice for validating the quality of the annotated datasets?',
      requiredDataForAnalysis:
        'As a researcher, I want to ensure that available datasets are of good quality so that I can reuse them in my research. (Asked by: Sallam Abualhaija, Related ID Card: V.9)',
    },
  },

  // Query 7 - Datasets for NLP Tasks
  {
    title: 'Available Datasets for NLP4RE Tasks',
    id: 7,
    uid: 'query_7',
    dataAnalysisInformation: {
      question: 'What datasets exist for a certain NLP4RE task?',
      requiredDataForAnalysis:
        'As a researcher, I want to find all datasets for a certain NLP4RE task so that I can make a selection for my next paper. (Asked by: Fabiano Dalpiaz, Related ID Card: II.1 and IV)',
    },
  },

  // Query 8 - RE and NLP Task Combinations
  {
    title: 'RE and NLP Task Combinations',
    id: 8,
    uid: 'query_8',
    dataAnalysisInformation: {
      question: 'Which combinations of RE and NLP tasks are most (a)typical?',
      requiredDataForAnalysis:
        'As a researcher, I want to identify over- and under-explored tasks so that I can direct my research line. (Asked by: Fabiano Dalpiaz, Related ID Card: I.1 and II.1)',
    },
  },

  // Query 9 - Missing Values in ID Card
  {
    title: 'Missing ID Card Information',
    id: 9,
    uid: 'query_9',
    dataAnalysisInformation: {
      question:
        'Which ID-card informational elements do not provide enough options to respondents?',
      requiredDataForAnalysis:
        'As an ID card manager, I want to identify emerging research topics so that I can update the ID card options offered to respondents according to the state of the art. (Asked by: Xavier Franch, Affects: all ID card questions)',
    },
  },

  // Query 10 - Number of Annotators
  {
    title: 'Annotator Numbers by Study Type',
    id: 10,
    uid: 'query_10',
    dataAnalysisInformation: {
      question:
        'What are the usual numbers of annotators for a given type of study?',
      requiredDataForAnalysis:
        'As a researcher, I want to have an idea of how many annotators to recruit based on state of art so that I can estimate how expensive/feasible is a study. (Asked by: Davide Fucci, Related ID Card: V.1-V.4)',
    },
  },
];

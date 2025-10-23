/* eslint-disable @typescript-eslint/no-explicit-any */
//TODO: fix types and some styles
import { axisClasses } from '@mui/x-charts';
import {
  Query10DataProcessingFunction,
  Query11DataProcessingFunction,
  Query13DataProcessingFunction,
  Query1DataProcessingFunction,
  Query2DataProcessingFunctionForDataAnalysis,
  Query2DataProcessingFunctionForDataCollection,
  Query3DataProcessingFunction,
  Query4DataProcessingFunctionForDataAnalysis,
  Query4DataProcessingFunctionForDataCollection,
  Query5DataProcessingFunction,
  Query6DataProcessingFunctionForDataAnalysis,
  Query7DataProcessingFunction,
  Query8DataProcessingFunction,
  Query9DataProcessingFunction,
  Query12DataProcessingFunction,
  Query14DataProcessingFunction,
  Query16DataProcessingFunction,
} from './data_processing_helper_functions';

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
  // Query 1
  {
    title: 'Number of papers with an empirical study per year',
    id: 1,
    uid: 'query_1',
    chartType: 'bar',
    chartSettings: {
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      heading: 'Number of papers with an empirical study per year',
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of papers with an empirical study',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    // dataProcessingFunction: sortDataByYear,
    dataProcessingFunction: Query1DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the proportion of empirical studies evolved over time?',
    },
  },
  // Query 2
  {
    title:
      'Number of empirical methods used for data collection & data analysis per year',
    id: 2,
    uid: 'query_2_1',
    uid_2: 'query_2_2',
    chartSettings2: {
      heading: 'Number of empirical methods used for data analysis per year',
      seriesHeadingTemplate: 'Number of {label} used for data analysis',
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      colors: [
        '#4c72b0',
        '#dd8452',
        '#55a868',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
      ],
      yAxis: [
        {
          label: 'Number of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'descriptive', label: 'descriptive statistics' },
        { dataKey: 'inferential', label: 'inferential statistics' },
        { dataKey: 'machine_learning', label: 'machine learning statistics' },
        { dataKey: 'others', label: 'Other' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction2: Query2DataProcessingFunctionForDataAnalysis,
    chartSettings: {
      heading: 'Number of empirical methods used for data collection per year',
      seriesHeadingTemplate: 'Number of {label} used for data collection',
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      colors: [
        '#4c72b0',
        '#dd8452',
        '#55a868',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
      ],
      yAxis: [
        {
          label: 'Number of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study', label: 'Number of case studies' },
        { dataKey: 'experiment', label: 'Number of experiments' },
        { dataKey: 'survey', label: 'Number of surveys' },
        { dataKey: 'interview', label: 'Number of interviews' },
        {
          dataKey: 'secondary research',
          label: 'Number of secondary research',
        },
        { dataKey: 'action research', label: 'Number of action research' },
        { dataKey: 'others', label: 'Number of other' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query2DataProcessingFunctionForDataCollection,
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used over time?',
    },
  },
  // Query 3
  {
    title: 'Number of papers without an empirical study per year',
    id: 3,
    uid: 'query_3',
    chartSettings: {
      className: 'fullWidth',
      heading: 'Number of papers without an empirical study per year',

      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of papers without an empirical study',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },

    dataProcessingFunction: Query3DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the proportion of papers that do not have an empirical study evolved over time?',
    },
  },
  // Query 4
  {
    title: 'Number of empirical methods used for data analysis',
    id: 4,
    uid: 'query_4_1',
    uid_2: 'query_4_2',
    chartSettings2: {
      layout: 'horizontal',
      barLabel: 'value',
      heading: 'Number of empirical methods used for data analysis',
      seriesHeadingTemplate: 'Number of {label} used for data analysis',
      className: 'fullWidth fixText',
      xAxis: [{ label: 'Number of empirical method used' }],
      colors: ['#e86161'],
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'methodType',
          label: 'Empirical Method used',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
      margin: {
        left: 150,
      },
    },
    dataProcessingFunction2: Query4DataProcessingFunctionForDataCollection,
    chartSettings: {
      layout: 'horizontal',
      className: 'fullWidth fixText',
      heading: 'Number of empirical methods used for data collection',
      barLabel: 'value',
      xAxis: [{ label: 'Number of empirical method used' }],
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'methodType',
          label: 'Empirical Method used',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      margin: {
        left: 150,
        right: 20,
      },
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query4DataProcessingFunctionForDataAnalysis,
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used?',
    },
  },
  // Query 5
  {
    title:
      'Normalized number of empirical methods used for data collection per year',
    id: 5,
    uid: 'query_5',
    chartSettings: {
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
      heading:
        'Normalized number of empirical methods used for data collection per year',
      seriesHeadingTemplate:
        'Number of {label} used for data collection per year',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'experiment', label: 'Experiment' },
        { dataKey: 'case study', label: 'case study' },
        { dataKey: 'secondary research', label: 'Secondary research' },
        { dataKey: 'survey', label: 'Survey' },
        { dataKey: 'action research', label: 'action research' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query5DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How have the proportions of experiments, secondary research (reviews), surveys, case studies, and action research in the empirical methods used evolved over time?',
    },
  },
  // Query 6
  {
    title:
      'Number of statistical methods of descriptive statistics used for data analysis',
    id: 6,
    uid: 'query_6_2',
    uid_2: 'query_6_1',
    chartSettings2: {
      layout: 'horizontal',
      className: 'fullWidth fixText',
      heading:
        'number of statistical methods of descriptive statistics used for data analysis',
      barLabel: 'value',
      xAxis: [{ label: 'Number of Statistical Method used' }],
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'method',
          label: 'Statistical method used',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      margin: {
        left: 150,
      },
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction2: Query6DataProcessingFunctionForDataAnalysis,
    dataAnalysisInformation: {
      question: 'How often are which statistical methods used?',
    },
  },
  // Query 7
  {
    title:
      'number of statistical methods of descriptive statistics used for data analysis',
    id: 7,
    uid: 'query_7_2',
    uid_2: 'query_7_1',
    chartSettings2: {
      className: 'fullWidth',
      colors: [
        '#5975a4',
        '#cc8963',
        '#5f9e6e',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
        '#8c8c8c',
        '#ccb974',
        '#64b5cd',
        '#4c72b0',
      ],
      xAxis: xAxisSettings(),
      heading:
        'number of statistical method used for data analysis per year grouped by statistical method',
      yAxis: [
        {
          label: 'Proportion of statistical methods used',
        },
      ],
      tabs: {
        tab1_name: 'Inferential Statistics',
        tab2_name: 'Descriptive Statistics',
      },
      series: [
        { dataKey: 'count', label: 'Count' },
        { dataKey: 'percent', label: 'Percent' },
        { dataKey: 'mean', label: 'Mean' },
        { dataKey: 'median', label: 'Median' },
        { dataKey: 'mode', label: 'Mode' },
        { dataKey: 'minimum', label: 'Minimum' },
        { dataKey: 'maximum', label: 'Maximum' },
        { dataKey: 'range', label: 'Range' },
        { dataKey: 'variance', label: 'Variance' },
        { dataKey: 'standard_deviation', label: 'Standard Deviation' },
        { dataKey: 'boxplot', label: 'Boxplot' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction2: Query7DataProcessingFunction,
    dataAnalysisInformation: {
      question: 'How has the use of statistical methods evolved over time?',
    },
  },
  // Query 8
  {
    title: 'number of papers per year',
    id: 8,
    uid: 'query_8',
    chartSettings: {
      className: 'fullWidth',
      barLabel: 'value',

      xAxis: xAxisSettings(),
      heading: 'number of papers reporting threats to validity per year',
      yAxis: [
        {
          label: 'Proportion of papers reporting threats to validity',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query8DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the reporting of threats to validity evolved over time?',
    },
  },
  // Query 9
  {
    title: 'Number of papers per year',
    id: 9,
    uid: 'query_9',
    chartSettings: {
      layout: 'horizontal',
      className: 'fullWidth fixText',
      heading: 'number of threats to validity reported in papers',

      barLabel: 'value',
      xAxis: [{ label: 'Proportion of threats to validity reported' }],
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'method',
          label: 'Threats to validity reported',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
      margin: {
        left: 150,
      },
    },
    dataProcessingFunction: Query9DataProcessingFunction,
    dataAnalysisInformation: {
      question: 'What types of threats to validity do the authors report?',
    },
  },
  // Query 10
  {
    title: 'number of papers per year',
    id: 10,
    uid: 'query_10',
    chartSettings: {
      className: 'fullWidth',
      colors: [
        '#5975a4',
        '#cc8963',
        '#5f9e6e',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
        '#8c8c8c',
        '#ccb974',
        '#64b5cd',
        '#4c72b0',
      ],
      heading:
        'normalized number of case studies and action research used for data collection per year',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study', label: 'Case Study' },
        { dataKey: 'action research', label: 'Action Research' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query10DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How have the proportions of case studies and action research in the empirical methods used evolved over time?',
    },
  },
  //Query 11
  {
    title: 'number of papers per year',
    id: 11,
    uid: 'query_11',
    chartSettings: {
      className: 'fullWidth',

      heading:
        'number of papers that provide at least one URL to data per year',
      barLabel: 'value',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Number of papers with data',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query11DataProcessingFunction,

    dataAnalysisInformation: {
      question:
        'How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?',
    },
  },
  //Query 12
  {
    title: 'number of papers per year',
    id: 12,
    uid: 'query_12',

    chartSettings: {
      className: 'fullWidth fixText',
      xAxis: xAxisSettings(),
      colors: [
        '#4c72b0',
        '#dd8452',
        '#55a868',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
      ],
      heading:
        'number of papers with highlighted research question(s) and highlighted answers per year',
      noHeadingInSeries: true,
      yAxis: [
        {
          label: 'Numbers of papers',
        },
      ],
      series: [
        {
          dataKey: 'noRQHighlighted',
          label:
            'Number of papers without highlighted research question(s) and highlighted answers per year',
        },
        {
          dataKey: 'noRQHidden',
          label:
            'Number of papers without research question and hidden answers per year',
        },
        {
          dataKey: 'hqha',
          label:
            'Number of papers with highlighted research question(s) and highlighted answers per year',
        },
        {
          dataKey: 'hqhaHidden',
          label:
            'Number of papers with highlighted research question(s) and hidden answers per year',
        },
        {
          dataKey: 'hidqha',
          label:
            'Number of papers with hidden research question(s) and highlighted answers per year',
        },
        {
          dataKey: 'hidqhid',
          label:
            'Number of papers with hidden research question(s) and hidden answers per year',
        },
      ],
      height: chartHeight,
      sx: chartStyles,
      barCategoryGap: 0.1,
      barGap: 0.05,
      barWidth: 12,
      margin: {
        left: 60,
        right: 20,
        top: 150,
        bottom: 40,
      },
    },
    dataProcessingFunction: Query12DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the reporting of research questions and answers evolved over time?',
    },
  },
  //Query 13
  {
    title: 'number of papers per year',
    id: 13,
    uid: 'query_13',
    chartSettings: {
      layout: 'horizontal',
      className: 'fullWidth fixText2',
      heading: 'number of empirical methods used for secondary research',
      barLabel: 'value',
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'method',
          label: 'Empirical method used',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      xAxis: [{ label: 'Number of empirical method used' }],
      margin: {
        left: 190,
      },
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query13DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'What empirical methods are used to conduct integrative and interpretive (systematic literature) reviews, so-called secondary research?',
    },
  },
  //Query 14
  {
    title: 'number of papers per year',
    id: 14,
    uid: 'query_14',
    chartSettings: {
      colors: [
        '#5975a4',
        '#dd8452',
        '#55a868',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
        '#8c8c8c',
        '#ccb974',
        '#64b5cd',
      ],
      className: 'fullWidth',
      barCategoryGap: 0.1,
      barGap: 0.05,
      barWidth: 12,
      margin: {
        left: 60,
        right: 20,
        top: 120,
        bottom: 40,
      },
      heading:
        'number of empirical methods used for secondary research per year',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'archive_analysis', label: 'Archive Analysis' },
        {
          dataKey: 'systematic_literature_review',
          label: 'Systematic Literature Review',
        },
        {
          dataKey: 'literature_review',
          label: 'Literature Review',
        },
        {
          dataKey: 'systematic_literature_map',
          label: 'Systematic Literature Map',
        },
        {
          dataKey: 'systematic_review',
          label: 'Systematic Review',
        },
        {
          dataKey: 'tertiary_literature_review',
          label: 'Tertiary literature review',
        },
        {
          dataKey: 'document_analysis',
          label: 'Document analysis',
        },
        {
          dataKey: 'document_inspection',
          label: 'Document Inspection',
        },
        { dataKey: 'literature_study', label: 'Literature Study' },
        {
          dataKey: 'normalized_literature_survey',
          label: 'Literature Survey',
        },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: Query14DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the proportions of empirical methods to conduct (systematic literature) reviews, so-called secondary research, evolved over time?',
    },
  },
  // Query 15
  {
    title: 'number of papers per year',
    id: 15,
    uid: 'query_15_1',
    uid_2_merge: 'query_15_2',
    chartSettings: {
      className: 'fullWidth',
      barLabel: 'value',
      xAxis: xAxisSettings('numberOfMethodsUsed'),
      heading:
        'number of papers using X empirical methods for data collection and data analysis',
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction2: (rawData: any[], rawData2: any[]) => {
      //merge rawData and rawData2 based on paper and year in each object
      const mergedData = rawData.map((item) => {
        const item2 = rawData2.find(
          (item2) => item2.paper === item.paper && item2.year === item.year
        );
        return {
          ...item,
          ...item2,
        };
      });

      // count each papers keys other than paper and year {Number of empirical methods used, Number of Papers using X empirical methods}
      const countedData = mergedData.map((item) => {
        const keys = Object.keys(item).filter(
          (key) => key !== 'paper' && key !== 'year'
        );
        let numberOfMethodsUsed = 0;
        keys.forEach((key) => {
          numberOfMethodsUsed += Number(item[key]);
        });
        return {
          ...item,
          numberOfMethodsUsed,
        };
      });

      //sort data by count
      countedData.sort((a, b) => b.count - a.count);

      //count the number of papers in each count {numberOfMethodsUsed: number of papers, count: number of papers, normalizedRatio: number of papers / total number of papers}
      const result = countedData.reduce((acc, item) => {
        acc[item.numberOfMethodsUsed] =
          (acc[item.numberOfMethodsUsed] || 0) + 1;
        return acc;
      }, {});

      const arrayResult = Object.entries(result).map(([key, value]) => ({
        numberOfMethodsUsed: key,
        count: value,
        normalizedRatio:
          Number(((value as number) / countedData.length).toFixed(2)) || 0,
      }));

      return arrayResult;
    },
    dataAnalysisInformation: {
      question: 'How many different research methods are used per publication?',
    },
  },
  // Query 16
  {
    title: 'number of papers using X empirical methods per year',
    id: 16,
    uid: 'query_16_1',
    uid_2_merge: 'query_16_2',
    chartSettings: {
      className: 'fullWidth',
      colors: [
        '#5975a4',
        '#cc8963',
        '#5f9e6e',
        '#c44e52',
        '#8172b3',
        '#937860',
        '#da8bc3',
        '#8c8c8c',
        '#ccb974',
        '#64b5cd',
        '#4c72b0',
      ],
      barCategoryGap: 0.1,
      barGap: 0.05,
      barWidth: 12,
      margin: {
        left: 60,
        right: 20,
        top: 120,
        bottom: 40,
      },
      xAxis: xAxisSettings(),
      heading:
        'number of papers using X empirical methods for data collection and data analysis per year grouped by number of empirical methods',
      seriesHeadingTemplate: 'number of papers using {label} per year',
      yAxis: [{ label: 'Number of papers' }],
      series: [
        { dataKey: '1.0', label: '1 empirical methods' },
        { dataKey: '2.0', label: '2 empirical methods' },
        { dataKey: '3.0', label: '3 empirical methods' },
        { dataKey: '4.0', label: '4 empirical methods' },
        { dataKey: '5.0', label: '5 empirical methods' },
        { dataKey: '6.0', label: '6 empirical methods' },
        { dataKey: '7.0', label: '7 empirical methods' },
        { dataKey: '8.0', label: '8 empirical methods' },
        { dataKey: '9.0', label: '9 empirical methods' },
        { dataKey: '10.0', label: '10 empirical methods' },
        { dataKey: '12.0', label: '12 empirical methods' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction2: Query16DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the number of research methods used per publication evolved over time?',
    },
  },
];

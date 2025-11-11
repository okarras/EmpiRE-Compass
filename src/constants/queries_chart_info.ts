/* eslint-disable @typescript-eslint/no-explicit-any */
//TODO: fix types and some styles
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
  hideDetailedChartLegend?: boolean;
  detailedChartHeading?: string; //TODO: add to admin edit explanation in chart settings
}
export interface Query {
  title?: string;
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
    dataAnalysis?: string | string[];
    dataInterpretation?: string | string[];
    requiredDataForAnalysis?: string | string[];
  };
  tabs?: {
    tab1_name: string;
    tab2_name: string;
  };
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
  };
}

export const queries: Query[] = [
  // Query 1
  {
    title: 'number of papers with an empirical study per year',
    id: 1,
    uid: 'query_1',
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
      'number of empirical methods used for data collection & data analysis per year',
    id: 2,
    uid: 'query_2_1',
    uid_2: 'query_2_2',
    dataProcessingFunction2: Query2DataProcessingFunctionForDataAnalysis,
    dataProcessingFunction: Query2DataProcessingFunctionForDataCollection,
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used over time?',
    },
  },
  // Query 3
  {
    title: 'number of papers without an empirical study per year',
    id: 3,
    uid: 'query_3',
    dataProcessingFunction: Query3DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the proportion of papers that do not have an empirical study evolved over time?',
    },
  },
  // Query 4
  {
    title: 'number of empirical methods used for data analysis',
    id: 4,
    uid: 'query_4_1',
    uid_2: 'query_4_2',
    dataProcessingFunction2: Query4DataProcessingFunctionForDataAnalysis,
    dataProcessingFunction: Query4DataProcessingFunctionForDataCollection,
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used?',
    },
  },
  // Query 5
  {
    title:
      'normalized number of empirical methods used for data collection per year',
    id: 5,
    uid: 'query_5',
    dataProcessingFunction: Query5DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How have the proportions of experiments, secondary research (reviews), surveys, case studies, and action research in the empirical methods used evolved over time?',
    },
  },
  // Query 6
  {
    title:
      'number of statistical methods of descriptive statistics used for data analysis',
    id: 6,
    uid: 'query_6_2',
    uid_2: 'query_6_1',
    dataProcessingFunction2: Query6DataProcessingFunctionForDataAnalysis,
    dataAnalysisInformation: {
      question: 'How often are which statistical methods used?',
    },
    tabs: {
      tab1_name: 'Descriptive statistics',
      tab2_name: 'Inferential statistics',
    },
  },
  // Query 7
  {
    title:
      'number of statistical methods of descriptive statistics used for data analysis',
    id: 7,
    uid: 'query_7_2',
    uid_2: 'query_7_1',
    tabs: {
      tab1_name: 'Descriptive statistics',
      tab2_name: 'Inferential statistics',
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
    dataProcessingFunction: Query8DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the reporting of threats to validity evolved over time?',
    },
  },
  // Query 9
  {
    title: 'number of papers per year',
    id: 9,
    uid: 'query_9',
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
    dataProcessingFunction: Query13DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'What empirical methods are used to conduct integrative and interpretive (systematic literature) reviews, so-called secondary research?',
    },
  },
  //Query 14
  {
    title: 'normalized empirical methods for secondary research per year',
    id: 14,
    uid: 'query_14',
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
          Number((((value as number) / countedData.length) * 100).toFixed(2)) ||
          0,
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
    dataProcessingFunction2: Query16DataProcessingFunction,
    dataAnalysisInformation: {
      question:
        'How has the number of research methods used per publication evolved over time?',
    },
  },
];

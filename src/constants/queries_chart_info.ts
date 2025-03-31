/* eslint-disable @typescript-eslint/no-explicit-any */
//TODO: fix types and some styles
import { axisClasses } from '@mui/x-charts';
import {
  aggregateMethodUsage,
  processMethodDistribution,
  processYearlyMethodData,
  RawDataItem,
  sortDataByCount,
  SortDataByCountReturnInterface,
  sortDataByYear,
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
      valueFormatter: (v: any) => v.toString(),
      tickPlacement: 'middle',
      label: label,
    },
  ];
}

export interface ChartSetting {
  heading?: string;
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
}
export interface Query {
  title: string;
  id: number;
  uid: string;
  chartSettings: ChartSetting;
  //TODO: fix types
  dataProcessingFunction: (data: any, query_id?: string) => any[];
  dataAnalysisInformation: {
    question: string;
  };
}

export const queries: Query[] = [
  // Query 1
  {
    title: 'Number of papers per year',
    id: 1,
    uid: 'query_1',
    chartSettings: {
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      heading: 'Number of papers without an empirical study per year',
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of papers without an empirical study',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the proportion of empirical studies evolved over time?',
    },
  },
  //Query 2.1
  {
    title: 'Number of papers per year',
    id: 2.1,
    uid: 'query_2_1',
    chartSettings: {
      heading: 'Number of emperical methods used for data collection per year',
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
        { dataKey: 'case study', label: 'case study' },
        { dataKey: 'experiment', label: 'Experiment' },
        { dataKey: 'survey', label: 'Survey' },
        { dataKey: 'interview', label: 'Interview' },
        { dataKey: 'secondary research', label: 'Secondary research' },
        { dataKey: 'action research', label: 'action research' },
        { dataKey: 'others', label: 'Other' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: (
      rawData: { year: number; dc_method_type_label: string }[]
    ) => {
      // Extract unique years and map them into an array of objects
      const years = [...new Set(rawData.map((item) => item.year))].map(
        (year) => ({ year })
      );

      // Define valid method labels
      const validMethods = new Set([
        'action research',
        'case study',
        'experiment',
        'interview',
        'secondary research',
        'survey',
      ]);

      const processedData = years.map(({ year }) => {
        const filteredData = rawData.filter((item) => item.year === year);
        const result: { year: number; total: number; [key: string]: number } = {
          year,
          total: 0,
        };

        filteredData.forEach(({ dc_method_type_label }) => {
          const key = validMethods.has(dc_method_type_label)
            ? dc_method_type_label
            : 'others';
          result[key] = (result[key] || 0) + 1;
          result.total += 1;
        });

        // Compute ratios
        Object.keys(result).forEach((key) => {
          if (key !== 'year' && key !== 'total') {
            result[`${key} ratio`] = Number(
              (result[key] / result.total).toFixed(2)
            );
          }
        });

        return result;
      });

      return processedData.sort((a, b) => a.year - b.year);
    },
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used over time?',
    },
  },
  //Query 3
  {
    title: 'Number of papers per year',
    id: 3,
    uid: 'query_3',
    chartSettings: {
      className: 'fullWidth',
      heading:
        'Normalized number of papers without an empirical study per year',

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

    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the proportion of papers that do not have an empirical study evolved over time?',
    },
  },
  //Query 5
  {
    title: 'Number of papers per year',
    id: 5,
    uid: 'query_5',
    chartSettings: {
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
      heading:
        'Normalized number of empirical methods used for data collection per year',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'experiment ratio', label: 'Experiment' },
        { dataKey: 'case study ratio', label: 'case study' },
        { dataKey: 'secondary research ratio', label: 'Secondary research' },
        { dataKey: 'survey ratio', label: 'Survey' },
        { dataKey: 'action research ratio', label: 'action research' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How have the proportions of experiments, secondary research (reviews), surveys, case studies, and action research in the empirical methods used evolved over time?',
    },
  },
  //Query 6.1
  {
    title: 'Number of papers per year',
    id: 6.1,
    uid: 'query_6_1',
    chartSettings: {
      layout: 'horizontal',
      className: 'fullWidth fixText',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
      heading:
        'Number of statistical methods of descriptive statistics used for data analysis',
      barLabel: 'value',
      xAxis: [{ label: 'Number of Statistical Method used' }],
      yAxis: [
        {
          scaleType: 'band',
          dataKey: 'method',
          label: 'Statistical Method used',
        },
      ],
      series: [{ dataKey: 'count' }],
      margin: {
        left: 150,
      },
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByCount,
    dataAnalysisInformation: {
      question: 'How often are which statistical methods used?',
    },
  },
  //Query 7.1
  {
    title: 'Number of papers per year',
    id: 7.1,
    uid: 'query_7_1',
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
      xAxis: xAxisSettings(),
      heading:
        'Number of statistical methods of descriptive statistics used for data analysis per year',
      yAxis: [
        {
          label: 'Number of statistical methods used',
        },
      ],
      series: [
        { dataKey: 'count', label: 'count' },
        { dataKey: 'percent', label: 'percent' },
        { dataKey: 'mean', label: 'mean' },
        { dataKey: 'median', label: 'median' },
        { dataKey: 'mode', label: 'mode' },
        { dataKey: 'minimum', label: 'minimum' },
        { dataKey: 'maximum', label: 'maximum' },
        { dataKey: 'range', label: 'range' },
        { dataKey: 'variance', label: 'variance' },
        { dataKey: 'standard_deviation', label: 'standard_deviation' },
        { dataKey: 'boxplot', label: 'boxplot' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question: 'How has the use of statistical methods evolved over time?',
    },
  },
  //Query 8
  {
    title: 'Number of papers per year',
    id: 8,
    uid: 'query_8',
    chartSettings: {
      className: 'fullWidth',
      barLabel: 'value',

      xAxis: xAxisSettings(),
      heading: 'Number of papers reporting threats to validity per year',
      yAxis: [
        {
          label: 'Number of papers reporting threats to validity',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the reporting of threats to validity evolved over time?',
    },
  },
  //Query 9
  {
    title: 'Number of papers per year',
    id: 9,
    uid: 'query_9',
    chartSettings: {
      layout: 'horizontal',
      className: 'fullWidth fixText',
      heading: 'Number of threats to validity reported in papers',

      barLabel: 'value',
      xAxis: [{ label: 'Number of threats to validity reported' }],
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
    dataProcessingFunction: aggregateMethodUsage,
    dataAnalysisInformation: {
      question: 'What types of threats to validity do the authors report?',
    },
  },
  //Query 10
  {
    title: 'Number of papers per year',
    id: 10,
    uid: 'query_10',
    chartSettings: {
      className: 'fullWidth',
      colors: ['#5975a4', '#dd8452'],
      heading:
        'Normalized number of case studies and action research used for data collection per year',
      barLabel: 'value',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study ratio', label: 'Case Study' },
        { dataKey: 'action research ratio', label: 'Action Research' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How have the proportions of case studies and action research in the empirical methods used evolved over time?',
    },
  },
  //Query 11
  {
    title: 'Number of papers per year',
    id: 11,
    uid: 'query_11',
    chartSettings: {
      className: 'fullWidth',

      heading:
        'Number of papers that provide at least one URL to data per year',
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
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?',
    },
  },
  //Query 12 TODO: this query should be checked
  {
    title: 'Number of papers per year',
    id: 12,
    uid: 'query_12',
    chartSettings: {
      barLabel: 'value',
      xAxis: xAxisSettings(),
      heading:
        'Number of papers with highlighted research question(s) and highlighted answers per year',
      yAxis: [
        {
          label: 'Numbers of papers',
        },
      ],
      series: [{ dataKey: 'highlighted_q' }, { dataKey: 'highlighted_a' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the reporting of research questions and answers evolved over time?',
    },
  },
  //Query 13
  {
    title: 'Number of papers per year',
    id: 13,
    uid: 'query_13',
    chartSettings: {
      layout: 'horizontal',
      className: 'fullWidth fixText2',
      heading: 'Number of empirical methods used for secondary research',
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
    dataProcessingFunction: (
      rawData: RawDataItem[] = []
    ): SortDataByCountReturnInterface[] => {
      if (!rawData.length) return [];

      const methodCount: Record<string, number> = {};

      rawData.forEach(({ dc_method_name }) => {
        methodCount[dc_method_name as string] =
          (methodCount[dc_method_name as string] || 0) + 1;
      });

      const result: SortDataByCountReturnInterface[] = Object.entries(
        methodCount
      ).map(([method, count]) => ({
        method,
        count,
        normalizedRatio: Number((count / rawData.length).toFixed(2)),
      }));

      return result.sort((a, b) => b.count - a.count);
    },
    dataAnalysisInformation: {
      question:
        'What empirical methods are used to conduct integrative and interpretive (systematic literature) reviews, so-called secondary research?',
    },
  },
  //Query 14
  {
    title: 'Number of papers per year',
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
      heading:
        'Normalized number of empirical methods used for secondary research per year',
      barLabel: 'value',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_archive_analysis', label: 'Archive Analysis' },
        {
          dataKey: 'normalized_systematic_literature_review',
          label: 'Systematic Literature Review',
        },
        {
          dataKey: 'normalized_literature_review',
          label: 'Literature Review',
        },
        {
          dataKey: 'normalized_systematic_literature_map',
          label: 'Systematic Literature Map',
        },
        {
          dataKey: 'normalized_systematic_review',
          label: 'Systematic Review',
        },
        {
          dataKey: 'normalized_tertiary_literature_review',
          label: 'Tertiary literature review',
        },
        {
          dataKey: 'normalized_document_analysis',
          label: 'Document analysis',
        },
        {
          dataKey: 'normalized_document_inspection',
          label: 'Document Inspection',
        },
        { dataKey: 'normalized_literature_study', label: 'Literature Study' },
        {
          dataKey: 'normalized_literature_survey',
          label: 'Literature Survey',
        },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: processYearlyMethodData,
    dataAnalysisInformation: {
      question:
        'How has the proportions of empirical methods to conduct (systematic literature) reviews, so-called secondary research, evolved over time?',
    },
  },
  // Query 15 TODO: check if this is correct
  {
    title: 'Number of papers per year',
    id: 15.1,
    uid: 'query_15_1',
    chartSettings: {
      className: 'fullWidth',
      barLabel: 'value',
      xAxis: xAxisSettings('methodDistribution'),
      heading:
        'Number of papers using X empirical methods for data collection and data analysis',
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [{ dataKey: 'normalizedRatio' }],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: processMethodDistribution,
    dataAnalysisInformation: {
      question: 'How many different research methods are used per publication?',
    },
  },
];

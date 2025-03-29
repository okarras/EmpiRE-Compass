/* eslint-disable @typescript-eslint/no-explicit-any */
//TODO: fix types and some styles
import { axisClasses } from '@mui/x-charts';
import {
  aggregateMethodUsage,
  processMethodDistribution,
  processYearlyMethodData,
  sortDataByCount,
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
      valueFormatter: (v) => v.toString(),
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
}
export interface Query {
  title: string;
  id: number;
  uid: string;
  chartSettings: ChartSetting[];
  dataProcessingFunction: (data: any, data2?: any) => Record<string, unknown>[];
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
    chartSettings: [
      {
        yAxis: [
          {
            label: 'number of papers',
          },
        ],
        series: [{ dataKey: 'count' }],
        height: chartHeight,
        sx: chartStyles,
        className: 'fullWidth',
        xAxis: [
          {
            scaleType: 'band',
            dataKey: 'year',
          },
        ],
      },
    ],
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the proportion of empirical studies evolved over time?',
    },
  },
  //Query 2.1
  {
    title: 'Number of papers per year',
    id: 2_1,
    uid: 'query_2_1',
    chartSettings: [
      {
        heading:
          'Number of emperical methods used for data collection per year',
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
      {
        heading: 'Number of case studies used for data collection per year',
        xAxis: xAxisSettings(),
        colors: ['#4c72b0'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of case studies',
          },
        ],
        series: [{ dataKey: 'case study' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading: 'Number of experiments used for data collection per year',
        colors: ['#dd8452'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of experiments',
          },
        ],
        series: [{ dataKey: 'experiment' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading: 'Number of surveys used for data collection per year',
        colors: ['#5f9e6e'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of survey',
          },
        ],
        series: [{ dataKey: 'survey' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading: 'Number of interviews used for data collection per year',
        colors: ['#b55d60'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of interview',
          },
        ],
        series: [{ dataKey: 'interview' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Number Of secondary research used for data collection per year',
        colors: ['#857aab'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of secondary research',
          },
        ],
        series: [{ dataKey: 'secondary research' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        colors: ['#8d7866'],
        heading: 'Number Of actions research used for data collection per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of action research',
          },
        ],
        series: [{ dataKey: 'action research' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        colors: ['#d095bf'],
        heading: 'Number of other methods used for data collection per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of others',
          },
        ],
        series: [{ dataKey: 'others' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        heading:
          'Normalized number of empirical methods used for data collection per year',
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
            label: 'Proportion of empirical methods used',
          },
        ],
        series: [
          { dataKey: 'case study ratio', label: 'case study' },
          { dataKey: 'experiment ratio', label: 'Experiment' },
          { dataKey: 'survey ratio', label: 'Survey' },
          { dataKey: 'interview ratio', label: 'Interview' },
          { dataKey: 'secondary research ratio', label: 'Secondary research' },
          { dataKey: 'action research ratio', label: 'action research' },
          { dataKey: 'others ratio', label: 'Other' },
        ],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number Of case studies used for data collection per year',
        colors: ['#4c72b0'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of case studies',
          },
        ],
        series: [{ dataKey: 'case study ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number Of experiments used for data collection per year',
        colors: ['#dd8452'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of experiments',
          },
        ],
        series: [{ dataKey: 'experiment ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of surveys used for data collection per year',
        colors: ['#5f9e6e'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of survey',
          },
        ],
        series: [{ dataKey: 'survey ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of interviews used for data collection per year',
        colors: ['#b55d60'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of interview',
          },
        ],
        series: [{ dataKey: 'interview ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of secondary research used for data collection per year',
        colors: ['#857aab'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of secondary research',
          },
        ],
        series: [{ dataKey: 'secondary research ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of actions research used for data collection per year',
        colors: ['#8d7866'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of action research',
          },
        ],
        series: [{ dataKey: 'action research ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of other methods used for data collection per year',
        colors: ['#d095bf'],
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of others',
          },
        ],
        series: [{ dataKey: 'others ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
        className: 'fullWidth',
        colors: ['#5975a4'],
        xAxis: xAxisSettings(),
        heading: 'Number of papers without an empirical study per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of papers without an empirical study',
          },
        ],
        series: [{ dataKey: 'count' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        className: 'fullWidth',
        heading:
          'Normalized number of papers without an empirical study per year',
        colors: ['#5975a4'],
        xAxis: xAxisSettings(),
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of papers without an empirical study',
          },
        ],
        series: [{ dataKey: 'ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
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
      {
        colors: ['#5975a4'],
        heading:
          'Normalized number of experiments used for data collection per year',
        xAxis: xAxisSettings(),
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of experiments',
          },
        ],
        series: [{ dataKey: 'experiment ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of case studies used for data collection per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of case studies',
          },
        ],
        series: [{ dataKey: 'case study ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5f9e6e'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of secondary research used for data collection per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of secondary research',
          },
        ],
        series: [{ dataKey: 'secondary research ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#857aab'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of surveys used for data collection per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of survey',
          },
        ],
        series: [{ dataKey: 'survey ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8d7866'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of actions research used for data collection per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of action research',
          },
        ],
        series: [{ dataKey: 'action research ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
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
      {
        layout: 'horizontal',
        className: 'fullWidth fixText',
        colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
        heading:
          'Normalized number of statistical methods of descriptive statistics used for data analysis',
        barLabel: 'value',
        xAxis: [{ label: 'Proportion of Statistical Method used' }],
        yAxis: [
          {
            scaleType: 'band',
            dataKey: 'method',
            label: 'Statistical Method used',
          },
        ],
        series: [{ dataKey: 'ratio' }],
        margin: {
          left: 150,
        },
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
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
      {
        colors: ['#5975a4'],
        xAxis: xAxisSettings(),
        heading: 'Number of count method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of count methods',
          },
        ],
        series: [{ dataKey: 'count' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        xAxis: xAxisSettings(),
        heading: 'Number of percent method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of precent method',
          },
        ],
        series: [{ dataKey: 'percent' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5f9e6e'],
        xAxis: xAxisSettings(),
        heading: 'Number of mean method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of mean method',
          },
        ],
        series: [{ dataKey: 'mean' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#c44e52'],
        xAxis: xAxisSettings(),
        heading: 'Number of median method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of median method',
          },
        ],
        series: [{ dataKey: 'median' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8172b3'],
        xAxis: xAxisSettings(),
        heading: 'Number of mode method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of mode method',
          },
        ],
        series: [{ dataKey: 'mode' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#937860'],
        xAxis: xAxisSettings(),
        heading: 'Number of minimum method used for data analyis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of minimum method',
          },
        ],
        series: [{ dataKey: 'minimum' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#da8bc3'],
        xAxis: xAxisSettings(),
        heading: 'Number Of maximum method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of maximum method',
          },
        ],
        series: [{ dataKey: 'maximum' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8c8c8c'],
        xAxis: xAxisSettings(),
        heading: 'Number of range method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of range method',
          },
        ],
        series: [{ dataKey: 'range' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#ccb974'],
        xAxis: xAxisSettings(),
        heading: 'Number of variance method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of variance method',
          },
        ],
        series: [{ dataKey: 'variance' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#64b5cd'],
        xAxis: xAxisSettings(),
        heading:
          'Number of standard deviation method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of standard_deviation method',
          },
        ],
        series: [{ dataKey: 'standard_deviation' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#4c72b0'],
        xAxis: xAxisSettings(),
        heading: 'Number of boxplot method used tor data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Number of boxplot method',
          },
        ],
        series: [{ dataKey: 'boxplot' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
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
          'Normalized statistical methods of descriptive statistics used for data analysis per year',
        yAxis: [
          {
            label: 'Proportion of statistical methods used',
          },
        ],
        series: [
          { dataKey: 'count_normalized', label: 'count' },
          { dataKey: 'percent_normalized', label: 'percent' },
          { dataKey: 'mean_normalized', label: 'mean' },
          { dataKey: 'median_normalized', label: 'median' },
          { dataKey: 'mode_normalized', label: 'mode' },
          { dataKey: 'minimum_normalized', label: 'minimum' },
          { dataKey: 'maximum_normalized', label: 'maximum' },
          { dataKey: 'range_normalized', label: 'range' },
          { dataKey: 'variance_normalized', label: 'variance' },
          {
            dataKey: 'standard_deviation_normalized',
            label: 'standard_deviation',
          },
          { dataKey: 'boxplot_normalized', label: 'boxplot' },
        ],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5975a4'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of count method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of count methods',
          },
        ],
        series: [{ dataKey: 'count_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of precent method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of precent method',
          },
        ],
        series: [{ dataKey: 'percent_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5f9e6e'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of mean method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of mean method',
          },
        ],
        series: [{ dataKey: 'mean_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#c44e52'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of median method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of median method',
          },
        ],
        series: [{ dataKey: 'median_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8172b3'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of mode method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of mode method',
          },
        ],
        series: [{ dataKey: 'mode_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#937860'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of minimum method used for data analyis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of minimum method',
          },
        ],
        series: [{ dataKey: 'minimum_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#da8bc3'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of maximum method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of maximum method',
          },
        ],
        series: [{ dataKey: 'maximum_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8c8c8c'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of range method used for data analyis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of range method',
          },
        ],
        series: [{ dataKey: 'range_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#ccb974'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of variance method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of variance method',
          },
        ],
        series: [{ dataKey: 'variance_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#64b5cd'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of standard deviation method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of standard_deviation method',
          },
        ],
        series: [{ dataKey: 'standard_deviation_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#4c72b0'],
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of boxplot method used for data analysis per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of boxplot method',
          },
        ],
        series: [{ dataKey: 'boxplot_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
        className: 'fullWidth',
        barLabel: 'value',
        colors: ['#5975a4'],
        xAxis: xAxisSettings(),
        heading: 'Number of papers reporting threats to validity per year',
        yAxis: [
          {
            label: 'Number of papers reporting threats to validity',
          },
        ],
        series: [{ dataKey: 'total' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5975a4'],
        className: 'fullWidth',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of papers reporting threats to validity per year',
        barLabel: 'value',
        yAxis: [
          {
            label: 'Proportion of papers reporting threats to validity',
          },
        ],
        series: [{ dataKey: 'normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
        layout: 'horizontal',
        className: 'fullWidth fixText',
        heading: 'Number of threats to validity reported in papers',
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: [{ label: 'Number of threats to validity reported' }],
        yAxis: [
          {
            scaleType: 'band',
            dataKey: 'method',
            label: 'Threats to validity reported',
          },
        ],
        series: [{ dataKey: 'count' }],
        height: chartHeight,
        sx: chartStyles,
        margin: {
          left: 150,
        },
      },
      {
        layout: 'horizontal',
        className: 'fullWidth fixText',
        heading: 'Normalized number of threats to validity reported in papers',
        colors: ['#5975a4'],
        barLabel: 'value',
        margin: {
          left: 150,
        },
        xAxis: [{ label: 'Proportion of threats to validity reported' }],
        yAxis: [
          {
            scaleType: 'band',
            dataKey: 'method',
            label: 'Threats to validity reported',
          },
        ],
        series: [{ dataKey: 'normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
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
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of case studies used for data collection per year',
        yAxis: [
          {
            label: 'Proportions of case studies',
          },
        ],
        series: [{ dataKey: 'case study ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#dd8452'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of action research used for data collection per year',
        yAxis: [
          {
            label: 'Proportions of action research',
          },
        ],
        series: [{ dataKey: 'action research ratio' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
        className: 'fullWidth',
        colors: ['#5975a4'],
        heading:
          'Number of papers that provide at least one URL to data per year',
        barLabel: 'value',
        xAxis: xAxisSettings(),
        yAxis: [
          {
            label: 'Number of papers with data',
          },
        ],
        series: [{ dataKey: 'count' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        className: 'fullWidth',
        heading:
          'Normalized number of papers that provide at least one URL to data per year',
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        yAxis: [
          {
            label: 'Proportions of papers with data',
          },
        ],
        series: [{ dataKey: 'normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?',
    },
  },
  //Query 12
  {
    title: 'Number of papers per year',
    id: 12,
    uid: 'query_12',
    chartSettings: [
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Number of papers with highlighted research question(s) and highlighted answers per year',
        yAxis: [
          {
            label: 'Numbers of papers',
          },
        ],
        series: [{ dataKey: 'high_q_high_a' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Number of papers with highlighted research question(s) and hidden answers per year',
        yAxis: [
          {
            label: 'Numbers of papers',
          },
        ],
        series: [{ dataKey: 'high_q_hid_a' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5f9e6e'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Number of papers with hidden research question(s) and highlighted answers per year',
        yAxis: [
          {
            label: 'Numbers of papers',
          },
        ],
        series: [{ dataKey: 'hid_q_high_a' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#b55d60'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Number of papers with hidden research questions(s) and hidden answers per year',
        yAxis: [
          {
            label: 'Numbers of papers',
          },
        ],
        series: [{ dataKey: 'hid_q_hid_a' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Proportion of papers With highlighted research question(s) and highlighted answers per year',
        yAxis: [
          {
            label: 'Proportions of papers',
          },
        ],
        series: [{ dataKey: 'high_q_high_a_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Proportion of papers with highlighted research question(s) and hidden answers per year',
        yAxis: [
          {
            label: 'Proportions of papers',
          },
        ],
        series: [{ dataKey: 'high_q_hid_a_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5f9e6e'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Proportion of papers with hidden research question(s) and highlighted answers per year',
        yAxis: [
          {
            label: 'Proportions of papers',
          },
        ],
        series: [{ dataKey: 'hid_q_high_a_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#b55d60'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Proportion of papers with hidden research question(s) and hidden answers per year',
        yAxis: [
          {
            label: 'Proportions of papers',
          },
        ],
        series: [{ dataKey: 'hid_q_hid_a_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Number of papers without research question and highlighted answers per year',
        yAxis: [
          {
            label: 'Number of papers',
          },
        ],
        series: [{ dataKey: 'no_rq_high_a' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        barLabel: 'value',
        heading:
          'Number of papers without research question and hidden answers per year',
        xAxis: xAxisSettings(),
        yAxis: [
          {
            label: 'Number of papers',
          },
        ],
        series: [{ dataKey: 'no_rq_hid_a' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Proportion of papers without research question and highlighted answers per year',
        yAxis: [
          {
            label: 'Proportions of papers',
          },
        ],
        series: [{ dataKey: 'no_rq_high_a_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Proportion of papers without research question and hidden answers per year',
        yAxis: [
          {
            label: 'Proportions of papers',
          },
        ],
        series: [{ dataKey: 'no_rq_hid_a_normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
      {
        layout: 'horizontal',
        className: 'fullWidth fixText2',
        heading: 'Number of empirical methods used for secondary research',
        colors: ['#5975a4'],
        barLabel: 'value',
        yAxis: [
          {
            scaleType: 'band',
            dataKey: 'method',
            label: 'Empirical method used',
          },
        ],
        series: [{ dataKey: 'count' }],
        xAxis: [{ label: 'Number of empirical method used' }],
        margin: {
          left: 190,
        },
        height: chartHeight,
        sx: chartStyles,
      },
      {
        layout: 'horizontal',
        className: 'fullWidth fixText2',
        heading:
          'Normalized number of empirical methods used for secondary research',
        colors: ['#5975a4'],
        barLabel: 'value',
        yAxis: [
          {
            scaleType: 'band',
            dataKey: 'method',
            label: 'Empirical method used',
          },
        ],
        xAxis: [{ label: 'Proportion of empirical method used' }],
        margin: {
          left: 190,
        },
        series: [{ dataKey: 'normalized' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
    dataProcessingFunction: sortDataByCount,
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
    chartSettings: [
      {
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
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of archive analysis used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of archive analysis',
          },
        ],
        series: [{ dataKey: 'normalized_archive_analysis' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#cc8963'],
        barLabel: 'value',
        heading:
          'Normalized number of systematic literature review used for secondary research per year',
        xAxis: xAxisSettings(),
        yAxis: [
          {
            label: 'Proportions of systematic literature review',
          },
        ],
        series: [{ dataKey: 'normalized_systematic_literature_review' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5f9e6e'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of literature review used tor secondary research per year',
        yAxis: [
          {
            label: 'Proportions of literature review',
          },
        ],
        series: [{ dataKey: 'normalized_literature_review' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#857aab'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of systematic literature map used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of systematic literature map',
          },
        ],
        series: [{ dataKey: 'normalized_systematic_literature_map' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8d7866'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of systematic review used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of systematic review',
          },
        ],
        series: [{ dataKey: 'normalized_systematic_review' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#d095bf'],
        barLabel: 'value',
        heading:
          'Normalized number of tertiary literature review used for secondary research per year',
        xAxis: xAxisSettings(),
        yAxis: [
          {
            label: 'Proportions of tertiary literature review',
          },
        ],
        series: [{ dataKey: 'tertiary_literature_review' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#8c8c8c'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of document analysis used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of document analysis',
          },
        ],
        series: [{ dataKey: 'normalized_document_analysis' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#c1b37f'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of document inspection used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of document inspection',
          },
        ],
        series: [{ dataKey: 'normalized_document_inspection' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#71aec0'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of literature study used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of literature study',
          },
        ],
        series: [{ dataKey: 'normalized_literature_study' }],
        height: chartHeight,
        sx: chartStyles,
      },
      {
        colors: ['#5975a4'],
        barLabel: 'value',
        xAxis: xAxisSettings(),
        heading:
          'Normalized number of literature survey used for secondary research per year',
        yAxis: [
          {
            label: 'Proportions of literature survey',
          },
        ],
        series: [{ dataKey: 'normalized_literature_survey' }],
        height: chartHeight,
        sx: chartStyles,
      },
    ],
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
    chartSettings: [
    {
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings('methodDistribution'),
      heading: 'Number of papers using X empirical methods for data collection and data analysis',
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'count'},
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: processMethodDistribution,
    dataAnalysisInformation:{
      question: 'How many different research methods are used per publication?'
    }
  },
];

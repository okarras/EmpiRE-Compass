/* eslint-disable @typescript-eslint/no-explicit-any */
//TODO: fix types and some styles
import { axisClasses } from '@mui/x-charts';
import {
  aggregateMethodUsage,
  countDataAnalysisStatisticsMethods,
  countMethodDistribution,
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

type StatisticalData = {
  year: number;
  da_label: string; // Type of data analysis
  count: number;
  mean: number;
  median: number;
  standard_deviation: number;
  variance: number;
  mode: number;
  range: number;
  maximum: number;
  minimum: number;
};

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
    dataProcessingFunction: sortDataByYear,
    dataAnalysisInformation: {
      question:
        'How has the proportion of empirical studies evolved over time?',
      questionExplanation:
        'According to Sjøberg et al. (2007), the "current" state of practice (2007) shows that there are relatively few empirical studies. For the target state (2020 - 2025), Sjøberg et al. (2007) envision a large number of studies. This predicted change from a few to a large number of empirical studies leads to the corresponding competency question.',
      dataAnalysis:
        'For this data analysis, we select all papers that have an empirical study according to our definition (data collection and data analysis). For this reason, we remove all papers that have "no collection" and/or "no analysis". In addition, a paper can involve more than one empirical method for data collection and data analysis so that we must exclude duplicate papers. In this way, we can determine the number of all unique papers. For more detailed insights, we normalize the number of all papers with an empirical study based on the number of all unique papers per year, as the total number of papers per year varies.',
      dataInterpretation:
        'Based on the figure "Normalized number of papers with an empirical study per year", an increasing proportion of empirical studies can be observed over time. While before 2010 the average proportion of papers with an empirical study is 69.5%, the average proportion for the period 2010 - 2019 is 85.2%. For the target state (2020 - 2025), the average proportion of papers with an empirical study is 94.3%. Based on these data, we observe a positive development towards the vision of Sjøberg et al. (2007) that the large number of studies envisioned for the target state (2020 - 2025) can be achieved.',
      requiredDataForAnalysis:
        'We must retrieve all papers with their publication year that use our ORKG template and report an empirical study. However, we need to define what we mean by an empirical study. According to Empirical Software Engineering Journal, "Empirical studies presented here usually involve the collection and analysis of data and experience...". For this reason, we define that an empirical study is a study that includes data analysis as a necessary condition to be a study (Necessity) and data collection as a sufficient condition to be an empirical study (Sufficiency). Thus, a study must always include data analysis and an empirical study must include data collection and data analysis. We do not consider the mere reporting of a data collection as a study or even an empirical study.',
    },
  },
  //Query 2
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
    dataProcessingFunction2: countDataAnalysisStatisticsMethods,
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
    dataProcessingFunction: countMethodDistribution,
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used over time?',
      questionExplanation:
        'According to Sjøberg et al. (2007), the "current" state of practice (2007) shows a that there are relatively few empirical studies. For the target state (2020 - 2025), Sjøberg et al. (2007) envision a large number of studies [...] using different empirical methods. This predicted change from a few to a large number of empirical studies using different empirical methods leads to the corresponding competency question.',
      requiredDataForAnalysis:
        'We must retrieve all papers with their publication year that use our ORKG template and report on the use of empirical methods. According to Dan (2017), empirical methods include data collection and data analysis. An empirical method can therefore be a method for data collection and data analysis. We consider the empirical method used for data collection or data analysis respectively, as our template allows for a correspondingly more fine-grained analysis.',
      dataAnalysis:
        'For this data analysis, we consider the empirical methods used for data collection. We identify the empirical methods used for data collection. A paper can involve more than one empirical method for data collection so that the number of empirical methods can be larger than the number of papers. In addition, the number of papers per year varies. For this reason, we normalize the number of empirical methods used based on the number of all unique papers per year.',
      //TODO
      dataInterpretation: '',
    },
  },
  //Query 3
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

    dataProcessingFunction: (rawData) =>
      sortDataByYear(rawData, '3', { reversed: true }),
    dataAnalysisInformation: {
      question:
        'How has the proportion of papers that do not have an empirical study evolved over time?',
      questionExplanation:
        'For the target state (2020 - 2025), Sjøberg et al. (2007) envision that there should be good reason for not including a proper evaluation. This predicted state leads to the corresponding competency question.',
      requiredDataForAnalysis:
        'We must retrieve all papers with their publication year that use our ORKG template and do not report an empirical study. However, we need to define what we mean by an empirical study. According to Empirical Software Engineering Journal, "Empirical studies presented here usually involve the collection and analysis of data and experience...". For this reason, we define that an empirical study is a study that includes data analysis as a necessary condition to be a study (Necessity) and data collection as a sufficient condition to be an empirical study (Sufficiency). Thus, a study must always include data analysis and an empirical study must include data collection and data analysis. We do not consider the mere reporting of a data collection as a study or even an empirical study. Therefore, we must retrieve all papers that do not have data collection, data analysis, or both.',
      dataAnalysis:
        'For this data analysis, we select all papers that do not have an empirical study according to our definition (data collection and data analysis). For this reason, we only keep all papers that have "no collection" and/or "no analysis". For more detailed insights, we normalize the number of all papers without an empirical study based on the number of all unique papers per year, as the total number of papers per year varies.',
      dataInterpretation:
        'Based on the figure "Normalized number of papers without an empirical study per year", an decreasing proportion of empirical studies can be observed over time. While before 2010 the average proportion of papers without an empirical study is 30.5%, the average proportion for the period 2010 - 2019 is 14.8%. For the target state (2020 - 2025), the average proportion of papers with an empirical study is 5.7%. Based on these data, we observe a positive development towards the vision of Sjøberg et al. (2007) that the small number of papers without an empiricial study envisioned for the target state (2020 - 2025) can be achieved. Regarding the aspect that the papers should provide a good reason for not including a proper evaluation, further analysis is needed as we have not yet examined how papers without empiricial studies justify why they do not provide proper evaluations.',
    },
  },
  //Query 4
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
    dataProcessingFunction2: (rawData: any[]): any[] => {
      const keys_to_count = ['descriptive', 'inferential', 'machine_learning'];
      const static_keys = ['da_label', 'paper', 'year'];

      // Initialize count object
      const labelCounts: { [key: string]: number } = {
        descriptive: 0,
        inferential: 0,
        machine_learning: 0,
        others: 0,
      };

      rawData.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (keys_to_count.includes(key)) {
            labelCounts[key]++;
          } else if (!static_keys.includes(key)) {
            labelCounts['others']++;
          }
        });
      });

      const chartData = Object.keys(labelCounts).map((label) => ({
        methodType: label.charAt(0).toUpperCase() + label.slice(1),
        count: labelCounts[label],
        normalizedRatio: Number(
          ((labelCounts[label] * 100) / rawData.length).toFixed(2)
        ),
      }));
      //sort by count
      chartData.sort((a, b) => b.count - a.count);

      return chartData;
    },
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
    dataProcessingFunction: (rawData: any): any[] => {
      const labelCounts = rawData.reduce(
        (
          acc: { [x: string]: any },
          item: { dc_method_type_label: string | number }
        ) => {
          acc[item.dc_method_type_label] =
            (acc[item.dc_method_type_label] || 0) + 1;
          return acc;
        },
        {}
      );
      const chartData = Object.keys(labelCounts).map((label) => ({
        methodType: label.charAt(0).toUpperCase() + label.slice(1),
        count: labelCounts[label],
        normalizedRatio: Number(
          ((labelCounts[label] * 100) / rawData.length).toFixed(2)
        ),
      }));

      //sort by count
      chartData.sort((a, b) => b.count - a.count);

      return chartData;
    },
    dataAnalysisInformation: {
      question: 'How often are which empirical methods used?',
      questionExplanation:
        'For the target state (2020 - 2025), Sjøberg et al. (2007) envision that researchers are trained in using a large set of research methods and technqiues. This predicted state leads to the corresponding competency question.',
      requiredDataForAnalysis:
        'We must retrieve all papers that use our ORKG template and report on the use of empirical methods. According to Dan (2017), empirical methods include data collection and data analysis. An empirical method can therefore be a method for data collection and data analysis. We consider the empirical method used for data collection or data analysis respectively, as our template allows for a correspondingly more fine-grained analysis.',
      dataAnalysis:
        'For this data analysis, we consider the empirical methods used for data collection. We identify the empirical methods used for data collection. A paper can involve more than one empirical method for data collection so that the number of empirical methods can be larger than the number of papers using empirical methods for data collection. We normalize the number of empirical methods used for data collection based on the number of all papers using at least one empirical methods for data collection.',
      //TODO
      dataInterpretation: '',
    },
  },
  //Query 5
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
    dataProcessingFunction: countMethodDistribution,
    dataAnalysisInformation: {
      question:
        'How have the proportions of experiments, secondary research (reviews), surveys, case studies, and action research in the empirical methods used evolved over time?',
    },
  },
  //Query 6
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
      series: [{ dataKey: 'normalizedRatio' }],
      margin: {
        left: 150,
      },
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction2: sortDataByCount,
    dataAnalysisInformation: {
      question: 'How often are which statistical methods used?',
    },
  },
  //Query 7
  {
    title:
      'Number of statistical methods of descriptive statistics used for data analysis',
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
        'Number of statistical method used for data analysis per year grouped by statistical method',
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
    dataProcessingFunction2: (rawData: StatisticalData[]): any[] => {
      if (!rawData.length) return [];
      // Extract unique years
      const years = [...new Set(rawData.map((item) => item.year))];

      // Identify all statistical method keys dynamically
      const methodKeys = Object.keys(rawData[0]).filter(
        (key) => key !== 'year' && key !== 'paper'
      );

      const processedData = years.map((year) => {
        const filteredData = rawData.filter((item) => item.year === year);
        const totalPapersWithDaLabel = filteredData.filter(
          (item) => item.da_label
        ).length;
        const result: { year: number; [key: string]: number } = { year };

        methodKeys.forEach((method) => {
          // Convert encoded string into a numeric value (count of occurrences)
          result[method] = filteredData.reduce(
            (sum, item) =>
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore
              sum + (item[method]?.replace(/[^1]/g, '').length || 0), // Counting occurrences of '1'
            0
          );
          result[`normalized_${method}`] =
            (result[method] * 100) / totalPapersWithDaLabel;
        });

        return result;
      });

      return processedData.sort((a, b) => a.year - b.year);
    },
    dataAnalysisInformation: {
      question: 'How has the use of statistical methods evolved over time?',
    },
  },
  //=>>Query 8
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
    dataProcessingFunction: (rawData: any[]) => {
      // List of boolean‐threat fields
      const booleanFields = [
        'external',
        'internal',
        'construct',
        'conclusion',
        'reliability',
        'generalizability',
        'content',
        'descriptive',
        'theoretical',
        'repeatability',
        'mentioned',
      ];

      // 1) Normalize those "0"/"1" strings into real booleans
      const cleanedData = rawData.map((item) => {
        const newItem: any = { ...item, year: parseInt(item.year, 10) };
        booleanFields.forEach((field) => {
          newItem[field] = item[field] === '1'; // true if "1", false otherwise
        });
        return newItem;
      });

      // 2) Deduplicate by paper URI (keep last occurrence)
      const paperMap = new Map<string, (typeof cleanedData)[0]>();
      cleanedData.forEach((item) => {
        paperMap.set(item.paper, item);
      });
      const uniquePapers = Array.from(paperMap.values());

      // 3) Count total papers per year
      const totalPapersPerYear: Record<number, number> = {};
      uniquePapers.forEach((item) => {
        totalPapersPerYear[item.year] =
          (totalPapersPerYear[item.year] || 0) + 1;
      });

      // 4) Filter for papers with at least one threat flagged
      const papersWithThreats = uniquePapers.filter((item) =>
        booleanFields.some((field) => item[field] === true)
      );

      // 5) Count threat-reporting papers per year
      const threatPapersPerYear: Record<number, number> = {};
      papersWithThreats.forEach((item) => {
        threatPapersPerYear[item.year] =
          (threatPapersPerYear[item.year] || 0) + 1;
      });

      // 6) Build final array with normalization
      const result = Object.keys(totalPapersPerYear).map((yearStr) => {
        const year = parseInt(yearStr, 10);
        const total = totalPapersPerYear[year] || 0;
        const withThreats = threatPapersPerYear[year] || 0;
        return {
          year,
          numberOfAllPapers: total,
          count: withThreats,
          normalizedRatio: total
            ? Number(((withThreats * 100) / total).toFixed(2))
            : 0,
        };
      });

      // Sort by year ascending
      return result.sort((a, b) => a.year - b.year);
    },
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
  //Query 10 TODO: check if this is correct
  {
    title: 'Number of papers per year',
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
        'Normalized number of case studies and action research used for data collection per year',
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study', label: 'case study' },
        { dataKey: 'action research', label: 'action research' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    dataProcessingFunction: (rawData) => {
      return countMethodDistribution(rawData);
    },
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
    dataProcessingFunction: (rawData: any[]) => {
      // 1) Deduplicate by paper URI (keep last entry)
      const paperMap = new Map<string, any>();
      rawData.forEach((item) => paperMap.set(item.paper, item));
      const uniquePapers = Array.from(paperMap.values());

      // 2) Count total unique papers per year
      const allPapersPerYear: Record<string, number> = {};
      uniquePapers.forEach(({ year }) => {
        allPapersPerYear[year] = (allPapersPerYear[year] || 0) + 1;
      });

      // 3) Count papers that provide at least one URL per year
      //    (assuming `url` is non‐empty when a paper has data)
      const papersWithDataPerYear: Record<string, number> = {};
      uniquePapers.forEach(({ year, url }) => {
        if (url) {
          papersWithDataPerYear[year] = (papersWithDataPerYear[year] || 0) + 1;
        }
      });

      // 4) Build final array with normalized ratio = dataPapers / totalPapers
      const result = Object.keys(allPapersPerYear)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map((yearStr) => {
          const total = allPapersPerYear[yearStr];
          const withData = papersWithDataPerYear[yearStr] || 0;
          return {
            year: parseInt(yearStr, 10),
            count: withData, // number of papers with a URL
            normalizedRatio:
              total > 0 ? Number(((withData * 100) / total).toFixed(2)) : 0,
          };
        });

      return result;
    },

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
        'Number of papers with highlighted research question(s) and highlighted answers per year',
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
    dataProcessingFunction: (rawData: any[]) => {
      // 0) Clean & normalize incoming strings
      const cleaned = rawData.map((item) => ({
        paper: item.paper,
        year: item.year, // keep as string so it shows up as "1993", etc.
        question: item.question,
        highlighted_q: item.highlighted_q === '1',
        highlighted_a: item.highlighted_a === '1',
      }));

      // 1) Dedupe by paper URI
      const paperMap = new Map<string, any>();
      cleaned.forEach((item) => paperMap.set(item.paper, item));
      const uniquePapers = Array.from(paperMap.values());

      // 2) Build per‐year totals for normalization
      const papersPerYear: Record<string, number> = {};
      uniquePapers.forEach(({ year }) => {
        papersPerYear[year] = (papersPerYear[year] || 0) + 1;
      });

      // 3) Partition
      const noRQ = uniquePapers.filter(
        (item) => item.question === 'No question'
      );
      const hasRQ = uniquePapers.filter(
        (item) => item.question !== 'No question'
      );

      // 4) Helper to count per year given qFlag (or null to ignore) & aFlag
      const countComb = (
        arr: any[],
        qFlag: boolean | null,
        aFlag: boolean
      ): Record<string, number> =>
        arr
          .filter((item) =>
            qFlag === null
              ? item.highlighted_a === aFlag
              : item.highlighted_q === qFlag && item.highlighted_a === aFlag
          )
          .reduce<Record<string, number>>((acc, { year }) => {
            acc[year] = (acc[year] || 0) + 1;
            return acc;
          }, {});

      const cnt_noRQ_HA = countComb(noRQ, null, true);
      const cnt_noRQ_HI = countComb(noRQ, null, false);
      const cnt_HQ_HA = countComb(hasRQ, true, true);
      const cnt_HQ_HI = countComb(hasRQ, true, false);
      const cnt_HiQ_HA = countComb(hasRQ, false, true);
      const cnt_HiQ_HI = countComb(hasRQ, false, false);

      // 5) Build output array
      const result = Object.keys(papersPerYear)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map((year) => {
          const total = papersPerYear[year] || 0;
          const c1 = cnt_noRQ_HA[year] || 0;
          const c2 = cnt_noRQ_HI[year] || 0;
          const c3 = cnt_HQ_HA[year] || 0;
          const c4 = cnt_HQ_HI[year] || 0;
          const c5 = cnt_HiQ_HA[year] || 0;
          const c6 = cnt_HiQ_HI[year] || 0;
          return {
            year,
            noRQHighlighted: c1,
            normalized_noRQHighlighted: total
              ? +((c1 * 100) / total).toFixed(2)
              : 0,
            noRQHidden: c2,
            normalized_noRQHidden: total ? +((c2 * 100) / total).toFixed(2) : 0,
            hqha: c3,
            normalized_hqha: total ? +((c3 * 100) / total).toFixed(2) : 0,
            hqhaHidden: c4,
            normalized_hqhaHidden: total ? +((c4 * 100) / total).toFixed(2) : 0,
            hidqha: c5,
            normalized_hidqha: total ? +((c5 * 100) / total).toFixed(2) : 0,
            hidqhid: c6,
            normalized_hidqhid: total ? +((c6 * 100) / total).toFixed(2) : 0,
          };
        });
      return result;
    },
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
        normalizedRatio: Number(((count * 100) / rawData.length).toFixed(2)),
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
    dataProcessingFunction: processYearlyMethodData,
    dataAnalysisInformation: {
      question:
        'How has the proportions of empirical methods to conduct (systematic literature) reviews, so-called secondary research, evolved over time?',
    },
  },
  // Query 15
  {
    title: 'Number of papers per year',
    id: 15,
    uid: 'query_15_1',
    uid_2_merge: 'query_15_2',
    chartSettings: {
      className: 'fullWidth',
      barLabel: 'value',
      xAxis: xAxisSettings('numberOfMethodsUsed'),
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
    title: 'Number of papers using X empirical methods per year',
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
        'Number of papers using X empirical methods for data collection and data analysis per year grouped by number of empirical methods',
      seriesHeadingTemplate: 'Number of papers using {label} per year',
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
    dataProcessingFunction2: (rawData: any[], rawData2: any[]): any[] => {
      if (!rawData.length || !rawData2.length) return [];

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

      //Deduplicate mergedData based on paper and year
      const deduplicatedData = mergedData.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.paper === item.paper && t.year === item.year)
      );

      const dataByYear: Record<number, Record<string, number>> = {};
      const totalByYear: Record<number, number> = {};

      deduplicatedData.forEach((item) => {
        const year = item.year;
        const toNumber = (v: any) =>
          typeof v === 'number' ? v : parseInt(v || '0');

        const methodCount =
          toNumber(item.number_of_dc_methods) +
          toNumber(item.number_of_inf_methods) +
          toNumber(item.number_of_sim_methods) +
          toNumber(item.number_of_oth_methods) +
          toNumber(item.number_of_other_methods);

        if (!dataByYear[year]) {
          dataByYear[year] = {};
          totalByYear[year] = 0;
        }

        const key = methodCount.toFixed(1);
        dataByYear[year][key] = (dataByYear[year][key] || 0) + 1;
        totalByYear[year]++;
      });

      return Object.entries(dataByYear)
        .map(([yearStr, counts]) => {
          const year = parseInt(yearStr);
          const result: any = { year };

          Object.entries(counts).forEach(([methodKey, count]) => {
            result[methodKey] = count;
            result[`normalized_${methodKey}`] = parseFloat(
              (count / totalByYear[year]).toFixed(2)
            );
          });

          return result;
        })
        .sort((a, b) => a.year - b.year);
    },
    dataAnalysisInformation: {
      question:
        'How has the number of research methods used per publication evolved over time?',
    },
  },
];

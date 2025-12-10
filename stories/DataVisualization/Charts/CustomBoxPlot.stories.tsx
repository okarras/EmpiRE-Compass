import type { Meta, StoryObj } from '@storybook/react-vite';
import CustomBoxPlot from '../../../src/components/CustomCharts/CustomBoxPlot';

const meta: Meta<typeof CustomBoxPlot> = {
  title: 'Charts/CustomBoxPlot',
  component: CustomBoxPlot,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `CustomBoxPlot` component renders box-and-whisker plots using Victory charts. It displays statistical distributions including min, max, quartiles (Q1, Q3), median, and outliers for each data series. Commonly used in the KG-EmpiRE dashboard to visualize citation distributions, publication metrics, and research data variability across different categories or time periods.',
      },
    },
  },
  argTypes: {
    dataset: {
      description:
        'Array of data objects for the box plot. Each object should have a "label" (string) for the x-axis category and "values" (number[]) array containing the raw data points. The component automatically calculates quartiles, median, min, max, and outliers using the IQR method. Outliers are values below Q1 - 1.5*IQR or above Q3 + 1.5*IQR.',
      control: 'object',
      table: {
        type: { summary: 'Array<{ label: string; values: number[] }>' },
      },
    },
    chartSetting: {
      description:
        'Configuration object for chart appearance. Includes: height (chart height in pixels), heading (chart title), colors (array of hex colors for each box), showOutliers (boolean to display outlier points), xAxis[0].label (x-axis title), yAxis[0].label (y-axis title), margin (object with top/right/bottom/left padding), labelRotate (angle for x-axis labels), and barWidth (width of each box in pixels).',
      control: 'object',
      table: {
        type: { summary: 'BoxPlotChartSetting' },
        defaultValue: { summary: '{ height: 400, showOutliers: true }' },
      },
    },
    question_id: {
      description:
        'Unique identifier used for the chart container element ID (rendered as "chart-{question_id}"). Used for targeting the chart in PDF exports and accessibility purposes.',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"boxplot"' },
      },
    },
    loading: {
      description:
        'When true, displays a loading placeholder instead of the chart. Used during data fetching from ORKG SPARQL endpoint.',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomBoxPlot>;

const citationDistributionDataset = [
  {
    label: '2020',
    values: [2, 5, 8, 12, 15, 18, 22, 25, 28, 31, 35, 42, 48, 55, 89],
  },
  {
    label: '2021',
    values: [3, 7, 11, 14, 18, 21, 26, 30, 34, 38, 43, 51, 58, 72],
  },
  {
    label: '2022',
    values: [1, 4, 9, 13, 16, 20, 25, 31, 36, 42, 48, 55, 65, 75, 95],
  },
  {
    label: '2023',
    values: [0, 2, 5, 8, 12, 16, 21, 27, 33, 40, 47, 56, 68, 82, 110],
  },
];

// Single dataset for simple visualization
const singleFieldDataset = [
  {
    label: 'Empirical Studies',
    values: [5, 12, 18, 24, 28, 32, 35, 38, 42, 45, 48, 52, 58, 65, 78, 95],
  },
];

const citationChartSetting = {
  height: 450,
  heading: 'Citation Distribution by Publication Year',
  showOutliers: true,
  colors: ['#e86161', '#4caf50', '#2196f3', '#ff9800'],
  xAxis: [{ label: 'Publication Year' }],
  yAxis: [{ label: 'Citation Count' }],
  margin: { top: 40, left: 80, right: 40, bottom: 80 },
};

const singleFieldChartSetting = {
  height: 400,
  heading: 'Citation Distribution for Empirical Studies',
  showOutliers: true,
  colors: ['#e86161'],
  xAxis: [{ label: 'Study Type' }],
  yAxis: [{ label: 'Citation Count' }],
  margin: { top: 40, left: 80, right: 40, bottom: 80 },
};

export const Default: Story = {
  args: {
    dataset: citationDistributionDataset,
    chartSetting: citationChartSetting,
    question_id: 'citation-distribution',
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Citation distribution across publication years from the ORKG knowledge graph. Each box shows the quartile distribution of citations, with outliers (highly-cited papers) displayed as individual points. This visualization helps identify citation patterns and exceptional papers.',
      },
    },
  },
};

export const SingleCategory: Story = {
  args: {
    dataset: singleFieldDataset,
    chartSetting: singleFieldChartSetting,
    question_id: 'single-category',
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single box plot showing citation distribution for empirical studies. Useful when comparing a single category or showing overall distribution without categorical breakdown.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    dataset: citationDistributionDataset,
    chartSetting: citationChartSetting,
    question_id: 'loading-state',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displayed while fetching data from the ORKG SPARQL endpoint. Shows a placeholder message until the query results are processed.',
      },
    },
  },
};

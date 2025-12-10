import type { Meta, StoryObj } from '@storybook/react-vite';
import CustomScatterChart from '../../../src/components/CustomCharts/CustomScatterChart';

const meta: Meta<typeof CustomScatterChart> = {
  title: 'Charts/CustomScatterChart',
  component: CustomScatterChart,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The `CustomScatterChart` component wraps MUI X Charts ScatterChart to display data points in a two-dimensional space. It supports label formatting, normalization, custom axis configurations, and multiple data series. Commonly used in the KG-EmpiRE dashboard to visualize relationships between research metrics like citations vs. publication year, author count vs. citations, or paper impact over time.',
      },
    },
  },
  argTypes: {
    dataset: {
      description:
        'Array of data objects containing coordinates for scatter points. Each object should have x (number) and y (number) values, plus an optional id (string/number) for unique identification and label (string) for tooltips. When using labelMap in xAxis, x values should be numeric keys that map to label strings.',
      control: 'object',
      table: {
        type: {
          summary:
            'Array<{ id: string | number; x: number; y: number; label?: string }>',
        },
      },
    },
    chartSetting: {
      description:
        'Configuration object for chart appearance. Includes: height (chart height in pixels, default 360), heading (chart title), xAxis (array with label, dataKey, labelMap for custom tick labels, valueFormatter), yAxis (array with label, dataKey, valueFormatter), series (array of data series with label, data array, dataKey, xDataKey), margin (object with top/right/bottom/left padding), layout ("horizontal" for centered layout), noHeadingInSeries (hide heading), doesntHaveNormalization (hide normalized/absolute prefix).',
      control: 'object',
      table: {
        type: { summary: 'ScatterChartSetting' },
        defaultValue: { summary: '{ height: 360 }' },
      },
    },
    question_id: {
      description:
        'Unique identifier used for the chart container element ID (rendered as "chart-{question_id}"). Used for targeting the chart in PDF exports and accessibility purposes.',
      control: 'text',
      table: {
        type: { summary: 'string' },
      },
    },
    normalized: {
      description:
        'When true, displays "Relative" prefix in the heading; when false, displays "Absolute" prefix. Used to indicate whether the data shows normalized (percentage) or absolute values. Can be hidden with chartSetting.doesntHaveNormalization.',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      description:
        'When true, displays a loading indicator in the chart. Used during data fetching from ORKG SPARQL endpoint.',
      control: 'boolean',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomScatterChart>;

const citationsVsYearDataset = [
  { id: 'p1', x: 2018, y: 145, label: 'Paper on Knowledge Graph Embeddings' },
  { id: 'p2', x: 2019, y: 89, label: 'Survey on Semantic Web Technologies' },
  { id: 'p3', x: 2019, y: 234, label: 'BERT for Knowledge Graphs' },
  { id: 'p4', x: 2020, y: 67, label: 'Empirical Study on SPARQL Queries' },
  { id: 'p5', x: 2020, y: 156, label: 'Graph Neural Networks for KG' },
  { id: 'p6', x: 2020, y: 45, label: 'Ontology Alignment Methods' },
  { id: 'p7', x: 2021, y: 78, label: 'Link Prediction Benchmark' },
  { id: 'p8', x: 2021, y: 112, label: 'Knowledge Graph Completion' },
  { id: 'p9', x: 2022, y: 34, label: 'ORKG Data Analysis' },
  { id: 'p10', x: 2022, y: 56, label: 'Scholarly Knowledge Extraction' },
  { id: 'p11', x: 2023, y: 23, label: 'LLMs for Knowledge Graphs' },
  { id: 'p12', x: 2023, y: 18, label: 'Empirical RE Methods' },
];

const empiricalVsNonEmpiricalData = {
  empirical: [
    { x: 2019, y: 45, id: 'e1' },
    { x: 2020, y: 62, id: 'e2' },
    { x: 2021, y: 78, id: 'e3' },
    { x: 2022, y: 95, id: 'e4' },
    { x: 2023, y: 112, id: 'e5' },
  ],
  nonEmpirical: [
    { x: 2019, y: 120, id: 'n1' },
    { x: 2020, y: 135, id: 'n2' },
    { x: 2021, y: 142, id: 'n3' },
    { x: 2022, y: 128, id: 'n4' },
    { x: 2023, y: 118, id: 'n5' },
  ],
};

const citationsVsYearChartSetting = {
  height: 450,
  heading: 'Citations by Publication Year',
  doesntHaveNormalization: true,
  xAxis: [
    {
      label: 'Publication Year',
      dataKey: 'x',
    },
  ],
  yAxis: [
    {
      label: 'Citation Count',
      dataKey: 'y',
    },
  ],
  series: [
    {
      label: 'Research Papers',
      dataKey: 'y',
      xDataKey: 'x',
      data: citationsVsYearDataset.map((d) => ({ x: d.x, y: d.y, id: d.id })),
    },
  ],
  margin: { top: 20, bottom: 60, left: 70, right: 20 },
};

const multiSeriesChartSetting = {
  height: 450,
  heading: 'Empirical vs Non-Empirical Studies Over Time',
  doesntHaveNormalization: true,
  xAxis: [
    {
      label: 'Publication Year',
      dataKey: 'x',
    },
  ],
  yAxis: [
    {
      label: 'Number of Papers',
      dataKey: 'y',
    },
  ],
  series: [
    {
      label: 'Empirical Studies',
      data: empiricalVsNonEmpiricalData.empirical,
    },
    {
      label: 'Non-Empirical Studies',
      data: empiricalVsNonEmpiricalData.nonEmpirical,
    },
  ],
  margin: { top: 20, bottom: 60, left: 70, right: 20 },
};

export const Default: Story = {
  args: {
    dataset: citationsVsYearDataset,
    chartSetting: citationsVsYearChartSetting,
    question_id: 'citations-vs-year',
    normalized: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Scatter plot showing citation counts vs publication year for research papers in the ORKG knowledge graph. Older papers tend to have more citations due to longer exposure time. Each point represents a paper, with position indicating year (x) and citation count (y).',
      },
    },
  },
};

export const MultiSeries: Story = {
  args: {
    dataset: [],
    chartSetting: multiSeriesChartSetting,
    question_id: 'empirical-comparison',
    normalized: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multi-series scatter chart comparing empirical and non-empirical studies over time. Each series is displayed with a different color, allowing visual comparison of publication trends between study types.',
      },
    },
  },
};

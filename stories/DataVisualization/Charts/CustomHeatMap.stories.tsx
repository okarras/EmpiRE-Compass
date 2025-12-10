import type { Meta, StoryObj } from '@storybook/react-vite';
import CustomHeatMap from '../../../src/components/CustomCharts/CustomHeatMap';

const meta: Meta<typeof CustomHeatMap> = {
  title: 'Charts/CustomHeatMap',
  component: CustomHeatMap,
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
          'The `CustomHeatMap` component renders a heatmap visualization using Nivo. It displays data intensity across two categorical dimensions with color-coded cells. Commonly used in the KG-EmpiRE dashboard to visualize research metric correlations, publication patterns across venues and years, and co-occurrence matrices for research topics.',
      },
    },
  },
  argTypes: {
    dataset: {
      description:
        'Array of data objects representing heatmap cells. Each object must have: xLabel (string) for the column category, yLabel (string) for the row category, and value (number) for the cell intensity. The component automatically groups data by xLabel and yLabel to create the heatmap grid. Values are color-coded using a sequential red color scheme.',
      control: 'object',
      table: {
        type: {
          summary: 'Array<{ xLabel: string; yLabel: string; value: number }>',
        },
      },
    },
    chartSetting: {
      description:
        'Configuration object for chart appearance. Includes: height (chart height in pixels, default 600), heading (chart title), xAxis[0].label (x-axis title), xAxis[0].dataKey (key for x values, default "xLabel"), yAxis[0].label (y-axis title), yAxis[0].dataKey (key for y values, default "yLabel"), series[0].dataKey (key for values, default "count"), maxLabelLength (truncate long labels), and className (CSS class for styling).',
      control: 'object',
      table: {
        type: { summary: 'HeatMapChartSetting' },
        defaultValue: { summary: '{ height: 600 }' },
      },
    },
    question_id: {
      description:
        'Unique identifier used for the chart container element ID (rendered as "chart-{question_id}"). Used for targeting the chart in PDF exports and accessibility purposes.',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"heatmap"' },
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
type Story = StoryObj<typeof CustomHeatMap>;

const correlationMatrixDataset = [
  { xLabel: 'Citation Count', yLabel: 'Citation Count', value: 1.0 },
  { xLabel: 'Author Count', yLabel: 'Citation Count', value: 0.42 },
  { xLabel: 'Reference Count', yLabel: 'Citation Count', value: 0.65 },
  { xLabel: 'Venue Impact', yLabel: 'Citation Count', value: 0.78 },
  { xLabel: 'Paper Age', yLabel: 'Citation Count', value: 0.55 },
  { xLabel: 'Citation Count', yLabel: 'Author Count', value: 0.42 },
  { xLabel: 'Author Count', yLabel: 'Author Count', value: 1.0 },
  { xLabel: 'Reference Count', yLabel: 'Author Count', value: 0.31 },
  { xLabel: 'Venue Impact', yLabel: 'Author Count', value: 0.28 },
  { xLabel: 'Paper Age', yLabel: 'Author Count', value: 0.15 },
  { xLabel: 'Citation Count', yLabel: 'Reference Count', value: 0.65 },
  { xLabel: 'Author Count', yLabel: 'Reference Count', value: 0.31 },
  { xLabel: 'Reference Count', yLabel: 'Reference Count', value: 1.0 },
  { xLabel: 'Venue Impact', yLabel: 'Reference Count', value: 0.48 },
  { xLabel: 'Paper Age', yLabel: 'Reference Count', value: 0.22 },
  { xLabel: 'Citation Count', yLabel: 'Venue Impact', value: 0.78 },
  { xLabel: 'Author Count', yLabel: 'Venue Impact', value: 0.28 },
  { xLabel: 'Reference Count', yLabel: 'Venue Impact', value: 0.48 },
  { xLabel: 'Venue Impact', yLabel: 'Venue Impact', value: 1.0 },
  { xLabel: 'Paper Age', yLabel: 'Venue Impact', value: 0.35 },
  { xLabel: 'Citation Count', yLabel: 'Paper Age', value: 0.55 },
  { xLabel: 'Author Count', yLabel: 'Paper Age', value: 0.15 },
  { xLabel: 'Reference Count', yLabel: 'Paper Age', value: 0.22 },
  { xLabel: 'Venue Impact', yLabel: 'Paper Age', value: 0.35 },
  { xLabel: 'Paper Age', yLabel: 'Paper Age', value: 1.0 },
];

const correlationChartSetting = {
  height: 550,
  heading: 'Research Metric Correlation Matrix',
  xAxis: [{ label: 'Metric', dataKey: 'xLabel' }],
  yAxis: [{ label: 'Metric', dataKey: 'yLabel' }],
  series: [{ dataKey: 'value' }],
};

export const Default: Story = {
  args: {
    dataset: correlationMatrixDataset,
    chartSetting: correlationChartSetting,
    question_id: 'correlation-matrix',
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Correlation matrix showing relationships between research metrics from the ORKG knowledge graph. Values range from 0 to 1, with darker colors indicating stronger correlations. This visualization helps identify which metrics tend to co-vary (e.g., citation count and venue impact).',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    dataset: correlationMatrixDataset,
    chartSetting: correlationChartSetting,
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

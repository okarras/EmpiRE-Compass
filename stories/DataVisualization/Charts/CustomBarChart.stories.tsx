import type { Meta, StoryObj } from '@storybook/react-vite';
import CustomBarChart from '../../../src/components/CustomCharts/CustomBarChart';

const meta: Meta<typeof CustomBarChart> = {
  title: 'Charts/CustomBarChart',
  component: CustomBarChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `CustomBarChart` component wraps MUI’s `BarChart` and dynamically configures the data key based on whether normalization is enabled. It accepts flexible chart settings and supports both vertical and horizontal layouts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomBarChart>;

const dataset = [
  { year: 2020, count: 10, normalizedRatio: 0.25 },
  { year: 2021, count: 20, normalizedRatio: 0.5 },
  { year: 2022, count: 40, normalizedRatio: 1.0 },
];

const chartSetting = {
  height: 400,
  heading: 'Empirical Study Proportions Over Years',
  layout: 'vertical',
  margin: { top: 20, bottom: 40, left: 60, right: 20 },
  colors: ['#e86161'],
  series: [{ label: 'Empirical Papers', dataKey: 'normalizedRatio' }],
  xAxis: [
    {
      label: 'Year',
      dataKey: 'year',
      scaleType: 'band', // ✅ Required for bar charts
    },
  ],
  yAxis: [
    {
      label: 'Normalized Ratio',
      dataKey: 'normalizedRatio',
    },
  ],
};

export const Normalized: Story = {
  args: {
    dataset,
    chartSetting,
    question_id: 'Q1',
    normalized: true,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays a bar chart using the `normalizedRatio` as the data key.',
      },
    },
  },
};

export const RawCounts: Story = {
  args: {
    dataset,
    chartSetting,
    question_id: 'Q1',
    normalized: false,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays a bar chart using the `count` field instead of the normalized ratio.',
      },
    },
  },
};

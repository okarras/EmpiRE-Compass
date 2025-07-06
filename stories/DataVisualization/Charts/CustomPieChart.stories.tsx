import type { Meta, StoryObj } from '@storybook/react';
import CustomPieChart from '../../../src/components/CustomCharts/CustomPieChart';
import { ChartSetting } from '../../constants/queries_chart_info';

const meta: Meta<typeof CustomPieChart> = {
  title: 'Charts/CustomPieChart',
  component: CustomPieChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `CustomPieChart` component wraps MUI X PieChart with dynamic labels, arc formatting, legend control, and color customization. It also handles empty data gracefully.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomPieChart>;

//  Mock dataset
const mockDataset = [
  { id: 'a', label: 'Empirical', value: 60 },
  { id: 'b', label: 'Non-Empirical', value: 25 },
  { id: 'c', label: 'Unspecified', value: 15 },
];

//  Mock chart setting
const chartSetting: ChartSetting = {
  heading: 'Paper Distribution by Type',
  height: 400,
  colors: ['#e86161', '#4c72b0', '#55a868'],
  className: '',
  series: [], // Not used in this chart, but required by ChartSetting type
  xAxis: [],
  yAxis: [],
};

export const Default: Story = {
  args: {
    dataset: mockDataset,
    chartSetting,
    question_id: 'Q-PIE-01',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays a responsive pie chart with percentages and total counts. Segments under 5% are not labeled directly on the arcs.',
      },
    },
  },
};

export const EmptyData: Story = {
  args: {
    dataset: [],
    chartSetting: { ...chartSetting, heading: 'Empty Chart' },
    question_id: 'Q-PIE-EMPTY',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Gracefully renders a fallback message when no data is available.',
      },
    },
  },
};

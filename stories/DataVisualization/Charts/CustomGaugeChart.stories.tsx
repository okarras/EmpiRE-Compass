import type { Meta, StoryObj } from '@storybook/react-vite';
import CustomGaugeChart from '../../../src/components/CustomCharts/CustomGaugeChart';

const meta: Meta<typeof CustomGaugeChart> = {
  title: 'Charts/CustomGaugeChart',
  component: CustomGaugeChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `CustomGaugeChart` component is a placeholder for a future gauge-style visualization. This story is set up for preview and integration testing.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomGaugeChart>;

export const Default: Story = {
  render: () => <CustomGaugeChart />,
  parameters: {
    docs: {
      description: {
        story:
          'This is a placeholder rendering of the `CustomGaugeChart` component.',
      },
    },
  },
};

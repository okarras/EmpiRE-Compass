import type { Meta, StoryObj } from '@storybook/react';
import StatisticsPageLoadingSkeleton from './StatisticsPageLoadingSkeleton';

const meta: Meta<typeof StatisticsPageLoadingSkeleton> = {
  title: 'Pages/StatisticsPageLoadingSkeleton',
  component: StatisticsPageLoadingSkeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A loading skeleton placeholder used on the statistics page. It mimics the final layout using MUI Paper and Skeleton components while data is being fetched.',
      },
    },
  },
  argTypes: {}, // No props to control — static loading screen
};

export default meta;
type Story = StoryObj<typeof StatisticsPageLoadingSkeleton>;

export const Default: Story = {
  render: () => <StatisticsPageLoadingSkeleton />,
  name: 'Default Skeleton',
  parameters: {
    docs: {
      description: {
        story: 'This is the default loading skeleton for the statistics page layout, including six stat cards and a chart area placeholder.',
      },
    },
  },
};
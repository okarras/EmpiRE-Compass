import type { Meta, StoryObj } from '@storybook/react';
import ChartTypeSelector from './ChartTypeSelector';
import React, { useState } from 'react';

const meta: Meta<typeof ChartTypeSelector> = {
  title: 'Components/ChartTypeSelector',
  component: ChartTypeSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `ChartTypeSelector` component allows users to toggle between available chart types such as bar and pie. It highlights the selected option and can be restricted using the `availableCharts` prop.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChartTypeSelector>;

export const Default: Story = {
  render: () => {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    return (
      <ChartTypeSelector
        chartType={chartType}
        setChartType={setChartType}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows the default `ChartTypeSelector` with both bar and pie chart options available. It updates the local state on toggle.',
      },
    },
  },
};

export const BarOnly: Story = {
  render: () => {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
    return (
      <ChartTypeSelector
        chartType={chartType}
        setChartType={setChartType}
        availableCharts={['bar']}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'This variation shows the component with only the bar chart option available.',
      },
    },
  },
};

export const PieOnly: Story = {
  render: () => {
    const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
    return (
      <ChartTypeSelector
        chartType={chartType}
        setChartType={setChartType}
        availableCharts={['pie']}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'This variation shows the component with only the pie chart option available.',
      },
    },
  },
};
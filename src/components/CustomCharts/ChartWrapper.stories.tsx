import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import ChartWrapper from './ChartWrapper';
import { ChartSetting } from '../../constants/queries_chart_info';

const meta: Meta<typeof ChartWrapper> = {
  title: 'Charts/ChartWrapper',
  component: ChartWrapper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`ChartWrapper` toggles between a bar and pie chart view based on configuration and user input. It supports multiple series for pie mode and normalization switching for bar charts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChartWrapper>;

// Mock dataset
const dataset = [
  { year: 2020, count: 30, normalizedRatio: 0.3, empirical: 20, nonEmpirical: 10 },
  { year: 2021, count: 50, normalizedRatio: 0.5, empirical: 35, nonEmpirical: 15 },
  { year: 2022, count: 100, normalizedRatio: 1.0, empirical: 70, nonEmpirical: 30 },
];

// Chart configuration
const chartSetting: ChartSetting = {
  heading: 'Empirical Study Proportions',
  height: 400,
  colors: ['#e86161', '#4c72b0'],
  layout: 'vertical',
  series: [{ label: 'Empirical Studies', dataKey: 'normalizedRatio' }],
  xAxis: [{ label: 'Year', dataKey: 'year', scaleType: 'band' }],
  yAxis: [{ label: 'Ratio', dataKey: 'normalizedRatio' }],
};

// Multiple-series setting for pie chart
const multiSeriesSetting: ChartSetting = {
  heading: 'Empirical vs Non-Empirical',
  height: 400,
  colors: ['#e86161', '#4c72b0'],
  layout: 'vertical',
  series: [
    { label: 'Empirical', dataKey: 'empirical' },
    { label: 'Non-Empirical', dataKey: 'nonEmpirical' },
  ],
  xAxis: [],
  yAxis: [],
};

export const BarChartDefault: Story = {
  render: () => (
    <ChartWrapper
      dataset={dataset}
      chartSetting={chartSetting}
      question_id="Q-BAR-1"
      normalized={true}
      loading={false}
      defaultChartType="bar"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Renders a bar chart using `normalizedRatio` with full chart controls.',
      },
    },
  },
};

export const PieChartWithMultiSeries: Story = {
  render: () => (
    <ChartWrapper
      dataset={dataset}
      chartSetting={multiSeriesSetting}
      question_id="Q-PIE-2"
      normalized={true}
      loading={false}
      defaultChartType="pie"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows a pie chart aggregating multiple series: Empirical and Non-Empirical.',
      },
    },
  },
};
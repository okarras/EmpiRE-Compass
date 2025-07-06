import type { Meta, StoryObj } from '@storybook/react';
import ChartParamsSelector from './ChartParamsSelector';
import React, { useState } from 'react';
import { Query } from '../../constants/queries_chart_info';

const meta: Meta<typeof ChartParamsSelector> = {
  title: 'Components/ChartParamsSelector',
  component: ChartParamsSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `ChartParamsSelector` component displays chart configuration options like normalization, based on the chart series configuration passed via a `query` object.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChartParamsSelector>;

// Mock Query with normalization available
const mockQuery: Query = {
  uid: 'Q1',
  id: 1,
  chartType: 'bar',
  chartSettings: {
    heading: 'Normalized Ratio Over Time',
    series: [
      {
        label: 'Empirical Papers',
        dataKey: 'normalizedRatio',
      },
    ],
    colors: ['#e86161'],
    yAxis: [
      {
        label: 'Normalized Ratio',
        dataKey: 'normalizedRatio',
      },
    ],
  },
  dataProcessingFunction: (data) => data,
  dataAnalysisInformation: {
    question: 'How does the normalized ratio of empirical studies evolve?',
    questionExplanation: '',
    requiredDataForAnalysis: '',
    dataAnalysis: '',
    dataInterpretation: '',
  },
};

export const WithNormalizationToggle: Story = {
  render: () => {
    const [normalized, setNormalized] = useState(true);
    return (
      <ChartParamsSelector
        query={mockQuery}
        normalized={normalized}
        setNormalized={setNormalized}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the checkbox toggle when the chart query includes a `normalizedRatio` data key.',
      },
    },
  },
};

// Optional: add a version with no normalization available
const queryWithoutNormalization = {
  ...mockQuery,
  chartSettings: {
    ...mockQuery.chartSettings,
    series: [{ label: 'Count Only', dataKey: 'rawCount' }],
  },
};

export const WithoutNormalizationToggle: Story = {
  render: () => {
    const [normalized, setNormalized] = useState(false);
    return (
      <ChartParamsSelector
        query={queryWithoutNormalization}
        normalized={normalized}
        setNormalized={setNormalized}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'This variant does not render the checkbox, as the data series does not support normalization.',
      },
    },
  },
};

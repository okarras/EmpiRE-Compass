import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import QuestionAccordion from './QuestionAccordion';
import { Query } from '../constants/queries_chart_info';

// --- MOCK: Minimal query config for display ---
const mockQuery: Query = {
  uid: 'Q1',
  id: 1,
  chartType: 'bar',
  chartSettings: {
    heading: 'Number of papers with an empirical study per year',
    series: [
      { label: 'empirical studies', dataKey: 'value' },
    ],
    colors: ['#e86161'],
    yAxis: [
      { label: 'Proportion', dataKey: 'value' },
    ],
  },
  dataProcessingFunction: (data) => data,
  dataAnalysisInformation: {
    question: 'How has the proportion of empirical studies evolved over time?',
    requiredDataForAnalysis: `
      <p>This analysis requires metadata on publication year and empirical study status.</p>
    `,
    questionExplanation: `
      <p>Shows the percentage of papers per year reporting an empirical study.</p>
    `,
    dataAnalysis: `
      <p>Rendered as a bar chart with normalization toggle and filters.</p>
    `,
    dataInterpretation: `
      <p>A steady increase over time indicates improved scientific rigor.</p>
    `,
  },
};

// 🧪 Mock fetch response via MSW or hardcoded override in your component
const meta: Meta<typeof QuestionAccordion> = {
  title: 'Components/QuestionAccordion',
  component: QuestionAccordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Expandable accordion that shows question metadata and an empirical chart view with toggles and analysis.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuestionAccordion>;

export const Default: Story = {
  args: {
    query: mockQuery,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulates how a user would interact with the accordion to explore a charted data question.',
      },
    },
  },
};
import type { Meta, StoryObj } from '@storybook/react';
import QuestionDialog from './QuestionDialog';
import { Query } from '../constants/queries_chart_info';

const meta: Meta<typeof QuestionDialog> = {
  title: 'Components/QuestionDialog',
  component: QuestionDialog,
  tags: ['autodocs'],
};

export default meta; // ✅ Required default export

type Story = StoryObj<typeof QuestionDialog>;

const mockQuery: Query = {
  uid: 'Q1',
  id: 1,
  chartType: 'bar',
  chartSettings: {},
  dataProcessingFunction: (data: any[]) => data,
  dataAnalysisInformation: {
    question: 'How has the proportion of empirical studies evolved over time?',
    questionExplanation: `
      <p>According to <a href="#">Sjøberg et al. (2007)</a>, the <strong>"current"</strong> state of practice shows there are few empirical studies. For the <strong>target state (2020–2025)</strong>, they envision a <strong>large number</strong> of studies.</p>
    `,
    requiredDataForAnalysis: `
      <p>This analysis requires metadata on publication year, template usage, and whether a paper reports an empirical study.</p>
    `,
    dataAnalysis: `
      <p>The data is analyzed using a bar chart showing trends over time.</p>
    `,
    dataInterpretation: `
      <p>The increase in empirical studies indicates improved methodological rigor.</p>
    `,
  },
};

export const Default: Story = {
  args: {
    query: mockQuery,
    questionData: [],
    chartData: [],
    normalized: true,
    setNormalized: () => {},
  },
};
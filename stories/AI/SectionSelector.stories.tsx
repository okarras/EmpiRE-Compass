import type { Meta, StoryObj } from '@storybook/react-vite';
import SectionSelector from '../../src/components/SectionSelector';
import { AIAssistantProvider } from '../../src/context/AIAssistantContext';

const meta: Meta<typeof SectionSelector> = {
  title: 'AI/SectionSelector',
  component: SectionSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`SectionSelector` provides contextual AI analysis options for different sections of the research question interface. It displays a set of buttons that trigger structured prompts to the AI assistant based on the section type. Each section type (information, chart, data) has three predefined analysis options that help users explore and understand their research data. The component integrates with AIAssistantContext to send prompts to the floating AI assistant.',
      },
    },
  },
  argTypes: {
    sectionType: {
      control: 'select',
      options: ['information', 'chart', 'data'],
      description:
        'The type of section, which determines the available AI analysis options. Each type has three predefined prompts tailored to that content type: "information" for research question metadata, "chart" for visualization analysis, "data" for raw data exploration.',
      table: {
        type: { summary: "'information' | 'chart' | 'data'" },
      },
    },
    sectionTitle: {
      control: 'text',
      description:
        'The title displayed in the section header. Should describe the content being analyzed (e.g., "Question Information", "Publication Trends Chart", "Research Data"). Displayed alongside the AI chip badge.',
      table: {
        type: { summary: 'string' },
      },
    },
    query: {
      control: 'object',
      description:
        'Optional Query object containing research question details. Provides context for AI analysis prompts. Includes dataAnalysisInformation with question, explanation, required data, analysis methods, and interpretation.',
      table: {
        type: { summary: 'Query' },
      },
    },
    data: {
      control: 'object',
      description:
        'Optional data array for analysis. Typically contains SPARQL query results as an array of binding objects. Used by the AI to provide data-specific insights and pattern analysis.',
      table: {
        type: { summary: 'Record<string, unknown>[]' },
      },
    },
  },
  decorators: [
    (Story) => (
      <AIAssistantProvider>
        <div style={{ maxWidth: '800px', padding: '20px' }}>
          <Story />
        </div>
      </AIAssistantProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SectionSelector>;

// Sample Query object
const sampleQuery = {
  uid: 'Q1',
  id: 1,
  title: 'Empirical Studies Evolution',
  chartType: 'bar' as const,
  chartSettings: {
    heading: 'Number of empirical studies per year',
    series: [{ label: 'Papers', dataKey: 'paperCount' }],
    colors: ['#e86161'],
    yAxis: [{ label: 'Number of Papers', dataKey: 'paperCount' }],
    height: 400,
    sx: {},
  },
  dataProcessingFunction: (data: Record<string, unknown>[]) => data,
  dataAnalysisInformation: {
    question:
      'How has the number of empirical studies in Requirements Engineering evolved over the years?',
    questionExplanation:
      "This research question investigates temporal trends in empirical RE research, providing insights into the field's methodological maturity and growth patterns.",
    requiredDataForAnalysis: [
      'Publication year of each paper',
      'Paper classification as empirical study',
      'Link to KG-EmpiRE template contributions',
    ],
    dataAnalysis: [
      'Count distinct papers per year',
      'Calculate year-over-year growth rates',
      'Identify trend patterns (linear, exponential)',
    ],
    dataInterpretation: [
      'Consistent upward trend indicates growing adoption of empirical methods',
      '247% growth from 2018 to 2023 shows accelerating research interest',
      'Post-2020 acceleration may correlate with increased focus on evidence-based RE',
    ],
  },
};

// Sample data array
const sampleData = [
  { year: '2018', paperCount: '45' },
  { year: '2019', paperCount: '62' },
  { year: '2020', paperCount: '78' },
  { year: '2021', paperCount: '95' },
  { year: '2022', paperCount: '124' },
  { year: '2023', paperCount: '156' },
];

export const Information: Story = {
  args: {
    sectionType: 'information',
    sectionTitle: 'Question Information',
    query: sampleQuery,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Information section selector with three AI analysis options: "Explain Research Question" (provides detailed explanation of significance and methodology), "Analyze Required Data" (examines data requirements and collection approach), and "Interpret Analysis Method" (explains the rationale behind the analysis approach). These prompts help users understand the research context.',
      },
    },
  },
};

export const Chart: Story = {
  args: {
    sectionType: 'chart',
    sectionTitle: 'Publication Trends Chart',
    query: sampleQuery,
    data: sampleData,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Chart section selector with visualization-focused AI analysis options: "Explain Chart Insights" (identifies patterns and trends in the visualization), "Compare Data Points" (analyzes differences between categories or time periods), and "Generate Alternative Views" (suggests different visualization approaches). Useful for understanding and exploring chart data.',
      },
    },
  },
};

export const Data: Story = {
  args: {
    sectionType: 'data',
    sectionTitle: 'Research Data',
    query: sampleQuery,
    data: sampleData,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Data section selector with data exploration AI analysis options: "Summarize Key Findings" (provides comprehensive summary of patterns and statistics), "Identify Data Patterns" (finds correlations and recurring themes), and "Data Quality Assessment" (evaluates coverage, completeness, and potential biases). Helps users understand raw query results.',
      },
    },
  },
};

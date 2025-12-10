import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Box } from '@mui/material';
import AIAssistant from '../../src/components/AI/AIAssistant';
import { AIAssistantProvider } from '../../src/context/AIAssistantContext';
import aiReducer from '../../src/store/slices/aiSlice';
import type { Query } from '../../src/constants/queries_chart_info';

// mock store with configurable AI state
const createMockStore = (isConfigured: boolean = true) =>
  configureStore({
    reducer: {
      ai: aiReducer,
    },
    preloadedState: {
      ai: {
        provider: 'mistral' as const,
        openaiModel: 'gpt-4o-mini' as const,
        groqModel: 'llama-3.1-8b-instant' as const,
        mistralModel: 'mistral-large-latest' as const,
        openaiApiKey: '',
        groqApiKey: '',
        mistralApiKey: '',
        isConfigured,
        useEnvironmentKeys: true,
      },
    },
  });

//  mock query matching the Query interface from queries_chart_info.ts
const mockQuery: Query = {
  id: 1,
  uid: 'RE_METHODS_ANALYSIS_2023',
  title: 'Research Methods in Requirements Engineering',
  chartType: 'bar',
  chartSettings: {
    heading: 'Distribution of Research Methods in RE Studies (2020-2023)',
    yAxis: { dataKey: 'count', name: 'Number of Papers' },
    xAxis: { dataKey: 'method', name: 'Research Method' },
    series: [{ dataKey: 'count', name: 'Papers', color: '#e86161' }],
    colors: ['#e86161', '#61e8aa', '#6161e8', '#e8aa61'],
    height: 400,
    sx: {},
  },
  dataAnalysisInformation: {
    question:
      'What are the most common research methods used in Requirements Engineering studies?',
    questionExplanation:
      'This competency question analyzes the distribution of research methodologies employed in empirical Requirements Engineering research. Understanding method prevalence helps researchers identify established practices and potential gaps in methodological diversity.',
    dataAnalysis:
      "The data reveals the frequency distribution of research methods across RE publications indexed in the ORKG knowledge graph. Case studies and surveys dominate, reflecting the field's emphasis on real-world validation and practitioner perspectives.",
    requiredDataForAnalysis:
      'SPARQL query results containing research method classifications and paper counts from the ORKG EmpiRE knowledge graph, filtered by publication year range 2020-2023.',
  },
};

// SPARQL query result data matching actual ORKG data structures
const mockQuestionData = [
  { method: 'Case Study', count: 145, percentage: 26.4 },
  { method: 'Survey', count: 98, percentage: 17.8 },
  { method: 'Experiment', count: 76, percentage: 13.8 },
  { method: 'Systematic Literature Review', count: 67, percentage: 12.2 },
  { method: 'Interview Study', count: 52, percentage: 9.5 },
  { method: 'Action Research', count: 45, percentage: 8.2 },
  { method: 'Design Science', count: 38, percentage: 6.9 },
  { method: 'Mixed Methods', count: 34, percentage: 6.2 },
];

// Wrapper component that provides all required context providers for AIAssistant.
const AIAssistantWrapper = ({
  isConfigured = true,
}: {
  isConfigured?: boolean;
}) => {
  return (
    <Provider store={createMockStore(isConfigured)}>
      <AIAssistantProvider>
        <Box
          sx={{
            height: '700px',
            width: '100%',
            maxWidth: '800px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          <AIAssistant query={mockQuery} questionData={mockQuestionData} />
        </Box>
      </AIAssistantProvider>
    </Provider>
  );
};

const meta: Meta<typeof AIAssistant> = {
  title: 'AI/AIAssistant',
  component: AIAssistant,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`AIAssistant\` is the main AI chat interface component for the EmpiRE-Compass application. It provides interactive AI-powered analysis of research questions and SPARQL query results from the ORKG knowledge graph.

## Features
- **Initial Analysis**: Automatically generates an AI analysis of the research question and data when mounted
- **Interactive Chat**: Supports follow-up questions with streaming responses
- **Reasoning Toggle**: Show/hide AI reasoning process via the PsychologyIcon button
- **Chart Toggle**: Show/hide generated charts via the BarChartIcon button
- **Chat History**: Export chat history as JSON, clear chat functionality
- **Cached Analysis**: Displays cached analysis with option to refresh

## Required Context Providers
This component requires the following providers to function:
1. **Redux Provider** with \`aiSlice\` - Manages AI configuration (provider, model, API keys)
2. **AIAssistantProvider** - Manages chat state, message history, and AI interactions

## Usage Example
\`\`\`tsx
import { Provider } from 'react-redux';
import { AIAssistantProvider } from '../../context/AIAssistantContext';
import AIAssistant from './AIAssistant';

<Provider store={store}>
  <AIAssistantProvider>
    <AIAssistant query={query} questionData={data} />
  </AIAssistantProvider>
</Provider>
\`\`\``,
      },
    },
    layout: 'centered',
  },
  argTypes: {
    query: {
      description: `The research query object containing all metadata for the analysis. This follows the \`Query\` interface from \`queries_chart_info.ts\`.

**Structure:**
- \`id\`: Unique numeric identifier
- \`uid\`: String identifier for the query
- \`title\`: Display title for the research question
- \`chartType\`: Type of chart to render ('bar', 'line', 'pie', 'scatter', etc.)
- \`chartSettings\`: Configuration for chart rendering (heading, axes, series, colors)
- \`dataAnalysisInformation\`: Object containing:
  - \`question\`: The research question text
  - \`questionExplanation\`: Explanation of the competency question
  - \`dataAnalysis\`: Description of how data is analyzed
  - \`requiredDataForAnalysis\`: Description of required data sources`,
      control: { type: 'object' },
      table: {
        type: { summary: 'Query' },
        category: 'Data',
      },
    },
    questionData: {
      description: `Array of data objects from SPARQL query results. This is the actual data that will be analyzed by the AI and visualized in charts.

**Expected Format:**
An array of objects where each object represents a data point. The structure depends on the specific query but typically includes:
- Categorical fields (e.g., \`method\`, \`year\`, \`venue\`)
- Numeric fields (e.g., \`count\`, \`percentage\`, \`citations\`)

**Example:**
\`\`\`json
[
  { "method": "Case Study", "count": 145 },
  { "method": "Survey", "count": 98 }
]
\`\`\``,
      control: { type: 'object' },
      table: {
        type: { summary: 'Record<string, unknown>[]' },
        category: 'Data',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AIAssistant>;

export const Default: Story = {
  render: () => <AIAssistantWrapper isConfigured={true} />,
  parameters: {
    docs: {
      description: {
        story: `Default AI Assistant with configured AI settings. Shows the initial analysis of research methods in Requirements Engineering, chat input, and control buttons for reasoning and chart visibility.

The component automatically generates an initial analysis when mounted with valid query and data props.`,
      },
    },
  },
};

export const NotConfigured: Story = {
  render: () => <AIAssistantWrapper isConfigured={false} />,
  parameters: {
    docs: {
      description: {
        story: `AI Assistant when AI is not configured. The configuration button (gear icon) shows a warning badge prompting the user to set up API keys.

In this state, the component will display a message indicating that AI configuration is required before generating analysis.`,
      },
    },
  },
};

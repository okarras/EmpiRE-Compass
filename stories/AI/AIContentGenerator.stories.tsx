import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import AIContentGenerator from '../../src/components/AI/AIContentGenerator';
import aiReducer from '../../src/store/slices/aiSlice';

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

// SPARQL query result data representing research method trends

const mockResearchMethodData = [
  { year: '2020', method: 'Case Study', count: 45, percentage: 28.5 },
  { year: '2020', method: 'Survey', count: 32, percentage: 20.3 },
  { year: '2020', method: 'Experiment', count: 25, percentage: 15.8 },
  { year: '2021', method: 'Case Study', count: 52, percentage: 27.1 },
  { year: '2021', method: 'Survey', count: 38, percentage: 19.8 },
  { year: '2021', method: 'Experiment', count: 31, percentage: 16.1 },
  { year: '2022', method: 'Case Study', count: 61, percentage: 26.4 },
  { year: '2022', method: 'Survey', count: 44, percentage: 19.0 },
  { year: '2022', method: 'Experiment', count: 38, percentage: 16.5 },
  { year: '2023', method: 'Case Study', count: 73, percentage: 25.8 },
  { year: '2023', method: 'Survey', count: 51, percentage: 18.0 },
  { year: '2023', method: 'Experiment', count: 45, percentage: 15.9 },
];

const mockQuestion =
  'What are the trends in research methods used in Requirements Engineering from 2020 to 2023?';

// Wrapper component to demonstrate AIContentGenerator behavior
const AIContentGeneratorWrapper = ({
  isConfigured = true,
  showLoadingDemo = false,
  showErrorDemo = false,
}: {
  isConfigured?: boolean;
  showLoadingDemo?: boolean;
  showErrorDemo?: boolean;
}) => {
  // Loading state demo
  if (showLoadingDemo) {
    return (
      <Provider store={createMockStore(isConfigured)}>
        <Box sx={{ padding: '20px', maxWidth: '600px' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#e86161' }}>
            AI Content Generator - Loading State
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <CircularProgress sx={{ color: '#e86161', mb: 2 }} />
            <Typography color="text.secondary">
              Generating AI charts and analysis...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This may take a moment as we create HTML charts and detailed
              interpretations for each section.
            </Typography>
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                gap: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label="Chart Generation"
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip label="Description" size="small" variant="outlined" />
              <Chip label="Interpretations" size="small" variant="outlined" />
            </Box>
          </Paper>
        </Box>
      </Provider>
    );
  }

  // Error state demo
  if (showErrorDemo) {
    return (
      <Provider store={createMockStore(isConfigured)}>
        <Box sx={{ padding: '20px', maxWidth: '600px' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#e86161' }}>
            AI Content Generator - Error State
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to generate AI content. Please check your API configuration
            and try again.
          </Alert>
          <Paper
            elevation={0}
            sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}
          >
            <Typography variant="body2" color="text.secondary">
              Common causes:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Invalid or expired API key
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Rate limit exceeded
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Network connectivity issues
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  Service temporarily unavailable
                </Typography>
              </li>
            </ul>
          </Paper>
        </Box>
      </Provider>
    );
  }

  return (
    <Provider store={createMockStore(isConfigured)}>
      <Box sx={{ padding: '20px', maxWidth: '700px' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#e86161' }}>
          AI Content Generator Demo
        </Typography>

        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Research Question:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {mockQuestion}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Sample Data ({mockResearchMethodData.length} rows):
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="pre"
            sx={{ fontSize: '0.75rem', overflow: 'auto' }}
          >
            {JSON.stringify(mockResearchMethodData.slice(0, 4), null, 2)}
            {'\n... and {mockResearchMethodData.length - 4} more rows'}
          </Typography>
        </Paper>

        {!isConfigured && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              AI Configuration Required
            </Typography>
            <Typography variant="body2">
              Please configure your AI settings (OpenAI, Groq, or Mistral)
              before generating content.
            </Typography>
          </Alert>
        )}

        {isConfigured && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              In production, the AIContentGenerator automatically starts
              generating content when mounted with valid data. This demo shows
              the component structure without making actual API calls.
            </Typography>
          </Alert>
        )}
      </Box>
    </Provider>
  );
};

const meta: Meta<typeof AIContentGenerator> = {
  title: 'AI/AIContentGenerator',
  component: AIContentGenerator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`AIContentGenerator\` automatically generates AI-powered content including charts, descriptions, and interpretations based on SPARQL query results. It creates interactive HTML charts using Chart.js and generates explanatory text for different sections.

## Features
- **Auto-Generation**: Automatically starts generating when mounted with valid data
- **Chart Generation**: Creates complete HTML documents with Chart.js visualizations
- **Multiple Interpretations**: Generates question, data collection, and analysis interpretations
- **Cost Tracking**: Tracks token usage and costs for each generation step

## Backend Service Dependency
This component relies on the \`useAIService\` hook which connects to the backend AI service:

\`\`\`typescript
const aiService = useAIService();

// Check if AI is configured
if (!aiService.isConfigured()) {
  // Show configuration required message
}

// Generate text content
const result = await aiService.generateText(prompt, {
  temperature: 0.3,
  maxTokens: 1000,
});
\`\`\`

## Required Context
- **Redux Provider** with \`aiSlice\` - Provides AI configuration state

## Generated Content Structure
The component generates 5 pieces of content:
1. **chartHtml**: Complete HTML document with Chart.js visualization
2. **chartDescription**: HTML-formatted description of the chart
3. **questionInterpretation**: Plain text explanation of the research question
4. **dataCollectionInterpretation**: Plain text explanation of data requirements
5. **dataAnalysisInterpretation**: Plain text explanation of the analysis approach

## Cost Tracking
Each generation step tracks:
- Input tokens
- Output tokens
- Total cost
- Section name`,
      },
    },
  },
  argTypes: {
    data: {
      description: `Array of data objects from SPARQL query results. This is the dataset that will be analyzed and visualized.

**Expected Format:**
An array of objects where each object represents a data point. The component analyzes the data structure to determine appropriate chart types and configurations.

**Example:**
\`\`\`json
[
  { "year": "2020", "method": "Case Study", "count": 45 },
  { "year": "2020", "method": "Survey", "count": 32 }
]
\`\`\``,
      control: { type: 'object' },
      table: {
        type: { summary: 'Record<string, unknown>[]' },
        category: 'Data',
      },
    },
    question: {
      description: `The research question being analyzed. This text is used to generate contextually relevant interpretations and chart descriptions.

**Example:** "What are the trends in research methods used in Requirements Engineering from 2020 to 2023?"`,
      control: { type: 'text' },
      table: {
        type: { summary: 'string' },
        category: 'Data',
      },
    },
    onContentGenerated: {
      description: `Callback function invoked when all content has been successfully generated.

**Signature:**
\`\`\`typescript
(
  chartHtml: string,
  chartDescription: string,
  questionInterpretation: string,
  dataCollectionInterpretation: string,
  dataAnalysisInterpretation: string,
  costs?: CostBreakdown[]
) => void
\`\`\``,
      action: 'contentGenerated',
      table: {
        type: { summary: 'function' },
        category: 'Callbacks',
      },
    },
    onError: {
      description: `Callback function invoked when an error occurs during content generation.

**Signature:**
\`\`\`typescript
(error: string) => void
\`\`\`

**Common errors:**
- API configuration issues
- Rate limiting
- Network failures`,
      action: 'error',
      table: {
        type: { summary: '(error: string) => void' },
        category: 'Callbacks',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AIContentGenerator>;

export const Default: Story = {
  render: () => <AIContentGeneratorWrapper isConfigured={true} />,
  parameters: {
    docs: {
      description: {
        story: `Default state showing the AI Content Generator with configured AI settings. 

In production, the component would automatically start generating content when mounted. This demo shows the component structure and expected data format without making actual API calls.`,
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <AIContentGeneratorWrapper isConfigured={true} showLoadingDemo={true} />
  ),
  parameters: {
    docs: {
      description: {
        story: `Loading state while the AI is generating charts and analysis content.

The generation process includes multiple steps:
1. Chart HTML generation (with Chart.js)
2. Chart description generation
3. Question interpretation
4. Data collection interpretation
5. Data analysis interpretation

Each step makes a separate API call to the configured AI provider.`,
      },
    },
  },
};

export const Error: Story = {
  render: () => (
    <AIContentGeneratorWrapper isConfigured={true} showErrorDemo={true} />
  ),
  parameters: {
    docs: {
      description: {
        story: `Error state when content generation fails. The \`onError\` callback is invoked with an error message.

Common causes of errors:
- Invalid or expired API key
- Rate limit exceeded
- Network connectivity issues
- Service temporarily unavailable`,
      },
    },
  },
};

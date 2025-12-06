import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import FloatingAIAssistant from '../../src/components/AI/FloatingAIAssistant';
import {
  AIAssistantProvider,
  useAIAssistantContext,
} from '../../src/context/AIAssistantContext';
import aiReducer from '../../src/store/slices/aiSlice';
import type { Query } from '../../src/constants/queries_chart_info';

// mock store with AI configuration
const createMockStore = () =>
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
        isConfigured: true,
        useEnvironmentKeys: true,
      },
    },
  });

// mock query matching the Query interface

const mockQuery: Query = {
  id: 1,
  uid: 'RE_METHODS_ANALYSIS',
  title: 'Research Methods in Requirements Engineering',
  chartType: 'bar',
  chartSettings: {
    heading: 'Distribution of Research Methods in RE Studies',
    yAxis: { dataKey: 'count', name: 'Number of Papers' },
    xAxis: { dataKey: 'method', name: 'Research Method' },
    series: [{ dataKey: 'count', name: 'Papers', color: '#e86161' }],
    colors: ['#e86161', '#61e8aa', '#6161e8'],
    height: 400,
    sx: {},
  },
  dataAnalysisInformation: {
    question:
      'What are the most common research methods used in Requirements Engineering studies?',
    questionExplanation:
      'Analysis of research methods used in Requirements Engineering studies from 2020 to 2023',
    dataAnalysis:
      'The data shows the distribution of research methods across RE publications.',
    requiredDataForAnalysis:
      'SPARQL query results containing method names and paper counts.',
  },
};

// SPARQL query result data

const mockData = [
  { method: 'Case Study', count: 145, percentage: 26.4 },
  { method: 'Survey', count: 98, percentage: 17.8 },
  { method: 'Experiment', count: 76, percentage: 13.8 },
  { method: 'Action Research', count: 45, percentage: 8.2 },
];

/**
 * Component to control the assistant state
 * Used in stories to demonstrate different states
 */
const AutoOpenAssistant = ({
  shouldOpen = false,
  withContext = false,
}: {
  shouldOpen?: boolean;
  withContext?: boolean;
}) => {
  const { toggleAssistant, setContext, isOpen } = useAIAssistantContext();

  useEffect(() => {
    if (withContext) {
      setContext(mockQuery, mockData);
    }
    if (shouldOpen && !isOpen) {
      toggleAssistant();
    }
  }, [shouldOpen, withContext, toggleAssistant, setContext, isOpen]);

  return <FloatingAIAssistant />;
};

// Wrapper component providing all required context providers
const FloatingAIAssistantWrapper = ({
  defaultOpen = false,
  withContext = false,
}: {
  defaultOpen?: boolean;
  withContext?: boolean;
}) => {
  return (
    <Provider store={createMockStore()}>
      <MemoryRouter initialEntries={['/']}>
        <AIAssistantProvider>
          <Box
            sx={{
              height: '600px',
              width: '100%',
              position: 'relative',
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Paper elevation={0} sx={{ p: 3, m: 2, backgroundColor: 'white' }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <SmartToyIcon sx={{ color: '#e86161', fontSize: 32 }} />
                <Typography
                  variant="h5"
                  sx={{ color: '#e86161', fontWeight: 600 }}
                >
                  EmpiRE-Compass Demo Page
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                This demo page shows the Floating AI Assistant component.
                {!defaultOpen &&
                  ' Click the red floating button in the bottom-right corner to open the assistant.'}
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <QuestionAnswerIcon sx={{ color: '#e86161' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Interactive AI Chat"
                    secondary="Ask questions about research data and get AI-powered insights"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BarChartIcon sx={{ color: '#e86161' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data Visualization"
                    secondary="View charts and analysis of ORKG research data"
                  />
                </ListItem>
              </List>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, fontStyle: 'italic' }}
              >
                {withContext
                  ? '✓ The assistant is loaded with research context data about RE methods.'
                  : '○ The assistant shows the project overview when no context is set.'}
              </Typography>
            </Paper>
            <AutoOpenAssistant
              shouldOpen={defaultOpen}
              withContext={withContext}
            />
          </Box>
        </AIAssistantProvider>
      </MemoryRouter>
    </Provider>
  );
};

const meta: Meta<typeof FloatingAIAssistant> = {
  title: 'AI/FloatingAIAssistant',
  component: FloatingAIAssistant,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`FloatingAIAssistant\` provides a floating action button (FAB) that opens a draggable AI assistant dialog. It serves as the global AI interface for the EmpiRE-Compass application.

## Features
- **Floating Action Button**: Red FAB positioned in bottom-right corner with smooth animations
- **Draggable Dialog**: Non-expanded dialog can be dragged to any position on screen
- **Expandable**: Toggle between compact and fullscreen modes
- **Context-Aware**: Displays project overview or context-specific AI assistance
- **Route Integration**: Automatically updates context based on current route

## Required Context Providers
This component requires multiple providers to function correctly:

1. **Redux Provider** with \`aiSlice\` - Manages AI configuration state
2. **AIAssistantProvider** - Manages assistant state (open/closed, context, expansion)
3. **MemoryRouter/BrowserRouter** - Required for route-based context updates

## Context Management
The assistant operates in two modes:
- **Overview Mode**: When \`currentQuery\` and \`currentData\` are null, shows project overview
- **Analysis Mode**: When context is set via \`setContext(query, data)\`, shows AIAssistant component

## Usage Example
\`\`\`tsx
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { AIAssistantProvider } from '../../context/AIAssistantContext';
import FloatingAIAssistant from './FloatingAIAssistant';

<Provider store={store}>
  <BrowserRouter>
    <AIAssistantProvider>
      <App />
      <FloatingAIAssistant />
    </AIAssistantProvider>
  </BrowserRouter>
</Provider>
\`\`\`

## AIAssistantContext API
The component uses the following context values:
- \`isOpen\`: Boolean indicating if dialog is open
- \`toggleAssistant()\`: Function to toggle open/closed state
- \`currentQuery\`: Current Query object or null
- \`currentData\`: Current data array or null
- \`setContext(query, data)\`: Function to set analysis context
- \`isExpanded\`: Boolean indicating fullscreen mode
- \`setIsExpanded(boolean)\`: Function to toggle expansion`,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    // FloatingAIAssistant has no direct props - it uses context
  },
};

export default meta;
type Story = StoryObj<typeof FloatingAIAssistant>;

export const Default: Story = {
  render: () => (
    <FloatingAIAssistantWrapper defaultOpen={false} withContext={false} />
  ),
  parameters: {
    docs: {
      description: {
        story: `Default state showing the floating action button (FAB) in the bottom-right corner. 

Click the red button with the robot icon to open the AI assistant dialog. In this state, no research context is set, so the assistant will show the project overview.`,
      },
    },
  },
};

export const WithResearchContext: Story = {
  render: () => (
    <FloatingAIAssistantWrapper defaultOpen={true} withContext={true} />
  ),
  parameters: {
    docs: {
      description: {
        story: `AI assistant with research context loaded. 

When context is set via \`setContext(query, data)\`, the dialog displays the full AIAssistant component with:
- Initial AI analysis of the research question
- Interactive chat for follow-up questions
- Reasoning and chart visibility toggles
- Chat history export functionality

This is the typical state when a user clicks on a research question in the application.`,
      },
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import Dashboard from '../../src/components/Dashboard';

// mock store with pre-populated questions
const createMockStore = (withQuestions = true) => {
  const mockFirebaseQuestions = withQuestions
    ? {
        Q1: {
          id: 1,
          uid: 'query_1',
          title: 'Number of papers with an empirical study per year',
          dataAnalysisInformation: {
            question:
              'How has the proportion of empirical studies evolved over time?',
            questionExplanation:
              '<p>This question analyzes the temporal trends in empirical research methodology adoption within the Requirements Engineering domain.</p>',
            requiredDataForAnalysis:
              '<p>Publication year for each paper and classification of empirical study components.</p>',
            dataAnalysis:
              '<p>Bar chart visualization showing count of papers with empirical studies per year.</p>',
            dataInterpretation:
              '<p>Rising trend reflects increasing methodological rigor in RE research.</p>',
          },
        },
        Q2: {
          id: 2,
          uid: 'query_2_1',
          uid_2: 'query_2_2',
          title:
            'Number of empirical methods used for data collection & data analysis per year',
          dataAnalysisInformation: {
            question: 'How often are which empirical methods used over time?',
            questionExplanation:
              '<p>This question examines the frequency and distribution of different empirical research methods.</p>',
            requiredDataForAnalysis:
              '<p>Publication year and empirical methods used for data collection and analysis.</p>',
            dataAnalysis:
              '<p>Dual visualizations for data collection and analysis methods.</p>',
            dataInterpretation:
              '<p>Case studies remain the dominant empirical method in RE research.</p>',
          },
        },
        Q3: {
          id: 3,
          uid: 'query_3',
          title: 'Number of papers without an empirical study per year',
          dataAnalysisInformation: {
            question:
              'How has the proportion of papers that do not have an empirical study evolved over time?',
            questionExplanation:
              '<p>This examines papers without empirical studies like theoretical or position papers.</p>',
            requiredDataForAnalysis:
              '<p>Complete paper dataset and classification of non-empirical papers.</p>',
            dataAnalysis:
              '<p>Count papers without empirical studies per year.</p>',
            dataInterpretation:
              '<p>Declining proportion indicates field maturation.</p>',
          },
        },
      }
    : {};

  return configureStore({
    reducer: {
      questions: () => ({
        questions: [],
        firebaseQuestions: mockFirebaseQuestions,
        currentQuestion: null,
        questionData: {},
        loading: { questions: false, questionData: false },
        error: { questions: null, questionData: null },
        normalized: true,
      }),
    },
  });
};

// Wrapper component
const DashboardWrapper = ({
  templateId = 'R186491',
  withQuestions = true,
}: {
  templateId?: string;
  withQuestions?: boolean;
}) => {
  const mockStore = createMockStore(withQuestions);

  return (
    <Provider store={mockStore}>
      <MemoryRouter initialEntries={[`/statistics/${templateId}`]}>
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Alert severity="info" sx={{ m: 2 }}>
            This is a preview of the Dashboard component. Full functionality
            requires connection to Firebase and the ORKG SPARQL endpoint.
          </Alert>
          <Routes>
            <Route path="/statistics/:templateId" element={<Dashboard />} />
          </Routes>
        </Box>
      </MemoryRouter>
    </Provider>
  );
};

const meta: Meta<typeof Dashboard> = {
  title: 'Layout/Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Dashboard displays a collection of research questions for a specific ORKG template. Each question is shown as an expandable accordion with charts, data analysis, and interpretations.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

export const WithQuestions: Story = {
  render: () => <DashboardWrapper templateId="R186491" withQuestions={true} />,
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with loaded questions showing the template info box and three research question accordions.',
      },
    },
  },
};

export const EmptyState: Story = {
  render: () => <DashboardWrapper templateId="R186491" withQuestions={false} />,
  parameters: {
    docs: {
      description: {
        story:
          'Dashboard with no questions loaded. Shows only the template info box.',
      },
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { Box, Alert } from '@mui/material';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DynamicAIQuestion from '../../src/components/DynamicAIQuestion';
import { DynamicQuestionProvider } from '../../src/context/DynamicQuestionContext';
import { AIAssistantProvider } from '../../src/context/AIAssistantContext';

// Wrapper component
const DynamicAIQuestionWrapper = ({
  withInitialState = false,
  templateId = 'R186491',
}: {
  withInitialState?: boolean;
  templateId?: string;
}) => {
  // Set up mock localStorage data
  useEffect(() => {
    if (withInitialState) {
      localStorage.setItem(
        'current-dynamic-question',
        JSON.stringify({
          question:
            'What are the most common research methods used in Requirements Engineering papers?',
          sparqlQuery: `PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?method ?methodLabel (COUNT(?paper) as ?count)
WHERE {
  ?paper orkgp:P31 orkgr:R186491 .
  ?paper orkgp:hasResearchMethod ?method .
  ?method rdfs:label ?methodLabel .
}
GROUP BY ?method ?methodLabel
ORDER BY DESC(?count)
LIMIT 20`,
          sparqlTranslation:
            'This query retrieves research methods from papers using the NLP4RE template.',
          queryResults: [
            { method: 'Case Study', count: 45 },
            { method: 'Survey', count: 32 },
            { method: 'Experiment', count: 28 },
            { method: 'Literature Review', count: 22 },
          ],
          chartHtml: '',
          questionInterpretation:
            'This question explores the distribution of research methodologies in RE papers.',
          dataCollectionInterpretation:
            'Data is collected from ORKG papers tagged with the NLP4RE template.',
          dataAnalysisInterpretation:
            'Analysis shows Case Study is the most common method.',
          processingFunctionCode: '',
          history: [],
          templateId: templateId,
          templateMapping: null,
          targetClassId: 'C27001',
          costs: [],
        })
      );
    } else {
      localStorage.setItem(
        'current-dynamic-question',
        JSON.stringify({
          question: '',
          sparqlQuery: '',
          sparqlTranslation: '',
          queryResults: [],
          chartHtml: '',
          questionInterpretation: '',
          dataCollectionInterpretation: '',
          dataAnalysisInterpretation: '',
          processingFunctionCode: '',
          history: [],
          templateId: templateId,
          templateMapping: null,
          targetClassId: null,
          costs: [],
        })
      );
    }

    return () => {
      localStorage.removeItem('current-dynamic-question');
    };
  }, [withInitialState, templateId]);

  return (
    <MemoryRouter initialEntries={[`/dynamic?template=${templateId}`]}>
      <AIAssistantProvider>
        <DynamicQuestionProvider>
          <Box sx={{ padding: '20px', maxWidth: '1200px' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This is a preview of the DynamicAIQuestion component. Full
              functionality requires AI service configuration and connection to
              the ORKG SPARQL endpoint.
            </Alert>
            <Routes>
              <Route path="/dynamic" element={<DynamicAIQuestion />} />
            </Routes>
          </Box>
        </DynamicQuestionProvider>
      </AIAssistantProvider>
    </MemoryRouter>
  );
};

const meta: Meta<typeof DynamicAIQuestion> = {
  title: 'Questions/DynamicAIQuestion',
  component: DynamicAIQuestion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`DynamicAIQuestion` is a comprehensive component for AI-powered research question analysis. It allows users to enter natural language questions, generates SPARQL queries using AI, executes them against the ORKG endpoint, processes the results, and generates visualizations and interpretations.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DynamicAIQuestion>;

export const Default: Story = {
  render: () => <DynamicAIQuestionWrapper withInitialState={false} />,
  parameters: {
    docs: {
      description: {
        story:
          'Default empty state. Users can enter a research question and click "Generate & Run" to start the AI-powered analysis workflow.',
      },
    },
  },
};

export const WithInitialData: Story = {
  render: () => <DynamicAIQuestionWrapper withInitialState={true} />,
  parameters: {
    docs: {
      description: {
        story:
          'State with pre-populated question, SPARQL query, and results. Shows how the component looks after a successful query execution.',
      },
    },
  },
};

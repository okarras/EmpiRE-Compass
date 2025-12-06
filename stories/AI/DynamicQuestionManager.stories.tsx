import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography, Paper } from '@mui/material';
import DynamicQuestionManager from '../../src/components/AI/DynamicQuestionManager';
import { DynamicQuestionProvider } from '../../src/context/DynamicQuestionContext';

const DynamicQuestionManagerWrapper = () => {
  return (
    <DynamicQuestionProvider>
      <Box sx={{ padding: '20px', maxWidth: '800px' }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'rgba(232, 97, 97, 0.05)',
            border: '1px solid rgba(232, 97, 97, 0.1)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            The Dynamic Question Manager allows you to save, load, export, and
            import research questions with all their associated data, SPARQL
            queries, charts, and analysis interpretations. Interact with the
            buttons to explore save, load, export, and import functionality.
          </Typography>
        </Paper>
        <DynamicQuestionManager />
      </Box>
    </DynamicQuestionProvider>
  );
};

const meta: Meta<typeof DynamicQuestionManager> = {
  title: 'AI/DynamicQuestionManager',
  component: DynamicQuestionManager,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`DynamicQuestionManager\` provides functionality to save, load, export, and import dynamic research questions. It persists questions with all their data to localStorage and supports JSON export/import for sharing.

## Features
- **Save Current**: Save the current question state with a custom name
- **Load Saved**: Browse and load previously saved questions
- **Export All**: Export all saved questions (including current) as JSON
- **Import**: Import questions from a JSON file

## Required Context Provider
This component requires the \`DynamicQuestionProvider\` context:

\`\`\`tsx
import { DynamicQuestionProvider } from '../../context/DynamicQuestionContext';
import DynamicQuestionManager from './DynamicQuestionManager';

<DynamicQuestionProvider>
  <DynamicQuestionManager />
</DynamicQuestionProvider>
\`\`\`

## Data Persistence
Questions are stored in localStorage with the following keys:
- \`saved-dynamic-questions\`: Array of SavedDynamicQuestion objects
- \`current-dynamic-question\`: Current DynamicQuestionState object

## SavedDynamicQuestion Structure
\`\`\`typescript
interface SavedDynamicQuestion {
  id: string;           // Unique identifier
  name: string;         // User-provided name
  timestamp: number;    // Save timestamp
  state: DynamicQuestionState;  // Complete question state
}
\`\`\`

## DynamicQuestionState Structure
Each saved question includes:
- \`question\`: The research question text
- \`sparqlQuery\`: Generated SPARQL query
- \`sparqlTranslation\`: Human-readable query explanation
- \`queryResults\`: Array of result objects
- \`chartHtml\`: Generated chart HTML
- \`questionInterpretation\`: AI interpretation of the question
- \`dataCollectionInterpretation\`: Data collection explanation
- \`dataAnalysisInterpretation\`: Analysis explanation
- \`processingFunctionCode\`: Custom data processing code
- \`history\`: Array of modification history
- \`templateId\`: ORKG template ID
- \`costs\`: Array of AI operation costs`,
      },
    },
  },
  argTypes: {
    // DynamicQuestionManager has no direct props - it uses context
  },
};

export default meta;
type Story = StoryObj<typeof DynamicQuestionManager>;

export const Default: Story = {
  render: () => <DynamicQuestionManagerWrapper />,
  parameters: {
    docs: {
      description: {
        story: `Interactive question manager for saving, loading, exporting, and importing research questions. The component manages localStorage state dynamically based on user interactions. Click the buttons to explore:
- **Save Current**: Save the current question state with a custom name
- **Load Saved**: Browse and load previously saved questions
- **Export All**: Download all saved questions as JSON
- **Import**: Upload a JSON file to import questions`,
      },
    },
  },
};

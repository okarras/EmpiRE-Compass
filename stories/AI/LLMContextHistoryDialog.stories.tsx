import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import LLMContextHistoryDialog from '../../src/components/AI/LLMContextHistoryDialog';
import { DynamicQuestionProvider } from '../../src/context/DynamicQuestionContext';

// Wrapper component to provide context and manage dialog state
const LLMContextHistoryWrapper = () => {
  const [open, setOpen] = useState(false);

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
            The LLM Context History Dialog allows you to manage which history
            items are included as context in AI prompts. You can include/exclude
            items, search through history, and permanently delete items. The
            latest SPARQL result is always included. Click the button to open
            the dialog and interact with the component.
          </Typography>
        </Paper>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Context Management:</strong> Items marked as "included" will
            be sent to the AI as context for generating responses. Excluding
            items reduces token usage but may affect response quality.
          </Typography>
        </Alert>

        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<HistoryIcon />}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d45151' },
          }}
        >
          Open LLM Context History
        </Button>
        <LLMContextHistoryDialog open={open} onClose={() => setOpen(false)} />
      </Box>
    </DynamicQuestionProvider>
  );
};

const meta: Meta<typeof LLMContextHistoryDialog> = {
  title: 'AI/LLMContextHistoryDialog',
  component: LLMContextHistoryDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`LLMContextHistoryDialog\` provides an interface for managing which history items are used as context in AI prompts. Users can include/exclude items, search through history, and permanently delete items.

## Purpose
When generating AI responses, the system includes relevant history as context to improve response quality. This dialog allows users to:
- **Control context size**: Exclude items to reduce token usage
- **Improve relevance**: Remove irrelevant history from context
- **Manage storage**: Permanently delete old or unwanted items

## Key Features
- **Include/Exclude Toggle**: Switch items on/off for context inclusion
- **Latest SPARQL Protection**: The most recent SPARQL result is always included
- **Section Grouping**: Items organized by Research Questions, SPARQL Queries, Chart Visualizations, and Analysis Results
- **Search**: Filter items by content, title, or section
- **Bulk Operations**: Include all, exclude all, or delete by section
- **Preferences**: Customize view settings

## Required Context Provider
This component requires the \`DynamicQuestionProvider\` context:

\`\`\`tsx
import { DynamicQuestionProvider } from '../../context/DynamicQuestionContext';
import LLMContextHistoryDialog from './LLMContextHistoryDialog';

<DynamicQuestionProvider>
  <LLMContextHistoryDialog open={open} onClose={handleClose} />
</DynamicQuestionProvider>
\`\`\`

## Context Sections
- **Research Questions**: User questions and AI-refined questions
- **SPARQL Queries**: Generated and modified SPARQL queries
- **Chart Visualizations**: Chart HTML and configurations
- **Analysis Results**: AI-generated interpretations and analysis

## History Item Actions
- **Manual Edit**: User directly modified the content
- **AI Modified**: AI generated or modified the content based on a prompt

## Data Structure
History items are stored in the \`history\` array of the DynamicQuestionState:

\`\`\`typescript
interface DynamicQuestionHistory {
  id: string;
  timestamp: number;
  type: 'question' | 'sparql' | 'chart' | 'analysis';
  action: 'edited' | 'ai_modified';
  content: string;
  prompt?: string;
  previousContent?: string;
}
\`\`\``,
      },
    },
  },
  argTypes: {
    open: {
      description: `Controls whether the dialog is visible.

When \`true\`, the dialog opens as a modal overlay showing all context history items. When \`false\`, the dialog is hidden.`,
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    onClose: {
      description: `Callback function invoked when the dialog is closed.

Called when:
- User clicks the Close button
- User clicks the X icon in the header
- User presses Escape key

**Note:** Changes to include/exclude status are applied immediately and persist even after closing.`,
      action: 'closed',
      table: {
        type: { summary: '() => void' },
        category: 'Callbacks',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LLMContextHistoryDialog>;

export const Default: Story = {
  render: () => <LLMContextHistoryWrapper />,
  parameters: {
    docs: {
      description: {
        story: `Interactive LLM context history manager for controlling which history items are included in AI prompts. Click "Open LLM Context History" to explore features like:
- **Include/Exclude Toggles**: Control which items are sent as context to the AI
- **Section Grouping**: Items organized by Research Questions, SPARQL Queries, Chart Visualizations, and Analysis Results
- **Latest SPARQL Protection**: The most recent SPARQL result is always included and cannot be excluded
- **Search**: Filter items by content, title, or section
- **Bulk Actions**: Include all, exclude all, or delete by section
- **Preferences**: Customize view settings

Note: History items are stored in the DynamicQuestionContext and will populate as users interact with the AI in the actual application.`,
      },
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import {
  HistoryManager,
  HistoryItem,
} from '../../src/components/AI/HistoryManager';

const HistoryManagerWrapper = () => {
  const [open, setOpen] = useState(false);
  const [appliedItem, setAppliedItem] = useState<HistoryItem | null>(null);

  const handleApplyHistoryItem = (item: HistoryItem) => {
    setAppliedItem(item);
    setOpen(false);
  };

  return (
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
          The History Manager provides a comprehensive interface for managing AI
          interaction history. It supports searching, filtering by type/section,
          editing, deleting, and applying previous history items. Click
          "Question History" to open the dialog and interact with the component.
        </Typography>
      </Paper>

      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        startIcon={<HistoryIcon />}
        sx={{
          backgroundColor: '#e86161',
          '&:hover': { backgroundColor: '#d45151' },
          mb: 2,
        }}
      >
        Question History
      </Button>

      {appliedItem && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Applied History Item:</Typography>
          <Typography variant="body2">{appliedItem.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            Type: {appliedItem.type.replace('_', ' ')} | Section:{' '}
            {appliedItem.section}
          </Typography>
        </Alert>
      )}

      <HistoryManager
        open={open}
        type={null}
        onClose={() => setOpen(false)}
        onApplyHistoryItem={handleApplyHistoryItem}
      />
    </Box>
  );
};

const meta: Meta<typeof HistoryManager> = {
  title: 'AI/HistoryManager',
  component: HistoryManager,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`HistoryManager\` provides a comprehensive interface for managing AI interaction history. It supports searching, filtering, editing, deleting, and applying previous history items.

## Features
- **Search**: Full-text search across title, content, type, and section
- **Section Grouping**: Organize history by functional sections
- **Filtering**: Filter by specific history types
- **Edit**: Modify history item content with appropriate editors
- **Delete**: Remove individual items or bulk delete by section/type
- **Apply**: Restore a previous history item to the current state
- **Preferences**: Customize view (compact, sort order, auto-save)

## History Item Types
- \`query\`: Research questions
- \`sparql\`: SPARQL queries
- \`chart_html\`: Generated chart HTML
- \`chart_description\`: Chart descriptions
- \`data_interpretation\`: Data analysis interpretations
- \`question_interpretation\`: Question explanations
- \`data_collection_interpretation\`: Data collection explanations
- \`data_analysis_interpretation\`: Analysis methodology explanations

## History Sections
Items are categorized into sections:
- **Query & Analysis**: Research questions and analysis
- **Data Visualization**: Charts and descriptions
- **SPARQL & Database**: SPARQL queries
- **Content Interpretation**: All interpretation types
- **Other**: Uncategorized items

## Data Persistence
History is stored in localStorage under the key \`dynamicAI_history\`.
Preferences are stored under \`dynamicAI_history_preferences\`.

## HistoryItem Interface
\`\`\`typescript
interface HistoryItem {
  id: string;           // Unique identifier
  timestamp: number;    // Creation timestamp
  content: string;      // The actual content
  type: HistoryItemType; // Type classification
  title: string;        // Display title
  section?: string;     // Section categorization
}
\`\`\``,
      },
    },
  },
  argTypes: {
    open: {
      description: `Controls whether the history dialog is visible.

When \`true\`, the dialog opens as a modal overlay. When \`false\`, the dialog is hidden but maintains its internal state.`,
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    type: {
      description: `Optional filter to show only history items of a specific type.

When \`null\`, all history types are shown. When set to a specific type, only items matching that type are displayed.

**Available types:**
- \`query\` - Research questions
- \`sparql\` - SPARQL queries
- \`chart_html\` - Generated chart HTML
- \`chart_description\` - Chart descriptions
- \`data_interpretation\` - Data interpretations
- \`question_interpretation\` - Question explanations
- \`data_collection_interpretation\` - Data collection explanations
- \`data_analysis_interpretation\` - Analysis explanations`,
      control: {
        type: 'select',
        options: [
          null,
          'query',
          'sparql',
          'chart_html',
          'chart_description',
          'data_interpretation',
          'question_interpretation',
          'data_collection_interpretation',
          'data_analysis_interpretation',
        ],
      },
      table: {
        type: { summary: 'HistoryItem["type"] | null' },
        defaultValue: { summary: 'null' },
        category: 'Filtering',
      },
    },
    onClose: {
      description: `Callback function invoked when the dialog is closed.

Called when:
- User clicks the Close button
- User clicks outside the dialog (backdrop)
- User presses Escape key`,
      action: 'closed',
      table: {
        type: { summary: '() => void' },
        category: 'Callbacks',
      },
    },
    onApplyHistoryItem: {
      description: `Callback function invoked when a history item is applied.

The selected \`HistoryItem\` is passed to this callback, allowing the parent component to restore the content to the appropriate state.

**Signature:**
\`\`\`typescript
(item: HistoryItem) => void
\`\`\``,
      action: 'applied',
      table: {
        type: { summary: '(item: HistoryItem) => void' },
        category: 'Callbacks',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HistoryManager>;

export const Default: Story = {
  render: () => <HistoryManagerWrapper />,
  parameters: {
    docs: {
      description: {
        story: `Interactive history manager for browsing, searching, editing, and applying AI interaction history. The component manages localStorage state dynamically based on user interactions. Click "Question History" to explore features like:
- **Search**: Full-text search across history items
- **Section Grouping**: Items organized by functional sections
- **Filtering**: Filter by specific history types (pass \`type\` prop)
- **Edit/Delete**: Modify or remove history items
- **Apply**: Restore previous history items to current state
- **Preferences**: Customize view settings

Note: History items are stored in localStorage and will persist across sessions in the actual application.`,
      },
    },
  },
};

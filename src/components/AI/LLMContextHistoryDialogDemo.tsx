import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import LLMContextHistoryDialog from './LLMContextHistoryDialog';

const LLMContextHistoryDialogDemo: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced LLM Context History Dialog Demo
      </Typography>

      <Typography variant="body1" paragraph>
        This demo showcases the enhanced LLM Context History Dialog with all the
        same advanced features as the HistoryManager:
      </Typography>

      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}>
        <Typography variant="h6" gutterBottom color="primary">
          🚀 New Features Added:
        </Typography>

        <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
          <li>
            <strong>🔍 Advanced Search:</strong> Search through context items by
            title, content, source, action, or section
          </li>
          <li>
            <strong>📁 Smart Section Categorization:</strong> Automatic grouping
            into:
            <ul>
              <li>Research Questions</li>
              <li>SPARQL Queries</li>
              <li>Chart Visualizations</li>
              <li>Analysis Results</li>
              <li>Other Context</li>
            </ul>
          </li>
          <li>
            <strong>⚙️ Customizable Preferences:</strong> Toggle features like
            section grouping, search, compact view, and auto-include latest
          </li>
          <li>
            <strong>🗑️ Flexible Exclusion:</strong> Exclude all context or by
            specific sections (while preserving latest SPARQL results)
          </li>
          <li>
            <strong>📊 Enhanced Statistics:</strong> Clear visibility of
            included vs excluded items
          </li>
          <li>
            <strong>🎨 Improved UI:</strong> Accordions, badges, better
            organization, and responsive design
          </li>
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Key Improvements over Original:
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Before (Original)
          </Typography>
          <ul>
            <li>Simple list view</li>
            <li>No search capability</li>
            <li>No categorization</li>
            <li>Basic include/exclude all</li>
            <li>Fixed layout</li>
          </ul>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="secondary"
            gutterBottom
          >
            After (Enhanced)
          </Typography>
          <ul>
            <li>Section-organized accordions</li>
            <li>Real-time search filtering</li>
            <li>Intelligent auto-categorization</li>
            <li>Section-specific exclusion</li>
            <li>Customizable preferences</li>
            <li>Compact/full view modes</li>
          </ul>
        </Paper>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Storage & Preferences:
      </Typography>

      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
        <Typography
          variant="body2"
          component="pre"
          sx={{ fontFamily: 'monospace' }}
        >
          {`localStorage Keys:
• llm_context_history_preferences - User preferences
  - enableSearch: boolean
  - categorizeBySection: boolean  
  - compactView: boolean
  - defaultSortOrder: 'newest' | 'oldest' | 'relevance'
  - autoIncludeLatest: boolean
  - maxContextItems: number`}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={() => setDialogOpen(true)}
          sx={{ backgroundColor: '#e86161' }}
        >
          Open Enhanced LLM Context Dialog
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            // Clear preferences to show defaults
            localStorage.removeItem('llm_context_history_preferences');
            setDialogOpen(true);
          }}
        >
          Open with Default Settings
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        <strong>Note:</strong> The dialog will show actual context history if
        available, or an empty state with helpful messaging if no context exists
        yet.
      </Typography>

      <LLMContextHistoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
};

export default LLMContextHistoryDialogDemo;

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { useHistoryManager } from './HistoryManager';

interface OrkgAskQuestionSectionProps {
  question: string;
  loading: boolean;
  error: string | null;
  onQuestionChange: (question: string) => void;
  onAsk: () => void;
  onOpenHistory: () => void;
}

const OrkgAskQuestionSection: React.FC<OrkgAskQuestionSectionProps> = ({
  question,
  loading,
  error,
  onQuestionChange,
  onAsk,
  onOpenHistory,
}) => {
  const { renderHistoryButton } = useHistoryManager();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Psychology sx={{ color: '#e86161', fontSize: 28 }} />
          <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 600 }}>
            Ask AI Researcher (ORKG ASK)
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Ask research questions in natural language. The AI will search ORKG
          and provide answers with citations from scholarly literature.
        </Typography>

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-expect-error */}
        {renderHistoryButton('query', 'Question History', onOpenHistory)}

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Your Research Question"
          placeholder="e.g., What are the latest approaches to requirements engineering?"
          value={question}
          onKeyDown={(e) => {
            if (e.shiftKey && e.key === 'Enter') {
              e.preventDefault();
              onAsk();
            }
          }}
          onChange={(e) => onQuestionChange(e.target.value)}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              '&:hover > fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused > fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: 'primary.main',
            },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={onAsk}
            disabled={loading || !question.trim()}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Psychology />
              )
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': {
                backgroundColor: '#d45151',
              },
              '&:disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
              },
            }}
          >
            {loading ? 'Asking AI Researcher...' : 'Ask AI Researcher'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default OrkgAskQuestionSection;

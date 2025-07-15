import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useHistoryManager } from './HistoryManager';

interface SPARQLQuerySectionProps {
  question: string;
  sparqlQuery: string;
  loading: boolean;
  onQuestionChange: (question: string) => void;
  onSparqlChange: (sparql: string) => void;
  onGenerateAndRun: () => void;
  onRunEditedQuery: () => void;
  onOpenHistory: (type: 'query' | 'sparql') => void;
}

const SPARQLQuerySection: React.FC<SPARQLQuerySectionProps> = ({
  question,
  sparqlQuery,
  loading,
  onQuestionChange,
  onSparqlChange,
  onGenerateAndRun,
  onRunEditedQuery,
  onOpenHistory,
}) => {
  const { renderHistoryButton } = useHistoryManager();

  return (
    <>
      {/* Question Input Section */}
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
          {renderHistoryButton('query', 'Question History', onOpenHistory)}
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Your Research Question"
            placeholder="e.g., How many papers were published each year?"
            value={question}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={onGenerateAndRun}
              disabled={loading}
              startIcon={
                loading && !sparqlQuery ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading && !sparqlQuery
                ? 'Generating...'
                : 'Generate and Run Query'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* SPARQL Query Section */}
      {sparqlQuery && (
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h5">SPARQL Query</Typography>
            {renderHistoryButton('sparql', 'SPARQL History', onOpenHistory)}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={6}
            variant="outlined"
            value={sparqlQuery}
            onChange={(e) => onSparqlChange(e.target.value)}
            disabled={loading}
            sx={{
              mt: 2,
              mb: 2,
              fontFamily: 'monospace',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                '& textarea': {
                  fontFamily: 'monospace',
                },
              },
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={onRunEditedQuery}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading ? 'Running...' : 'Run Edited Query'}
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default SPARQLQuerySection;

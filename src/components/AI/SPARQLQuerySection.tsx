import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  SmartToy,
  Save,
  Cancel,
  History,
  Refresh,
} from '@mui/icons-material';
import { useHistoryManager } from './HistoryManager';
import { useAIService } from '../../services/aiService';
import { useDynamicQuestion } from '../../context/DynamicQuestionContext';

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
  const aiService = useAIService();
  const { state, getHistoryByType } = useDynamicQuestion();

  const [isEditing, setIsEditing] = useState(false);
  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editContent, setEditContent] = useState(sparqlQuery);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditContent(sparqlQuery);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSparqlChange(editContent);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(sparqlQuery);
    setError(null);
  };

  const handleAIModify = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for the AI.');
      return;
    }

    if (!aiService.isConfigured()) {
      setError('Please configure your AI settings first.');
      return;
    }

    setIsAIModifying(true);
    setError(null);

    try {
      const history = getHistoryByType('sparql');
      const recentHistory = history.slice(-5);

      const contextPrompt = `You are modifying a SPARQL query for a dynamic research question analysis. 

Current Research Question: "${state.question}"

Current Data: ${JSON.stringify(state.queryResults, null, 2)}

Current SPARQL Query:
${sparqlQuery}

Recent History:
${recentHistory
  .map(
    (entry) =>
      `${entry.action} (${new Date(entry.timestamp).toLocaleString()}): ${entry.prompt || 'Manual edit'}`
  )
  .join('\n')}

User Request: ${aiPrompt}

Please modify the SPARQL query according to the user's request. Consider the context and history provided.

Requirements:
- Return only the SPARQL query, no explanations
- Ensure the query is valid SPARQL syntax
- Maintain the same data structure and prefixes

Modified SPARQL Query:`;

      const result = await aiService.generateText(contextPrompt, {
        temperature: 0.3,
        maxTokens: 2000,
      });

      const modifiedQuery = result.text.trim();
      onSparqlChange(modifiedQuery);

      setShowAIDialog(false);
      setAiPrompt('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to modify query with AI'
      );
    } finally {
      setIsAIModifying(false);
    }
  };

  const getHistoryCount = () => {
    return getHistoryByType('sparql').length;
  };

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
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-expect-error */}
          {renderHistoryButton('query', 'Question History', onOpenHistory)}
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Your Research Question"
            placeholder="e.g., How many papers were published each year?"
            value={question}
            onKeyDown={(e) => {
              if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                onGenerateAndRun();
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5" sx={{ color: '#e86161', fontWeight: 600 }}>
              SPARQL Query
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {getHistoryCount() > 0 && (
                <Chip
                  icon={<History />}
                  label={`${getHistoryCount()} changes`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              <Tooltip title="Edit manually">
                <IconButton
                  onClick={handleEdit}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                  }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ask AI to modify">
                <IconButton
                  onClick={() => setShowAIDialog(true)}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                  }}
                >
                  <SmartToy />
                </IconButton>
              </Tooltip>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-expect-error */}
              {renderHistoryButton('sparql', 'SPARQL History', onOpenHistory)}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            minRows={6}
            variant="outlined"
            value={isEditing ? editContent : sparqlQuery}
            onChange={(e) =>
              isEditing
                ? setEditContent(e.target.value)
                : onSparqlChange(e.target.value)
            }
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

          {isEditing && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                startIcon={<Save />}
                sx={{
                  backgroundColor: '#e86161',
                  '&:hover': { backgroundColor: '#d45151' },
                }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
            </Box>
          )}
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

      {/* AI Modification Dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy sx={{ color: '#e86161' }} />
            <Typography variant="h6">AI Query Modification</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe how you want the AI to modify the SPARQL query. The AI will
            have access to the full context of your research question and
            previous changes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe how you want to modify the SPARQL query..."
            variant="outlined"
            disabled={isAIModifying}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAIDialog(false)}
            disabled={isAIModifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAIModify}
            variant="contained"
            disabled={isAIModifying || !aiPrompt.trim()}
            startIcon={
              isAIModifying ? <CircularProgress size={16} /> : <Refresh />
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            {isAIModifying ? 'Modifying...' : 'Modify with AI'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SPARQLQuerySection;

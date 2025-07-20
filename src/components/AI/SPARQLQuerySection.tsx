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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Edit,
  SmartToy,
  Save,
  Cancel,
  History,
  Refresh,
  Restore,
  Close,
} from '@mui/icons-material';
import { useHistoryManager } from './HistoryManager';
import { useAIService } from '../../services/aiService';
import {
  useDynamicQuestion,
  DynamicQuestionHistory,
} from '../../context/DynamicQuestionContext';

interface SPARQLQuerySectionProps {
  question: string;
  sparqlQuery: string;
  loading: boolean;
  queryResults?: Record<string, unknown>[];
  queryError?: string | null;
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
  queryResults = [],
  queryError,
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
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

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

  const handleOpenHistory = () => {
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
  };

  const handleRevertHistory = (item: DynamicQuestionHistory) => {
    onSparqlChange(item.content);
    handleCloseHistory();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const getSparqlHistory = () => {
    const allHistory = getHistoryByType('sparql');
    const currentContent = sparqlQuery;

    // Filter history items that are different from current content and not duplicates
    const seenContents = new Set();
    return allHistory
      .filter((item) => {
        // Skip if content is empty, whitespace-only, same as current, or if we've seen this content before
        const trimmedContent = item.content.trim();
        if (
          !trimmedContent ||
          trimmedContent === currentContent.trim() ||
          seenContents.has(trimmedContent)
        ) {
          return false;
        }
        seenContents.add(trimmedContent);
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
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
              {isEditing ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                  {getSparqlHistory().length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleOpenHistory}
                      startIcon={<History />}
                      sx={{
                        borderColor: '#e86161',
                        color: '#e86161',
                        '&:hover': {
                          borderColor: '#d45151',
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      History ({getSparqlHistory().length})
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  <Tooltip title="Edit manually">
                    <IconButton
                      onClick={handleEdit}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
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
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      <SmartToy />
                    </IconButton>
                  </Tooltip>
                  {getSparqlHistory().length > 0 && (
                    <Tooltip
                      title={`View ${getSparqlHistory().length} previous versions`}
                    >
                      <IconButton
                        onClick={handleOpenHistory}
                        size="small"
                        sx={{
                          color: '#e86161',
                          '&:hover': {
                            backgroundColor: 'rgba(232, 97, 97, 0.08)',
                          },
                        }}
                      >
                        <History />
                      </IconButton>
                    </Tooltip>
                  )}
                  {/* Remove the problematic renderHistoryButton that causes rendering issues */}
                </>
              )}
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

          {/* Query Results Status */}
          {!loading && sparqlQuery && !queryError && (
            <Box sx={{ mb: 2 }}>
              {queryResults.length > 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ✅ Query executed successfully! Found{' '}
                    <strong>{queryResults.length}</strong> result
                    {queryResults.length !== 1 ? 's' : ''}.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ⚠️ Query executed successfully but returned no results. Try
                    modifying your query or research question.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Query Error */}
          {!loading && queryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                ❌ Query failed: {queryError}
              </Typography>
            </Alert>
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
              {loading ? 'Running...' : 'Run'}
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

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History sx={{ color: '#e86161' }} />
              <Typography variant="h6">SPARQL Query History</Typography>
            </Box>
            <IconButton onClick={handleCloseHistory} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {getSparqlHistory().length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No SPARQL query history available yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Changes will appear here once you make edits or AI
                modifications.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {getSparqlHistory().map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      p: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(232, 97, 97, 0.04)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            color="text.primary"
                          >
                            {item.action === 'ai_modified'
                              ? 'AI Modified SPARQL'
                              : 'Manual Edit SPARQL'}
                          </Typography>
                          <Chip
                            label={
                              item.action === 'ai_modified'
                                ? 'LLM Context'
                                : 'Manual'
                            }
                            size="small"
                            color={
                              item.action === 'ai_modified'
                                ? 'primary'
                                : 'default'
                            }
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(item.timestamp)}
                        </Typography>
                        {item.prompt && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            <strong>LLM Prompt:</strong> {item.prompt}
                          </Typography>
                        )}
                        {item.previousContent && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            <strong>Previous Content:</strong>{' '}
                            {item.previousContent.substring(0, 100)}...
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Restore />}
                          onClick={() => handleRevertHistory(item)}
                          sx={{
                            backgroundColor: '#e86161',
                            '&:hover': { backgroundColor: '#d45151' },
                          }}
                        >
                          Restore
                        </Button>
                      </Box>
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 1,
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        maxHeight: '120px',
                        overflowY: 'auto',
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{ margin: 0, whiteSpace: 'pre-wrap' }}
                      >
                        {item.content.length > 200
                          ? `${item.content.substring(0, 200)}...`
                          : item.content}
                      </Typography>
                    </Paper>
                  </ListItem>
                  {index < getSparqlHistory().length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SPARQLQuerySection;

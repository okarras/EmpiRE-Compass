import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  SmartToy,
  Save,
  Cancel,
  History,
  Restore,
  Close,
  Refresh,
  Edit,
} from '@mui/icons-material';
import { useAIService } from '../services/aiService';
import {
  useDynamicQuestion,
  DynamicQuestionHistory,
} from '../context/DynamicQuestionContext';
import type { Query } from '../constants/queries_chart_info';

interface QuestionInformationViewProps {
  query: Query;
  isInteractive?: boolean;
}

const QuestionInformationView: React.FC<QuestionInformationViewProps> = ({
  query,
  isInteractive = false,
}) => {
  const aiService = useAIService();
  const {
    state,
    getHistoryByType,
    updateQuestionInterpretation,
    updateDataCollectionInterpretation,
    updateDataAnalysisInterpretation,
  } = useDynamicQuestion();

  const [editingSection, setEditingSection] = useState<
    'question' | 'dataCollection' | 'dataAnalysis' | null
  >(null);
  const [editContent, setEditContent] = useState('');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiTargetSection, setAiTargetSection] = useState<
    'question' | 'dataCollection' | 'dataAnalysis' | null
  >(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAIModifying, setIsAIModifying] = useState(false);

  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historySection, setHistorySection] = useState<
    'question' | 'dataCollection' | 'dataAnalysis' | null
  >(null);

  const info = query.dataAnalysisInformation;

  const handleSave = () => {
    if (editingSection) {
      const updateFunction = getUpdateFunction(editingSection);
      updateFunction(editContent);
      setEditingSection(null);
      setEditContent('');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditContent('');
    setError(null);
  };

  const handleOpenHistory = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    setHistorySection(section);
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
    setHistorySection(null);
  };

  const handleRestoreHistory = (item: DynamicQuestionHistory) => {
    if (historySection) {
      const updateFunction = getUpdateFunction(historySection);
      updateFunction(item.content);
      handleCloseHistory();
    }
  };

  const handleEdit = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    setEditingSection(section);
    setEditContent(getSectionContent(section ?? '') ?? '');
    setError(null);
  };

  const getSectionContent = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    if (isInteractive) {
      switch (section) {
        case 'question':
          return state.questionInterpretation || info.questionExplanation;
        case 'dataCollection':
          return (
            state.dataCollectionInterpretation || info.requiredDataForAnalysis
          );
        case 'dataAnalysis':
          return state.dataAnalysisInterpretation || info.dataAnalysis;
        default:
          return '';
      }
    } else {
      switch (section) {
        case 'question':
          return info.questionExplanation;
        case 'dataCollection':
          return info.requiredDataForAnalysis;
        case 'dataAnalysis':
          return info.dataAnalysis;
        default:
          return '';
      }
    }
  };

  const getUpdateFunction = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    switch (section) {
      case 'question':
        return updateQuestionInterpretation;
      case 'dataCollection':
        return updateDataCollectionInterpretation;
      case 'dataAnalysis':
        return updateDataAnalysisInterpretation;
      default:
        return updateQuestionInterpretation;
    }
  };

  const getSectionHistory = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    const allHistory = getHistoryByType('analysis');
    const currentContent = getSectionContent(section);

    // Filter history items that are different from current content and not duplicates
    const seenContents = new Set();
    return allHistory
      .filter((item) => {
        // Skip if content is empty, whitespace-only, same as current, or if we've seen this content before
        const trimmedContent = item.content.trim();
        if (
          !trimmedContent ||
          trimmedContent === currentContent?.trim() ||
          seenContents.has(trimmedContent)
        ) {
          return false;
        }
        seenContents.add(trimmedContent);
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
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

  const handleAIModify = async () => {
    if (!aiPrompt.trim() || !aiTargetSection) {
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
      const currentContent = getSectionContent(aiTargetSection);
      const sectionName =
        aiTargetSection === 'question'
          ? 'question interpretation'
          : aiTargetSection === 'dataCollection'
            ? 'data collection interpretation'
            : 'data analysis interpretation';

      const contextPrompt = `You are modifying a ${sectionName} for a dynamic research question analysis.

Current Research Question: "${state.question}"

Current ${sectionName}:
${currentContent}

User Request: ${aiPrompt}

Please modify the ${sectionName} according to the user's request. Return only the modified content, no explanations.

Modified ${sectionName}:`;

      const result = await aiService.generateText(contextPrompt, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      const modifiedContent = result.text.trim();
      const updateFunction = getUpdateFunction(aiTargetSection);
      updateFunction(modifiedContent, aiPrompt);

      setShowAIDialog(false);
      setAiPrompt('');
      setAiTargetSection(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to modify content with AI'
      );
    } finally {
      setIsAIModifying(false);
    }
  };

  const renderSection = (
    title: string,
    content: string,
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    const isEditing = editingSection === section;
    const sectionHistory = getSectionHistory(section);
    const hasHistory = sectionHistory.length > 0;

    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: '#e86161' }}
          >
            {title}
          </Typography>
          {isInteractive && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Edit manually or view history">
                <IconButton
                  onClick={() => handleEdit(section)}
                  size="small"
                  sx={{
                    color: '#e86161',
                    '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                  }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ask AI to modify">
                <IconButton
                  onClick={() => {
                    setAiTargetSection(section);
                    setShowAIDialog(true);
                  }}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                  }}
                >
                  <SmartToy />
                </IconButton>
              </Tooltip>
              {/* {isEditing && editingSection === section && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={isAIModifying}
                    sx={{
                      backgroundColor: '#e86161',
                      '&:hover': { backgroundColor: '#d45151' },
                    }}
                  >
                    {isAIModifying ? <CircularProgress size={16} /> : 'Save'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isAIModifying}
                  >
                    Cancel
                  </Button>
                </>
              )} */}
            </Box>
          )}
        </Box>

        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
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
              {hasHistory && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenHistory(section)}
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
                  History ({sectionHistory.length})
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          <Box
            component="div"
            sx={{
              mb: 2,
              '& p': {
                fontSize: { xs: '0.95rem', sm: '1rem' },
                lineHeight: 1.7,
                color: 'text.primary',
                mt: 0,
                mb: 2,
              },
              '& a': {
                color: '#e86161',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& strong': {
                color: 'text.primary',
                fontWeight: 600,
              },
            }}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderSection(
        'Explanation of the Competency Question',
        getSectionContent('question') ?? '',
        'question'
      )}
      <Divider sx={{ my: 2 }} />
      {renderSection(
        'Required Data for Analysis',
        getSectionContent('dataCollection') ?? '',
        'dataCollection'
      )}
      <Divider sx={{ my: 2 }} />
      {renderSection(
        'Data Analysis',
        getSectionContent('dataAnalysis') ?? '',
        'dataAnalysis'
      )}

      {/* AI Modification Dialog */}
      {isInteractive && (
        <Dialog
          open={showAIDialog}
          onClose={() => setShowAIDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy sx={{ color: '#e86161' }} />
              <Typography variant="h6">AI Content Modification</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Describe how you want the AI to modify the{' '}
              {aiTargetSection === 'question'
                ? 'question interpretation'
                : aiTargetSection === 'dataCollection'
                  ? 'data collection interpretation'
                  : 'data analysis interpretation'}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe your modifications..."
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
      )}

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
              {/* Removed Psychology icon as per edit hint */}
              <Typography variant="h6">
                {historySection === 'question'
                  ? 'Question Interpretation'
                  : historySection === 'dataCollection'
                    ? 'Data Collection Interpretation'
                    : 'Data Analysis Interpretation'}{' '}
                History
              </Typography>
            </Box>
            <IconButton onClick={handleCloseHistory} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {historySection && getSectionHistory(historySection).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No history available for this section yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Changes will appear here once you make edits or AI
                modifications.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {historySection &&
                getSectionHistory(historySection).map((item, index) => (
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
                                ? 'AI Modified'
                                : 'Manual Edit'}
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
                            onClick={() => handleRestoreHistory(item)}
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
                    {index < getSectionHistory(historySection).length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionInformationView;

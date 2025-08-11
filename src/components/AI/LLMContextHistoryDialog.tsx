import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Paper,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { History, Close, CheckCircle, Cancel } from '@mui/icons-material';
import { HistoryItem } from './HistoryManager';
import { useDynamicQuestion } from '../../context/DynamicQuestionContext';

interface LLMContextHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

// Extended history item with additional properties
interface ExtendedHistoryItem extends HistoryItem {
  source: string;
  action: 'manual_edit' | 'ai_modified';
  prompt: string;
  previousContent: string;
  usedInPrompts: boolean;
  isExcluded: boolean;
  isLatest?: boolean; // Added for the latest SPARQL result
}

const LLMContextHistoryDialog: React.FC<LLMContextHistoryDialogProps> = ({
  open,
  onClose,
}) => {
  const { getHistoryByType } = useDynamicQuestion();
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());

  // Helper function to convert action type
  const convertAction = (action: string): 'manual_edit' | 'ai_modified' => {
    return action === 'ai_modified' ? 'ai_modified' : 'manual_edit';
  };

  // Helper function to check if content is meaningful (not empty or whitespace)
  const isMeaningfulContent = (content: string): boolean => {
    return Boolean(content && content.trim().length > 0);
  };

  // Get history items that are actually used in AI prompts and have meaningful content
  const getPromptHistory = (): ExtendedHistoryItem[] => {
    const allHistory: ExtendedHistoryItem[] = [
      ...getHistoryByType('question')
        .filter((item) => isMeaningfulContent(item.content))
        .map((item) => ({
          id: item.id,
          timestamp: item.timestamp,
          content: item.content,
          type: 'query' as const,
          title: `Question: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`,
          source: 'Research Question',
          action: convertAction(item.action),
          prompt: item.prompt || '',
          previousContent: item.previousContent || '',
          usedInPrompts: true, // Questions are used in all prompts
          isExcluded: excludedItems.has(item.id),
        })),
      ...getHistoryByType('sparql')
        .filter((item) => isMeaningfulContent(item.content))
        .map((item, index) => {
          // The latest SPARQL query result should always be included
          const isLatest = index === 0; // Assuming array is sorted by timestamp desc
          return {
            id: item.id,
            timestamp: item.timestamp,
            content: item.content,
            type: 'sparql' as const,
            title: `SPARQL Query: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`,
            source: 'SPARQL Query',
            action: convertAction(item.action),
            prompt: item.prompt || '',
            previousContent: item.previousContent || '',
            usedInPrompts: true, // SPARQL history is used in SPARQL modification prompts
            isExcluded: isLatest ? false : excludedItems.has(item.id), // Latest is never excluded
            isLatest: isLatest, // Flag to identify the latest SPARQL result
          };
        }),
      ...getHistoryByType('chart')
        .filter((item) => isMeaningfulContent(item.content))
        .map((item) => ({
          id: item.id,
          timestamp: item.timestamp,
          content: item.content,
          type: 'chart_html' as const,
          title: `Chart HTML: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`,
          source: 'Chart',
          action: convertAction(item.action),
          prompt: item.prompt || '',
          previousContent: item.previousContent || '',
          usedInPrompts: true, // Chart history is used in chart modification prompts
          isExcluded: excludedItems.has(item.id),
        })),
      ...getHistoryByType('analysis')
        .filter((item) => isMeaningfulContent(item.content))
        .map((item) => ({
          id: item.id,
          timestamp: item.timestamp,
          content: item.content,
          type: 'question_interpretation' as const,
          title: `Analysis: ${item.content.substring(0, 50)}${item.content.length > 50 ? '...' : ''}`,
          source: 'Question Analysis',
          action: convertAction(item.action),
          prompt: item.prompt || '',
          previousContent: item.previousContent || '',
          usedInPrompts: true, // Analysis history is used in analysis modification prompts
          isExcluded: excludedItems.has(item.id),
        })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    return allHistory;
  };

  const promptHistory = getPromptHistory();

  const handleToggleExclusion = (itemId: string) => {
    // Find the item to check if it's the latest SPARQL result
    const item = promptHistory.find((h) => h.id === itemId);
    if (item?.isLatest) {
      // Don't allow excluding the latest SPARQL result
      return;
    }

    const newExcluded = new Set(excludedItems);
    if (newExcluded.has(itemId)) {
      newExcluded.delete(itemId);
    } else {
      newExcluded.add(itemId);
    }
    setExcludedItems(newExcluded);
  };

  const handleIncludeAll = () => {
    setExcludedItems(new Set());
  };

  const handleExcludeAll = () => {
    setExcludedItems(new Set(promptHistory.map((item) => item.id)));
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const includedCount = promptHistory.length - excludedItems.size;
  const excludedCount = excludedItems.size;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            <Typography variant="h6">LLM Context History</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              Control which history items are used as context in AI prompts.
              Excluded items will not be included in future AI interactions. The
              latest SPARQL query result is always included and cannot be
              excluded.
            </Typography>
          </Box>
        </Alert>

        {promptHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No LLM context history available yet.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Context will appear here once you interact with the AI and
              generate meaningful content.
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {promptHistory.length} context items available
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {includedCount} included • {excludedCount} excluded
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleIncludeAll}
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircle />}
                >
                  Include All
                </Button>
                <Button
                  size="small"
                  onClick={handleExcludeAll}
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                >
                  Exclude All
                </Button>
              </Box>
            </Box>

            <List sx={{ p: 0 }}>
              {promptHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      p: 2,
                      opacity: item.isExcluded ? 0.6 : 1,
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
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flex: 1,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!item.isExcluded}
                              onChange={() => handleToggleExclusion(item.id)}
                              size="small"
                              color="primary"
                              disabled={item.isLatest} // Disable switch for latest SPARQL result
                            />
                          }
                          label=""
                          sx={{ mr: 0 }}
                        />
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
                              label={item.source}
                              size="small"
                              color={item.isExcluded ? 'default' : 'primary'}
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTimestamp(item.timestamp)}
                            </Typography>
                            {item.isLatest && (
                              <Chip
                                label="Latest Result"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                            {item.isExcluded && !item.isLatest && (
                              <Chip
                                label="Excluded"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          {item.prompt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontStyle: 'italic' }}
                            >
                              Prompt: {item.prompt}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 1,
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        fontFamily: ['sparql', 'chart_html'].includes(item.type)
                          ? 'monospace'
                          : 'inherit',
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
                  {index < promptHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LLMContextHistoryDialog;

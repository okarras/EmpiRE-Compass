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
  Checkbox,
  Divider,
  Paper,
} from '@mui/material';
import { History, Delete, Close, Restore } from '@mui/icons-material';
import { useHistoryManager, HistoryItem } from './HistoryManager';

interface LLMContextHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyHistoryItem: (item: HistoryItem) => void;
}

// Extended history item with additional properties
interface ExtendedHistoryItem extends HistoryItem {
  source: string;
  action: 'manual_edit' | 'ai_modified';
  prompt: string;
  previousContent: string;
}

const LLMContextHistoryDialog: React.FC<LLMContextHistoryDialogProps> = ({
  open,
  onClose,
  onApplyHistoryItem,
}) => {
  const { getHistoryByType, removeFromHistory, history } = useHistoryManager();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  console.log(history);
  // Get all history items from different types
  const allHistory: ExtendedHistoryItem[] = [
    ...getHistoryByType('query').map((item) => ({
      ...item,
      source: 'Research Question',
      action: 'manual_edit' as const,
      prompt: '',
      previousContent: '',
    })),
    ...getHistoryByType('sparql').map((item) => ({
      ...item,
      source: 'SPARQL Query',
      action: 'manual_edit' as const,
      prompt: '',
      previousContent: '',
    })),
    ...getHistoryByType('chart_html').map((item) => ({
      ...item,
      source: 'Chart',
      action: 'manual_edit' as const,
      prompt: '',
      previousContent: '',
    })),
    ...getHistoryByType('question_interpretation').map((item) => ({
      ...item,
      source: 'Question Analysis',
      action: 'manual_edit' as const,
      prompt: '',
      previousContent: '',
    })),
    ...getHistoryByType('data_collection_interpretation').map((item) => ({
      ...item,
      source: 'Data Collection',
      action: 'manual_edit' as const,
      prompt: '',
      previousContent: '',
    })),
    ...getHistoryByType('data_analysis_interpretation').map((item) => ({
      ...item,
      source: 'Data Analysis',
      action: 'manual_edit' as const,
      prompt: '',
      previousContent: '',
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleToggleSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === allHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allHistory.map((item) => item.id)));
    }
  };

  const handleDeleteSelected = () => {
    selectedItems.forEach((itemId) => {
      const item = allHistory.find((h) => h.id === itemId);
      if (item) {
        removeFromHistory(item.type, itemId);
      }
    });
    setSelectedItems(new Set());
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
        {allHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No LLM context history available yet.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Context will appear here once you interact with the AI.
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
              <Typography variant="subtitle2" color="text.secondary">
                {allHistory.length} context items
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleSelectAll}
                  variant="outlined"
                >
                  {selectedItems.size === allHistory.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                {selectedItems.size > 0 && (
                  <Button
                    size="small"
                    onClick={handleDeleteSelected}
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                  >
                    Delete Selected ({selectedItems.size})
                  </Button>
                )}
              </Box>
            </Box>

            <List sx={{ p: 0 }}>
              {allHistory.map((item, index) => (
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
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flex: 1,
                        }}
                      >
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleToggleSelection(item.id)}
                          size="small"
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
                              color="primary"
                              variant="outlined"
                            />
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
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Restore />}
                          onClick={() => onApplyHistoryItem(item)}
                          sx={{
                            backgroundColor: '#e86161',
                            '&:hover': { backgroundColor: '#d45151' },
                          }}
                        >
                          Restore
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => removeFromHistory(item.type, item.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
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
                  {index < allHistory.length - 1 && <Divider />}
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

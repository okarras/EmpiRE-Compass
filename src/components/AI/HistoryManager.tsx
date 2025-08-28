import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export interface HistoryItem {
  id: string;
  timestamp: number;
  content: string;
  type:
    | 'query'
    | 'chart_description'
    | 'data_interpretation'
    | 'sparql'
    | 'chart_html'
    | 'question_interpretation'
    | 'data_collection_interpretation'
    | 'data_analysis_interpretation';
  title: string;
}

interface HistoryManagerProps {
  onApplyHistoryItem: (item: HistoryItem) => void;
  open: boolean;
  type: HistoryItem['type'] | null;
  onClose: () => void;
}

const HistoryManager: React.FC<HistoryManagerProps> = ({
  onApplyHistoryItem,
  open,
  type,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('dynamicAI_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dynamicAI_history', JSON.stringify(history));
  }, [history]);

  // const addToHistory = (
  //   type: HistoryItem['type'],
  //   content: string,
  //   title: string
  // ) => {
  //   const newItem: HistoryItem = {
  //     id: Date.now().toString(),
  //     timestamp: Date.now(),
  //     content,
  //     type,
  //     title,
  //   };
  //   setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // Keep last 50 items
  // };

  const applyHistoryItem = (item: HistoryItem) => {
    onApplyHistoryItem(item);
    onClose();
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const openEditDialog = (item: HistoryItem) => {
    setEditingItem(item);
    setEditContent(item.content);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditContent('');
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const updatedItem = { ...editingItem, content: editContent };
    setHistory((prev) =>
      prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
    );
    // Apply the edit to current state if it's the same type
    applyHistoryItem(updatedItem);
    closeEditDialog();
  };

  const getFilteredHistory = () => {
    return type ? history.filter((item) => item.type === type) : history;
  };

  return (
    <>
      {/* History Dialog */}
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">
              {type
                ? `${type.replace('_', ' ').toUpperCase()} History`
                : 'History'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {getFilteredHistory().length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: 'center', py: 4 }}
            >
              No history items found.
            </Typography>
          ) : (
            <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {getFilteredHistory().map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 1,
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
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={item.type.replace('_', ' ')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(item)}
                        sx={{ color: '#e86161' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteHistoryItem(item.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      maxHeight: '100px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: ['sparql', 'chart_html'].includes(item.type)
                        ? 'monospace'
                        : 'inherit',
                    }}
                  >
                    {item.content}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => applyHistoryItem(item)}
                    sx={{ backgroundColor: '#e86161' }}
                  >
                    Use This
                  </Button>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={closeEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            <Typography variant="h6">
              Edit {editingItem?.type.replace('_', ' ')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            label="Content"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{
              mt: 2,
              fontFamily:
                editingItem &&
                ['sparql', 'chart_html'].includes(editingItem.type)
                  ? 'monospace'
                  : 'inherit',
              '& .MuiOutlinedInput-root': {
                '& textarea': {
                  fontFamily:
                    editingItem &&
                    ['sparql', 'chart_html'].includes(editingItem.type)
                      ? 'monospace'
                      : 'inherit',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button
            onClick={saveEdit}
            variant="contained"
            sx={{ backgroundColor: '#e86161' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export { HistoryManager };
export type { HistoryManagerProps };

// Hook to use the history manager
export const useHistoryManager = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('dynamicAI_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  const addToHistory = (
    type: HistoryItem['type'],
    content: string,
    title: string
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content,
      type,
      title,
    };
    setHistory((prev) => {
      const newHistory = [newItem, ...prev.slice(0, 49)];
      localStorage.setItem('dynamicAI_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const getHistoryByType = (type: HistoryItem['type']) => {
    return history.filter((item) => item.type === type);
  };

  const removeFromHistory = (type: HistoryItem['type'], id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter(
        (item) => !(item.type === type && item.id === id)
      );
      localStorage.setItem('dynamicAI_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const renderHistoryButton = (
    type: HistoryItem['type'],
    title: string,
    onOpen: (type: HistoryItem['type']) => void
  ) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onOpen(type)}
        sx={{ color: '#e86161' }}
      >
        <HistoryIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return {
    history,
    addToHistory,
    getHistoryByType,
    removeFromHistory,
    renderHistoryButton,
  };
};

// New Section History Dialog Component
interface SectionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  sectionType: HistoryItem['type'];
  sectionTitle: string;
  onRevert: (item: HistoryItem) => void;
  history: HistoryItem[];
}

export const SectionHistoryDialog: React.FC<SectionHistoryDialogProps> = ({
  open,
  onClose,
  sectionType,
  sectionTitle,
  onRevert,
  history,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  const filteredHistory = history.filter((item) => item.type === sectionType);

  const openEditDialog = (item: HistoryItem) => {
    setEditingItem(item);
    setEditContent(item.content);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingItem(null);
    setEditContent('');
  };

  const saveEdit = () => {
    if (!editingItem) return;

    const updatedItem = { ...editingItem, content: editContent };
    // Update the history in localStorage
    const savedHistory = localStorage.getItem('dynamicAI_history');
    if (savedHistory) {
      try {
        const allHistory = JSON.parse(savedHistory);
        const updatedHistory = allHistory.map((item: HistoryItem) =>
          item.id === editingItem.id ? updatedItem : item
        );
        localStorage.setItem(
          'dynamicAI_history',
          JSON.stringify(updatedHistory)
        );
        // Apply the edit to current state
        onRevert(updatedItem);
      } catch (error) {
        console.error('Error updating history:', error);
      }
    }
    closeEditDialog();
  };

  const deleteHistoryItem = (id: string) => {
    const savedHistory = localStorage.getItem('dynamicAI_history');
    if (savedHistory) {
      try {
        const allHistory = JSON.parse(savedHistory);
        const updatedHistory = allHistory.filter(
          (item: HistoryItem) => item.id !== id
        );
        localStorage.setItem(
          'dynamicAI_history',
          JSON.stringify(updatedHistory)
        );
        // Force a re-render by triggering a page reload or state update
        window.location.reload();
      } catch (error) {
        console.error('Error deleting history item:', error);
      }
    }
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

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <>
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
              <HistoryIcon sx={{ color: '#e86161' }} />
              <Typography variant="h6">{sectionTitle} History</Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {filteredHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
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
              {filteredHistory.map((item, index) => (
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
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(item.timestamp)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<RestoreIcon />}
                          onClick={() => onRevert(item)}
                          sx={{
                            backgroundColor: '#e86161',
                            '&:hover': { backgroundColor: '#d45151' },
                          }}
                        >
                          Restore
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(item)}
                          sx={{ color: '#e86161' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteHistoryItem(item.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
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
                        {truncateContent(item.content, 200)}
                      </Typography>
                    </Paper>
                  </ListItem>
                  {index < filteredHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={closeEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            <Typography variant="h6">
              Edit {editingItem?.type.replace('_', ' ')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            label="Content"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{
              mt: 2,
              fontFamily:
                editingItem &&
                ['sparql', 'chart_html'].includes(editingItem.type)
                  ? 'monospace'
                  : 'inherit',
              '& .MuiOutlinedInput-root': {
                '& textarea': {
                  fontFamily:
                    editingItem &&
                    ['sparql', 'chart_html'].includes(editingItem.type)
                      ? 'monospace'
                      : 'inherit',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button
            onClick={saveEdit}
            variant="contained"
            sx={{ backgroundColor: '#e86161' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

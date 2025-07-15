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
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // Keep last 50 items
  };

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
    renderHistoryButton,
  };
};

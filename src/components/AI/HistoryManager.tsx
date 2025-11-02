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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  FormControlLabel,
  Switch,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  DeleteSweep as DeleteSweepIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { CodeEditor } from '../CodeEditor';

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
  section?: string; // Added for section categorization
}

export interface HistoryPreferences {
  maxHistoryItems: number;
  enableAutoSave: boolean;
  categorizeBySection: boolean;
  defaultSortOrder: 'newest' | 'oldest' | 'alphabetical';
  enableSearch: boolean;
  compactView: boolean;
}

export type HistorySection =
  | 'Query & Analysis'
  | 'Data Visualization'
  | 'SPARQL & Database'
  | 'Content Interpretation'
  | 'Other';

interface HistoryManagerProps {
  onApplyHistoryItem: (item: HistoryItem) => void;
  open: boolean;
  type: HistoryItem['type'] | null;
  onClose: () => void;
}

// Utility functions for section categorization
const getSectionFromType = (type: HistoryItem['type']): HistorySection => {
  switch (type) {
    case 'query':
      return 'Query & Analysis';
    case 'chart_description':
    case 'chart_html':
      return 'Data Visualization';
    case 'sparql':
      return 'SPARQL & Database';
    case 'data_interpretation':
    case 'question_interpretation':
    case 'data_collection_interpretation':
    case 'data_analysis_interpretation':
      return 'Content Interpretation';
    default:
      return 'Other';
  }
};

const getDefaultHistoryPreferences = (): HistoryPreferences => ({
  maxHistoryItems: 100,
  enableAutoSave: true,
  categorizeBySection: true,
  defaultSortOrder: 'newest',
  enableSearch: true,
  compactView: false,
});

const HISTORY_PREFERENCES_KEY = 'dynamicAI_history_preferences';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [preferences, setPreferences] = useState<HistoryPreferences>(
    getDefaultHistoryPreferences()
  );
  const [settingsMenuAnchor, setSettingsMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Load history and preferences from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('dynamicAI_history');
    const savedPreferences = localStorage.getItem(HISTORY_PREFERENCES_KEY);

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Add section to existing items if not present
        const historyWithSections = parsedHistory.map((item: HistoryItem) => ({
          ...item,
          section: item.section || getSectionFromType(item.type),
        }));
        setHistory(historyWithSections);
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }

    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading preferences:', error);
        setPreferences(getDefaultHistoryPreferences());
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (preferences.enableAutoSave) {
      localStorage.setItem('dynamicAI_history', JSON.stringify(history));
    }
  }, [history, preferences.enableAutoSave]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(HISTORY_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

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

  // Search and filter functions
  const filterHistoryBySearch = (items: HistoryItem[]): HistoryItem[] => {
    if (!searchTerm.trim()) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.type.toLowerCase().includes(searchLower) ||
        (item.section && item.section.toLowerCase().includes(searchLower))
    );
  };

  const sortHistory = (items: HistoryItem[]): HistoryItem[] => {
    switch (preferences.defaultSortOrder) {
      case 'oldest':
        return [...items].sort((a, b) => a.timestamp - b.timestamp);
      case 'alphabetical':
        return [...items].sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
      default:
        return [...items].sort((a, b) => b.timestamp - a.timestamp);
    }
  };

  const groupHistoryBySection = (
    items: HistoryItem[]
  ): Record<HistorySection, HistoryItem[]> => {
    const groups: Record<HistorySection, HistoryItem[]> = {
      'Query & Analysis': [],
      'Data Visualization': [],
      'SPARQL & Database': [],
      'Content Interpretation': [],
      Other: [],
    };

    items.forEach((item) => {
      const section = item.section || getSectionFromType(item.type);
      groups[section as HistorySection].push(item);
    });

    return groups;
  };

  // Delete functions
  const deleteAllHistory = () => {
    setHistory([]);
    setDeleteMenuAnchor(null);
  };

  const deleteHistoryBySection = (section: HistorySection) => {
    setHistory((prev) =>
      prev.filter(
        (item) => (item.section || getSectionFromType(item.type)) !== section
      )
    );
    setDeleteMenuAnchor(null);
  };

  const deleteHistoryByType = (historyType: HistoryItem['type']) => {
    setHistory((prev) => prev.filter((item) => item.type !== historyType));
    setDeleteMenuAnchor(null);
  };

  // Preference update functions
  const updatePreferences = (newPreferences: Partial<HistoryPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
  };

  // Render individual history item
  const renderHistoryItem = (item: HistoryItem) => (
    <Paper
      key={item.id}
      elevation={0}
      sx={{
        p: preferences.compactView ? 1.5 : 2,
        mb: preferences.compactView ? 1 : 2,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'rgba(232, 97, 97, 0.02)',
          borderColor: 'rgba(232, 97, 97, 0.2)',
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
        <Box sx={{ flex: 1, mr: 2 }}>
          <Typography
            variant={preferences.compactView ? 'body2' : 'subtitle2'}
            fontWeight="bold"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: preferences.compactView ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {new Date(item.timestamp).toLocaleString()}
            </Typography>
            {item.section && (
              <Chip
                label={item.section}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip
            label={item.type.replace('_', ' ')}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
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
      {!preferences.compactView && (
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            maxHeight: '80px',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            p: 1,
            borderRadius: 1,
            fontFamily: ['sparql', 'chart_html'].includes(item.type)
              ? 'monospace'
              : 'inherit',
            fontSize: '0.8rem',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.content}
        </Typography>
      )}
      <Button
        size="small"
        variant="contained"
        onClick={() => applyHistoryItem(item)}
        sx={{
          backgroundColor: '#e86161',
          '&:hover': { backgroundColor: '#d45151' },
          fontSize: '0.75rem',
        }}
      >
        Use This
      </Button>
    </Paper>
  );

  const getFilteredHistory = () => {
    let filteredItems = type
      ? history.filter((item) => item.type === type)
      : history;

    if (preferences.enableSearch) {
      filteredItems = filterHistoryBySearch(filteredItems);
    }

    return sortHistory(filteredItems);
  };

  const getProcessedHistory = () => {
    const filtered = getFilteredHistory();
    return preferences.categorizeBySection
      ? groupHistoryBySection(filtered)
      : { 'All Items': filtered };
  };

  const processedHistory = getProcessedHistory();
  const totalItems = getFilteredHistory().length;

  return (
    <>
      {/* Enhanced History Dialog */}
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
              <Typography variant="h6">
                {type
                  ? `${type.replace('_', ' ').toUpperCase()} History`
                  : 'History Manager'}
              </Typography>
              <Badge badgeContent={totalItems} color="primary" />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                size="small"
                sx={{ color: '#e86161' }}
              >
                <SettingsIcon />
              </IconButton>
              <IconButton
                onClick={(e) => setDeleteMenuAnchor(e.currentTarget)}
                size="small"
                sx={{ color: 'error.main' }}
              >
                <DeleteSweepIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Search Bar */}
          {preferences.enableSearch && (
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search history by title, content, type, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#e86161' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {totalItems === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm
                  ? 'No matching history items found'
                  : 'No history items found'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? 'Try adjusting your search terms or clear the search to see all items.'
                  : 'History will appear here as you use the AI features.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {Object.entries(processedHistory).map(([sectionName, items]) => {
                if (items.length === 0) return null;

                return preferences.categorizeBySection ? (
                  <Accordion key={sectionName} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="h6" color="primary">
                          {sectionName}
                        </Typography>
                        <Badge badgeContent={items.length} color="secondary" />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {items.map((item) => renderHistoryItem(item))}
                    </AccordionDetails>
                  </Accordion>
                ) : (
                  <Box key={sectionName}>
                    {items.map((item) => renderHistoryItem(item))}
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: 'auto' }}
          >
            {totalItems} item{totalItems !== 1 ? 's' : ''} total
          </Typography>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 280 },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" fontWeight="bold">
            History Preferences
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.categorizeBySection}
                onChange={(e) =>
                  updatePreferences({ categorizeBySection: e.target.checked })
                }
                color="primary"
              />
            }
            label="Group by Section"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.enableSearch}
                onChange={(e) =>
                  updatePreferences({ enableSearch: e.target.checked })
                }
                color="primary"
              />
            }
            label="Enable Search"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.compactView}
                onChange={(e) =>
                  updatePreferences({ compactView: e.target.checked })
                }
                color="primary"
              />
            }
            label="Compact View"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.enableAutoSave}
                onChange={(e) =>
                  updatePreferences({ enableAutoSave: e.target.checked })
                }
                color="primary"
              />
            }
            label="Auto Save"
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setSettingsMenuAnchor(null)}>
          <Typography variant="body2" color="text.secondary">
            Sort Order:{' '}
            {preferences.defaultSortOrder.charAt(0).toUpperCase() +
              preferences.defaultSortOrder.slice(1)}
          </Typography>
        </MenuItem>
      </Menu>

      {/* Delete Menu */}
      <Menu
        anchorEl={deleteMenuAnchor}
        open={Boolean(deleteMenuAnchor)}
        onClose={() => setDeleteMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 250 },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" fontWeight="bold" color="error">
            Delete Options
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={deleteAllHistory}>
          <DeleteSweepIcon sx={{ mr: 1, color: 'error.main' }} />
          <Typography color="error">Delete All History</Typography>
        </MenuItem>
        <Divider />
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Delete by Section:
          </Typography>
        </MenuItem>
        {Object.keys(groupHistoryBySection(history)).map((section) => {
          const sectionItems =
            groupHistoryBySection(history)[section as HistorySection];
          if (sectionItems.length === 0) return null;

          return (
            <MenuItem
              key={section}
              onClick={() => deleteHistoryBySection(section as HistorySection)}
              sx={{ pl: 3 }}
            >
              <Typography variant="body2" color="error">
                {section} ({sectionItems.length})
              </Typography>
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Delete by Type:
          </Typography>
        </MenuItem>
        {Array.from(new Set(history.map((item) => item.type))).map(
          (historyType) => {
            const typeItems = history.filter(
              (item) => item.type === historyType
            );
            return (
              <MenuItem
                key={historyType}
                onClick={() => deleteHistoryByType(historyType)}
                sx={{ pl: 3 }}
              >
                <Typography variant="body2" color="error">
                  {historyType.replace('_', ' ')} ({typeItems.length})
                </Typography>
              </MenuItem>
            );
          }
        )}
      </Menu>

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
          <Box sx={{ mt: 2 }}>
            {editingItem &&
            ['sparql', 'chart_html'].includes(editingItem.type) ? (
              <CodeEditor
                value={editContent}
                onChange={(value) => setEditContent(value)}
                language={editingItem.type === 'sparql' ? 'sparql' : 'html'}
                height="400px"
                label="Content"
                copyable={true}
                formattable={true}
                fullscreenable={true}
                showMinimap={false}
              />
            ) : (
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                label="Content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            )}
          </Box>
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
    title: string,
    section?: string
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content,
      type,
      title,
      section: section || getSectionFromType(type),
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

  const getHistoryBySection = (section: HistorySection) => {
    return history.filter(
      (item) => (item.section || getSectionFromType(item.type)) === section
    );
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

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.setItem('dynamicAI_history', JSON.stringify([]));
  };

  const clearHistoryBySection = (section: HistorySection) => {
    setHistory((prev) => {
      const newHistory = prev.filter(
        (item) => (item.section || getSectionFromType(item.type)) !== section
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
    getHistoryBySection,
    removeFromHistory,
    clearAllHistory,
    clearHistoryBySection,
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
          <Box sx={{ mt: 2 }}>
            {editingItem &&
            ['sparql', 'chart_html'].includes(editingItem.type) ? (
              <CodeEditor
                value={editContent}
                onChange={(value) => setEditContent(value)}
                language={editingItem.type === 'sparql' ? 'sparql' : 'html'}
                height="400px"
                label="Content"
                copyable={true}
                formattable={true}
                fullscreenable={true}
                showMinimap={false}
              />
            ) : (
              <TextField
                fullWidth
                multiline
                rows={10}
                variant="outlined"
                label="Content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            )}
          </Box>
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

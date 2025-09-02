import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  History,
  Close,
  CheckCircle,
  Cancel,
  Search as SearchIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  DeleteSweep as DeleteSweepIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
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
  contextSection?: LLMContextSection; // Added for section categorization
}

export interface LLMContextPreferences {
  enableSearch: boolean;
  categorizeBySection: boolean;
  compactView: boolean;
  defaultSortOrder: 'newest' | 'oldest' | 'relevance';
  autoIncludeLatest: boolean;
  maxContextItems: number;
}

export type LLMContextSection =
  | 'Research Questions'
  | 'SPARQL Queries'
  | 'Chart Visualizations'
  | 'Analysis Results'
  | 'Other Context';

// Utility functions
const getSectionFromSource = (source: string): LLMContextSection => {
  switch (source.toLowerCase()) {
    case 'research question':
      return 'Research Questions';
    case 'sparql query':
      return 'SPARQL Queries';
    case 'chart':
      return 'Chart Visualizations';
    case 'question analysis':
      return 'Analysis Results';
    default:
      return 'Other Context';
  }
};

const getDefaultLLMContextPreferences = (): LLMContextPreferences => ({
  enableSearch: true,
  categorizeBySection: true,
  compactView: false,
  defaultSortOrder: 'newest',
  autoIncludeLatest: true,
  maxContextItems: 50,
});

const LLM_CONTEXT_PREFERENCES_KEY = 'llm_context_history_preferences';

const LLMContextHistoryDialog: React.FC<LLMContextHistoryDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    getHistoryByType,
    removeFromHistory,
    removeMultipleFromHistory,
    clearHistory,
  } = useDynamicQuestion();
  const [excludedItems, setExcludedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [preferences, setPreferences] = useState<LLMContextPreferences>(
    getDefaultLLMContextPreferences()
  );
  const [settingsMenuAnchor, setSettingsMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem(LLM_CONTEXT_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading LLM context preferences:', error);
        setPreferences(getDefaultLLMContextPreferences());
      }
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      LLM_CONTEXT_PREFERENCES_KEY,
      JSON.stringify(preferences)
    );
  }, [preferences]);

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
          contextSection: getSectionFromSource('Research Question'),
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
            contextSection: getSectionFromSource('SPARQL Query'),
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
          contextSection: getSectionFromSource('Chart'),
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
          contextSection: getSectionFromSource('Question Analysis'),
        })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    return allHistory;
  };

  // Search and filter functions
  const filterHistoryBySearch = (
    items: ExtendedHistoryItem[]
  ): ExtendedHistoryItem[] => {
    if (!searchTerm.trim()) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.source.toLowerCase().includes(searchLower) ||
        item.action.toLowerCase().includes(searchLower) ||
        (item.contextSection &&
          item.contextSection.toLowerCase().includes(searchLower))
    );
  };

  const sortHistory = (items: ExtendedHistoryItem[]): ExtendedHistoryItem[] => {
    switch (preferences.defaultSortOrder) {
      case 'oldest':
        return [...items].sort((a, b) => a.timestamp - b.timestamp);
      case 'relevance':
        // Sort by latest first, then by exclusion status, then by timestamp
        return [...items].sort((a, b) => {
          if (a.isLatest !== b.isLatest) return a.isLatest ? -1 : 1;
          if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
          return b.timestamp - a.timestamp;
        });
      case 'newest':
      default:
        return [...items].sort((a, b) => b.timestamp - a.timestamp);
    }
  };

  const groupHistoryBySection = (
    items: ExtendedHistoryItem[]
  ): Record<LLMContextSection, ExtendedHistoryItem[]> => {
    const groups: Record<LLMContextSection, ExtendedHistoryItem[]> = {
      'Research Questions': [],
      'SPARQL Queries': [],
      'Chart Visualizations': [],
      'Analysis Results': [],
      'Other Context': [],
    };

    items.forEach((item) => {
      const section = item.contextSection || getSectionFromSource(item.source);
      groups[section as LLMContextSection].push(item);
    });

    return groups;
  };

  // Delete functions (actual deletion from history)
  const deleteAllContext = () => {
    clearHistory();
    setDeleteMenuAnchor(null);
  };

  const deleteContextBySection = (section: LLMContextSection) => {
    const sectionItems = promptHistory.filter(
      (item) =>
        (item.contextSection || getSectionFromSource(item.source)) === section
    );
    const idsToDelete = sectionItems.map((item) => item.id);
    removeMultipleFromHistory(idsToDelete);
    setDeleteMenuAnchor(null);
  };

  const deleteContextItem = (id: string) => {
    removeFromHistory(id);
  };

  // Exclude functions (for context management)
  const excludeAllContext = () => {
    setExcludedItems(new Set(promptHistory.map((item) => item.id)));
    setDeleteMenuAnchor(null);
  };

  const excludeContextBySection = (section: LLMContextSection) => {
    const sectionItems = promptHistory.filter(
      (item) =>
        (item.contextSection || getSectionFromSource(item.source)) === section
    );
    const newExcluded = new Set(excludedItems);
    sectionItems.forEach((item) => {
      if (!item.isLatest) {
        // Don't exclude latest items
        newExcluded.add(item.id);
      }
    });
    setExcludedItems(newExcluded);
    setDeleteMenuAnchor(null);
  };

  // Preference update functions
  const updatePreferences = (
    newPreferences: Partial<LLMContextPreferences>
  ) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
  };

  const getFilteredHistory = () => {
    let filteredItems = getPromptHistory();

    if (preferences.enableSearch) {
      filteredItems = filterHistoryBySearch(filteredItems);
    }

    return sortHistory(filteredItems);
  };

  const getProcessedHistory = () => {
    const filtered = getFilteredHistory();
    return preferences.categorizeBySection
      ? groupHistoryBySection(filtered)
      : { 'All Context Items': filtered };
  };

  const promptHistory = getPromptHistory();
  const processedHistory = getProcessedHistory();
  const totalItems = getFilteredHistory().length;

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

  // Render individual context item
  const renderContextItem = (
    item: ExtendedHistoryItem,
    index: number,
    totalInSection: number
  ) => (
    <React.Fragment key={item.id}>
      <ListItem
        sx={{
          flexDirection: 'column',
          alignItems: 'stretch',
          p: preferences.compactView ? 1.5 : 2,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              <IconButton
                size="small"
                onClick={() => deleteContextItem(item.id)}
                sx={{ color: 'error.main' }}
                title="Delete permanently"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                  flexWrap: 'wrap',
                }}
              >
                <Typography
                  variant={preferences.compactView ? 'body2' : 'subtitle2'}
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
                {item.contextSection && (
                  <Chip
                    label={item.contextSection}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem' }}
                  />
                )}
                <Typography variant="caption" color="text.secondary">
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
              {item.prompt && !preferences.compactView && (
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
        {!preferences.compactView && (
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
        )}
      </ListItem>
      {index < totalInSection - 1 && <Divider />}
    </React.Fragment>
  );

  // Calculate counts correctly
  const filteredItems = getFilteredHistory();
  const includedCount = filteredItems.filter((item) => !item.isExcluded).length;
  const excludedCount = filteredItems.filter((item) => item.isExcluded).length;

  return (
    <>
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
              <History sx={{ color: '#e86161' }} />
              <Typography variant="h6">LLM Context History Manager</Typography>
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
                title="Delete or Exclude Options"
              >
                <DeleteSweepIcon />
              </IconButton>
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                Control which history items are used as context in AI prompts.
                Excluded items will not be included in future AI interactions.
                The latest SPARQL query result is always included and cannot be
                excluded.
              </Typography>
            </Box>
          </Alert>

          {/* Search Bar */}
          {preferences.enableSearch && (
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search context by title, content, source, action, or section..."
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
              <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm
                  ? 'No matching context items found'
                  : 'No LLM context history available yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? 'Try adjusting your search terms or clear the search to see all items.'
                  : 'Context will appear here once you interact with the AI and generate meaningful content.'}
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
                    {totalItems} context items{' '}
                    {searchTerm ? 'found' : 'available'}
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

              <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {Object.entries(processedHistory).map(
                  ([sectionName, items]) => {
                    if (items.length === 0) return null;

                    return preferences.categorizeBySection ? (
                      <Accordion
                        sx={{
                          alignItems: 'center',
                        }}
                        key={sectionName}
                        defaultExpanded
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography variant="h6" color="primary">
                              {sectionName}
                            </Typography>
                            <Badge
                              sx={{ marginLeft: '10px' }}
                              badgeContent={items.length}
                              color="secondary"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List sx={{ p: 0 }}>
                            {items.map((item, index) =>
                              renderContextItem(item, index, items.length)
                            )}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      <List key={sectionName} sx={{ p: 0 }}>
                        {items.map((item, index) =>
                          renderContextItem(item, index, items.length)
                        )}
                      </List>
                    );
                  }
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: 'auto' }}
          >
            {totalItems} context item{totalItems !== 1 ? 's' : ''} •{' '}
            {includedCount} included • {excludedCount} excluded
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
          sx: { minWidth: 300 },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" fontWeight="bold">
            LLM Context Preferences
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
                checked={preferences.autoIncludeLatest}
                onChange={(e) =>
                  updatePreferences({ autoIncludeLatest: e.target.checked })
                }
                color="primary"
              />
            }
            label="Auto Include Latest"
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

      {/* Delete/Exclude Menu */}
      <Menu
        anchorEl={deleteMenuAnchor}
        open={Boolean(deleteMenuAnchor)}
        onClose={() => setDeleteMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 320 },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" fontWeight="bold" color="error">
            Delete Options (Permanent)
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={deleteAllContext}>
          <DeleteSweepIcon sx={{ mr: 1, color: 'error.main' }} />
          <Typography color="error">Delete All Context</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Delete by Section:
          </Typography>
        </MenuItem>
        {Object.keys(groupHistoryBySection(promptHistory)).map((section) => {
          const sectionItems =
            groupHistoryBySection(promptHistory)[section as LLMContextSection];
          if (sectionItems.length === 0) return null;

          return (
            <MenuItem
              key={`delete-${section}`}
              onClick={() =>
                deleteContextBySection(section as LLMContextSection)
              }
              sx={{ pl: 3 }}
            >
              <DeleteIcon sx={{ mr: 1, fontSize: 16, color: 'error.main' }} />
              <Typography variant="body2" color="error">
                {section} ({sectionItems.length})
              </Typography>
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 1 }} />

        <MenuItem disabled>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="warning.main"
          >
            Exclude Options (Reversible)
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={excludeAllContext}>
          <Cancel sx={{ mr: 1, color: 'warning.main' }} />
          <Typography color="warning.main">Exclude All Context</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Exclude by Section:
          </Typography>
        </MenuItem>
        {Object.keys(groupHistoryBySection(promptHistory)).map((section) => {
          const sectionItems =
            groupHistoryBySection(promptHistory)[section as LLMContextSection];
          if (sectionItems.length === 0) return null;

          return (
            <MenuItem
              key={`exclude-${section}`}
              onClick={() =>
                excludeContextBySection(section as LLMContextSection)
              }
              sx={{ pl: 3 }}
            >
              <Cancel sx={{ mr: 1, fontSize: 16, color: 'warning.main' }} />
              <Typography variant="body2" color="warning.main">
                {section} ({sectionItems.length})
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LLMContextHistoryDialog;

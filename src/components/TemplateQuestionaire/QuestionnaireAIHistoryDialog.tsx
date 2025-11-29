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
  ThumbUp,
  ThumbDown,
  VerifiedUser,
  AutoAwesome,
} from '@mui/icons-material';
import {
  useQuestionnaireAI,
  QuestionnaireAIHistory,
} from '../../context/QuestionnaireAIContext';

interface QuestionnaireAIHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  currentQuestionId?: string;
}

interface ExtendedHistoryItem extends QuestionnaireAIHistory {
  isExcluded: boolean;
  contextSection?: AIContextSection;
}

export interface AIContextPreferences {
  enableSearch: boolean;
  categorizeBySection: boolean;
  compactView: boolean;
  defaultSortOrder: 'newest' | 'oldest' | 'relevance';
}

export type AIContextSection =
  | 'Suggestions'
  | 'Verifications'
  | 'Applied Answers'
  | 'Other Context';

const getSectionFromType = (type: string): AIContextSection => {
  switch (type) {
    case 'suggestion':
      return 'Suggestions';
    case 'verification':
      return 'Verifications';
    case 'answer':
      return 'Applied Answers';
    default:
      return 'Other Context';
  }
};

const getDefaultAIContextPreferences = (): AIContextPreferences => ({
  enableSearch: true,
  categorizeBySection: true,
  compactView: false,
  defaultSortOrder: 'newest',
});

const AI_CONTEXT_PREFERENCES_KEY = 'questionnaire_ai_context_preferences';

const QuestionnaireAIHistoryDialog: React.FC<
  QuestionnaireAIHistoryDialogProps
> = ({ open, onClose, currentQuestionId }) => {
  const {
    state,
    removeFromHistory,
    removeMultipleFromHistory,
    clearHistory,
    clearHistoryForQuestion,
  } = useQuestionnaireAI();

  const [excludedItems, setExcludedItems] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('questionnaire_ai_excluded_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error('Failed to load excluded items:', error);
    }
    return new Set();
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [preferences, setPreferences] = useState<AIContextPreferences>(
    getDefaultAIContextPreferences()
  );
  const [settingsMenuAnchor, setSettingsMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        'questionnaire_ai_excluded_items',
        JSON.stringify(Array.from(excludedItems))
      );
    } catch (error) {
      console.error('Failed to save excluded items:', error);
    }
  }, [excludedItems]);

  useEffect(() => {
    const savedPreferences = localStorage.getItem(AI_CONTEXT_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading AI context preferences:', error);
        setPreferences(getDefaultAIContextPreferences());
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      AI_CONTEXT_PREFERENCES_KEY,
      JSON.stringify(preferences)
    );
  }, [preferences]);

  useEffect(() => {
    const stored = localStorage.getItem('questionnaire_ai_excluded_items');

    if (!stored && !isInitialized && state.history.length > 0) {
      const allHistory = state.history.filter(
        (item) => item.content && item.content.trim().length > 0
      );

      const itemsToExclude = allHistory
        .filter((item) => item.questionId !== currentQuestionId)
        .map((item) => item.id);

      setExcludedItems(new Set(itemsToExclude));
      setIsInitialized(true);
    } else if (stored && !isInitialized) {
      setIsInitialized(true);
    }
  }, [state.history, isInitialized, currentQuestionId]);

  const isMeaningfulContent = (content: string): boolean => {
    return Boolean(content && content.trim().length > 0);
  };

  const getPromptHistory = (): ExtendedHistoryItem[] => {
    let history = state.history.filter((item) =>
      isMeaningfulContent(item.content)
    );

    if (currentQuestionId) {
      history = history.filter((item) => item.questionId === currentQuestionId);
    }

    return history.map((item) => {
      return {
        ...item,
        isExcluded: excludedItems.has(item.id),
        contextSection: getSectionFromType(item.type),
      };
    });
  };

  const filterHistoryBySearch = (
    items: ExtendedHistoryItem[]
  ): ExtendedHistoryItem[] => {
    if (!searchTerm.trim()) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.questionText.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.type.toLowerCase().includes(searchLower) ||
        item.action.toLowerCase().includes(searchLower) ||
        (item.prompt && item.prompt.toLowerCase().includes(searchLower)) ||
        (item.contextSection &&
          item.contextSection.toLowerCase().includes(searchLower))
    );
  };

  const sortHistory = (items: ExtendedHistoryItem[]): ExtendedHistoryItem[] => {
    switch (preferences.defaultSortOrder) {
      case 'oldest':
        return [...items].sort((a, b) => a.timestamp - b.timestamp);
      case 'relevance':
        return [...items].sort((a, b) => {
          // Sort by exclusion status first (included items first)
          if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
          // Then by timestamp (newest first)
          return b.timestamp - a.timestamp;
        });
      case 'newest':
      default:
        return [...items].sort((a, b) => b.timestamp - a.timestamp);
    }
  };

  const groupHistoryBySection = (
    items: ExtendedHistoryItem[]
  ): Record<AIContextSection, ExtendedHistoryItem[]> => {
    const groups: Record<AIContextSection, ExtendedHistoryItem[]> = {
      Suggestions: [],
      Verifications: [],
      'Applied Answers': [],
      'Other Context': [],
    };

    items.forEach((item) => {
      const section = item.contextSection || getSectionFromType(item.type);
      groups[section].push(item);
    });

    return groups;
  };

  const deleteAllContext = () => {
    clearHistory();
    setDeleteMenuAnchor(null);
  };

  const deleteContextForCurrentQuestion = () => {
    if (currentQuestionId) {
      clearHistoryForQuestion(currentQuestionId);
    }
    setDeleteMenuAnchor(null);
  };

  const deleteContextBySection = (section: AIContextSection) => {
    const sectionItems = promptHistory.filter(
      (item) =>
        (item.contextSection || getSectionFromType(item.type)) === section
    );
    const idsToDelete = sectionItems.map((item) => item.id);
    removeMultipleFromHistory(idsToDelete);
    setDeleteMenuAnchor(null);
  };

  const deleteContextItem = (id: string) => {
    removeFromHistory(id);
  };

  const excludeAllContext = () => {
    setExcludedItems(new Set(promptHistory.map((item) => item.id)));
    setDeleteMenuAnchor(null);
  };

  const excludeContextBySection = (section: AIContextSection) => {
    const sectionItems = promptHistory.filter(
      (item) =>
        (item.contextSection || getSectionFromType(item.type)) === section
    );
    const newExcluded = new Set(excludedItems);
    sectionItems.forEach((item) => {
      newExcluded.add(item.id);
    });
    setExcludedItems(newExcluded);
    setDeleteMenuAnchor(null);
  };

  const updatePreferences = (newPreferences: Partial<AIContextPreferences>) => {
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

  const getActionIcon = (type: string) => {
    if (type === 'suggestion') return <AutoAwesome fontSize="small" />;
    if (type === 'verification') return <VerifiedUser fontSize="small" />;
    if (type === 'answer') return <CheckCircle fontSize="small" />;
    return <History fontSize="small" />;
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!item.isExcluded}
                    onChange={() => handleToggleExclusion(item.id)}
                    size="small"
                    color="primary"
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
                {getActionIcon(item.type)}
                <Typography
                  variant={preferences.compactView ? 'body2' : 'subtitle2'}
                  fontWeight="bold"
                  color="text.primary"
                >
                  {item.action === 'generated'
                    ? 'AI Generated'
                    : item.action === 'applied'
                      ? 'Applied'
                      : item.action === 'verified'
                        ? 'Verified'
                        : 'Edited'}
                </Typography>
                <Chip
                  label={item.type}
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
                {item.isExcluded && (
                  <Chip
                    label="Excluded"
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                {item.metadata?.feedback?.rating && (
                  <Chip
                    icon={
                      item.metadata.feedback.rating === 'positive' ? (
                        <ThumbUp fontSize="small" />
                      ) : (
                        <ThumbDown fontSize="small" />
                      )
                    }
                    label={item.metadata.feedback.rating}
                    size="small"
                    color={
                      item.metadata.feedback.rating === 'positive'
                        ? 'success'
                        : 'error'
                    }
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Question: {item.questionText.substring(0, 60)}
                {item.questionText.length > 60 ? '...' : ''}
              </Typography>
              {item.metadata?.feedback?.comment && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    fontStyle: 'italic',
                    mt: 0.5,
                    pl: 1,
                    borderLeft: '2px solid',
                    borderColor:
                      item.metadata.feedback.rating === 'positive'
                        ? 'success.main'
                        : 'error.main',
                  }}
                >
                  💬 "{item.metadata.feedback.comment}"
                </Typography>
              )}
              {item.prompt && !preferences.compactView && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}
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
            {item.metadata?.confidence && (
              <Chip
                label={`${Math.round(item.metadata.confidence * 100)}% confidence`}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Paper>
        )}
      </ListItem>
      {index < totalInSection - 1 && <Divider />}
    </React.Fragment>
  );

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
              <Typography variant="h6">
                Questionnaire AI Context History
              </Typography>
              <Badge badgeContent={totalItems} color="primary" sx={{ ml: 1 }} />
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
            <Typography variant="body2">
              Control which history items are used as context when generating AI
              suggestions. All items from the <strong>current question</strong>{' '}
              are included by default. Context from other questions is kept
              separate. Toggle items on/off to customize.
            </Typography>
          </Alert>

          {preferences.enableSearch && (
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by question, content, type, or section..."
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
                  : 'No AI context history available yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'Context will appear here once you use the AI assistant.'}
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
                      <Accordion key={sectionName} defaultExpanded>
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
        PaperProps={{ sx: { minWidth: 300 } }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" fontWeight="bold">
            AI Context Preferences
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
      </Menu>

      {/* Delete/Exclude Menu */}
      <Menu
        anchorEl={deleteMenuAnchor}
        open={Boolean(deleteMenuAnchor)}
        onClose={() => setDeleteMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 320 } }}
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
        {currentQuestionId && (
          <MenuItem onClick={deleteContextForCurrentQuestion}>
            <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography color="error">
              Delete Current Question Context
            </Typography>
          </MenuItem>
        )}
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Delete by Section:
          </Typography>
        </MenuItem>
        {Object.keys(groupHistoryBySection(promptHistory)).map((section) => {
          const sectionItems =
            groupHistoryBySection(promptHistory)[section as AIContextSection];
          if (sectionItems.length === 0) return null;

          return (
            <MenuItem
              key={`delete-${section}`}
              onClick={() =>
                deleteContextBySection(section as AIContextSection)
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
            groupHistoryBySection(promptHistory)[section as AIContextSection];
          if (sectionItems.length === 0) return null;

          return (
            <MenuItem
              key={`exclude-${section}`}
              onClick={() =>
                excludeContextBySection(section as AIContextSection)
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

export default QuestionnaireAIHistoryDialog;

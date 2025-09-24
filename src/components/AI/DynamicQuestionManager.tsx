import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Alert,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Save,
  Upload,
  Download,
  Delete,
  History,
  Refresh,
  FolderOpen,
} from '@mui/icons-material';
import { useDynamicQuestion } from '../../context/DynamicQuestionContext';
import type { DynamicQuestionState } from '../../context/DynamicQuestionContext';

interface SavedDynamicQuestion {
  id: string;
  name: string;
  timestamp: number;
  state: DynamicQuestionState;
}

const DynamicQuestionManager: React.FC = () => {
  const { state, loadSavedState } = useDynamicQuestion();
  const [savedQuestions, setSavedQuestions] = useState<SavedDynamicQuestion[]>(
    []
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [questionName, setQuestionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load saved questions from localStorage on component mount
  useEffect(() => {
    loadSavedQuestions();
  }, []);

  const loadSavedQuestions = () => {
    try {
      const saved = localStorage.getItem('saved-dynamic-questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedQuestions(parsed);
      }
    } catch (err) {
      console.error('Failed to load saved questions:', err);
    }
  };

  const saveQuestionsToStorage = (questions: SavedDynamicQuestion[]) => {
    try {
      localStorage.setItem(
        'saved-dynamic-questions',
        JSON.stringify(questions)
      );
    } catch (err) {
      console.error('Failed to save questions to localStorage:', err);
    }
  };

  const handleSaveCurrent = () => {
    if (!state.question.trim()) {
      setError('No question to save. Please enter a research question first.');
      return;
    }

    if (!questionName.trim()) {
      setError('Please enter a name for this saved question.');
      return;
    }

    const newSavedQuestion: SavedDynamicQuestion = {
      id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: questionName.trim(),
      timestamp: Date.now(),
      state: { ...state },
    };

    const updatedQuestions = [...savedQuestions, newSavedQuestion];
    setSavedQuestions(updatedQuestions);
    saveQuestionsToStorage(updatedQuestions);

    setQuestionName('');
    setShowSaveDialog(false);
    setSuccess('Question saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLoadQuestion = (savedQuestion: SavedDynamicQuestion) => {
    try {
      // Load the saved state directly into the context
      loadSavedState(savedQuestion.state);

      setShowLoadDialog(false);
      setSuccess('Question loaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to load the saved question.');
    }
  };

  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = savedQuestions.filter((q) => q.id !== id);
    setSavedQuestions(updatedQuestions);
    saveQuestionsToStorage(updatedQuestions);
    setSuccess('Question deleted successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleExportAll = () => {
    try {
      // Ensure the current in-memory question (including processingFunctionCode)
      // is also exported even if the user hasn't explicitly saved it.
      const hasCurrent = Boolean(state.question.trim());
      const currentAsSaved = hasCurrent
        ? [
            {
              id: `current_${Date.now()}`,
              name:
                (state.question?.trim()?.slice(0, 80) ||
                  'Current Dynamic Question') + ' (Current)',
              timestamp: Date.now(),
              state: { ...state },
            },
          ]
        : [];

      const toExport = [...currentAsSaved, ...savedQuestions];
      const dataStr = JSON.stringify(toExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dynamic-questions-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccess('All questions exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to export questions.');
    }
  };

  const handleImportQuestions = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedQuestions = JSON.parse(content) as SavedDynamicQuestion[];

        // Validate the imported data
        if (!Array.isArray(importedQuestions)) {
          throw new Error('Invalid file format');
        }

        // Merge with existing questions, avoiding duplicates
        const existingIds = new Set(savedQuestions.map((q) => q.id));
        const newQuestions = importedQuestions.filter(
          (q) => !existingIds.has(q.id)
        );

        const updatedQuestions = [...savedQuestions, ...newQuestions];
        setSavedQuestions(updatedQuestions);
        saveQuestionsToStorage(updatedQuestions);

        setSuccess(`Imported ${newQuestions.length} questions successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } catch {
        setError('Failed to import questions. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const canSave = state.question.trim() && state.queryResults.length > 0;

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 2,
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
          <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 600 }}>
            Dynamic Question Manager
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<History />}
              label={`${savedQuestions.length} saved`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => setShowSaveDialog(true)}
            disabled={!canSave}
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            Save Current
          </Button>

          <Button
            variant="outlined"
            startIcon={<FolderOpen />}
            onClick={() => setShowLoadDialog(true)}
            disabled={savedQuestions.length === 0}
          >
            Load Saved
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportAll}
            disabled={savedQuestions.length === 0}
          >
            Export All
          </Button>

          <Tooltip title="Import questions from JSON file">
            <Button variant="outlined" component="label" startIcon={<Upload />}>
              Import
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImportQuestions}
              />
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      {/* Save Dialog */}
      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Save sx={{ color: '#e86161' }} />
            <Typography variant="h6">Save Current Question</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Save your current dynamic question with all its data, charts, and
            analysis for later use.
          </Typography>
          <TextField
            fullWidth
            label="Question Name"
            value={questionName}
            onChange={(e) => setQuestionName(e.target.value)}
            placeholder="Enter a name for this saved question..."
            variant="outlined"
            sx={{ mt: 1 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveCurrent}
            variant="contained"
            disabled={!questionName.trim()}
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Dialog */}
      <Dialog
        open={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOpen sx={{ color: '#e86161' }} />
            <Typography variant="h6">Load Saved Question</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a saved question to load. This will replace your current
            question and data.
          </Typography>
          {savedQuestions.length === 0 ? (
            <Alert severity="info">
              No saved questions found. Save a question first to see it here.
            </Alert>
          ) : (
            <List>
              {savedQuestions.map((savedQuestion, index) => (
                <React.Fragment key={savedQuestion.id}>
                  <ListItem>
                    <ListItemText
                      primary={savedQuestion.name}
                      secondary={`${savedQuestion.state.question} • ${new Date(savedQuestion.timestamp).toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Load this question">
                          <IconButton
                            onClick={() => handleLoadQuestion(savedQuestion)}
                            sx={{
                              color: '#e86161',
                              '&:hover': {
                                backgroundColor: 'rgba(232, 97, 97, 0.08)',
                              },
                            }}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete this saved question">
                          <IconButton
                            onClick={() =>
                              handleDeleteQuestion(savedQuestion.id)
                            }
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                              },
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < savedQuestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DynamicQuestionManager;

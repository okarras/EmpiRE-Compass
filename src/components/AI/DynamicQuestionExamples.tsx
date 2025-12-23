import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Lightbulb,
  Delete,
  Edit,
} from '@mui/icons-material';
import CRUDDynamicQuestions, {
  DynamicQuestion,
} from '../../firestore/CRUDDynamicQuestions';

interface DynamicQuestionExamplesProps {
  onSelectExample: (example: DynamicQuestion) => void;
  refreshTrigger?: number; // Trigger refresh when this changes
  templateId?: string; // Filter by template ID
  isAdmin?: boolean; // Show admin controls
  onDeleteExample?: (id: string) => Promise<void>; // Callback for delete
  onEditExample?: (example: DynamicQuestion) => void; // Callback for edit
}

const DynamicQuestionExamples = ({
  onSelectExample,
  refreshTrigger = 0,
  templateId,
  isAdmin = false,
  onDeleteExample,
  onEditExample,
}: DynamicQuestionExamplesProps) => {
  const [examples, setExamples] = useState<DynamicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] =
    useState<DynamicQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadExamples = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use template-filtered query if templateId is provided
      const questions = templateId
        ? await CRUDDynamicQuestions.getDynamicQuestionsByTemplate(
            templateId,
            20
          )
        : await CRUDDynamicQuestions.getDynamicQuestions(20);
      setExamples(questions);
    } catch (err) {
      console.error('Error loading dynamic question examples:', err);
      setError('Failed to load example questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, templateId]);

  const handleSelectExample = (example: DynamicQuestion) => {
    onSelectExample(example);
  };

  const handleDeleteClick = (e: React.MouseEvent, example: DynamicQuestion) => {
    e.stopPropagation();
    setQuestionToDelete(example);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    setDeleting(true);
    try {
      if (onDeleteExample) {
        await onDeleteExample(questionToDelete.id);
      } else {
        await CRUDDynamicQuestions.deleteDynamicQuestion(questionToDelete.id);
      }
      // Remove from local state
      setExamples((prev) => prev.filter((ex) => ex.id !== questionToDelete.id));
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      console.error('Error deleting example:', err);
      setError('Failed to delete example question');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, example: DynamicQuestion) => {
    e.stopPropagation();
    if (onEditExample) {
      onEditExample(example);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (examples.length === 0) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb sx={{ color: '#e86161', fontSize: '1.25rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Example Questions
            </Typography>
            <Chip
              label={examples.length}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                color: '#e86161',
              }}
            />
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <List dense sx={{ py: 0 }}>
              {examples.map((example) => (
                <ListItem
                  key={example.id}
                  disablePadding
                  secondaryAction={
                    isAdmin ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit example">
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditClick(e, example)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: '#1976d2' },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete example">
                          <IconButton
                            size="small"
                            onClick={(e) => handleDeleteClick(e, example)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: '#d32f2f' },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : undefined
                  }
                >
                  <ListItemButton
                    onClick={() => handleSelectExample(example)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      pr: isAdmin ? 10 : 2,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            mb: 0.5,
                            color: 'text.primary',
                          }}
                        >
                          {example.name || 'Untitled Question'}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {example.state?.question || 'No question text'}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Example Question</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the example "
            {questionToDelete?.name || 'Untitled Question'}"? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DynamicQuestionExamples;

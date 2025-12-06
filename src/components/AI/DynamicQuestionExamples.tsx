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
} from '@mui/material';
import { ExpandMore, ExpandLess, Lightbulb } from '@mui/icons-material';
import CRUDDynamicQuestions, {
  DynamicQuestion,
} from '../../firestore/CRUDDynamicQuestions';

interface DynamicQuestionExamplesProps {
  onSelectExample: (example: DynamicQuestion) => void;
  refreshTrigger?: number; // Trigger refresh when this changes
}

const DynamicQuestionExamples = ({
  onSelectExample,
  refreshTrigger = 0,
}: DynamicQuestionExamplesProps) => {
  const [examples, setExamples] = useState<DynamicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const loadExamples = async () => {
    try {
      setLoading(true);
      setError(null);
      const questions = await CRUDDynamicQuestions.getDynamicQuestions(20);
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
  }, [refreshTrigger]);

  const handleSelectExample = (example: DynamicQuestion) => {
    onSelectExample(example);
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
              <ListItem key={example.id} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectExample(example)}
                  sx={{
                    py: 1.5,
                    px: 2,
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
  );
};

export default DynamicQuestionExamples;

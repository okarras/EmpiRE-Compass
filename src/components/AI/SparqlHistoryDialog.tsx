import React from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import { History, Restore, Close } from '@mui/icons-material';
import { DynamicQuestionHistory } from '../../context/DynamicQuestionContext';

export const formatTimestamp = (timestamp: number) => {
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

export const getSparqlHistory = (
  allHistory: DynamicQuestionHistory[],
  currentContent: string
) => {
  const seenContents = new Set<string>();
  return allHistory
    .filter((item) => {
      const trimmedContent = item.content.trim();
      if (
        !trimmedContent ||
        trimmedContent === currentContent.trim() ||
        seenContents.has(trimmedContent)
      ) {
        return false;
      }
      seenContents.add(trimmedContent);
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
};

interface SparqlHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  historyItems: DynamicQuestionHistory[];
  onRevert: (item: DynamicQuestionHistory) => void;
}

const SparqlHistoryDialog: React.FC<SparqlHistoryDialogProps> = ({
  open,
  onClose,
  historyItems,
  onRevert,
}) => {
  const handleRevertHistory = (item: DynamicQuestionHistory) => {
    onRevert(item);
    onClose();
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
            <Typography variant="h6">SPARQL Query History</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {historyItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No SPARQL query history available yet.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Changes will appear here once you make edits or AI modifications.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {historyItems.map((item, index) => (
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
                            ? 'AI Modified SPARQL'
                            : 'Manual Edit SPARQL'}
                        </Typography>
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
                      {item.previousContent && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          <strong>Previous Content:</strong>{' '}
                          {item.previousContent.substring(0, 100)}...
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Restore />}
                        onClick={() => handleRevertHistory(item)}
                        sx={{
                          backgroundColor: '#e86161',
                          '&:hover': { backgroundColor: '#d45151' },
                        }}
                      >
                        Restore
                      </Button>
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
                {index < historyItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SparqlHistoryDialog;

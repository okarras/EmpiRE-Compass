import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Edit,
  SmartToy,
  Save,
  Cancel,
  History,
  Refresh,
  ExpandMore,
  Code,
} from '@mui/icons-material';
import {
  useDynamicQuestion,
  DynamicQuestionHistory,
} from '../../context/DynamicQuestionContext';
import { useAIService } from '../../services/backendAIService';

interface DataProcessingCodeSectionProps {
  processingCode: string | null;
  loading: boolean;
  onCodeChange: (code: string) => void | Promise<void>;
  onRegenerateCode: () => void;
  onOpenHistory?: (type: 'processing') => void;
}

const DataProcessingCodeSection: React.FC<DataProcessingCodeSectionProps> = ({
  processingCode,
  loading,
  onCodeChange,
  onRegenerateCode,
  // onOpenHistory = () => {},
}) => {
  const { getHistoryByType, updateProcessingFunctionCode } =
    useDynamicQuestion();
  const aiService = useAIService();

  const [isEditing, setIsEditing] = useState(false);
  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editContent, setEditContent] = useState(processingCode || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const handleEdit = () => {
    setEditContent(processingCode || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onCodeChange(editContent);
    updateProcessingFunctionCode(editContent);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(processingCode || '');
    setError(null);
  };

  const handleOpenHistory = () => {
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
  };

  const handleRevertHistory = async (item: DynamicQuestionHistory) => {
    await onCodeChange(item.content);
    updateProcessingFunctionCode(item.content);
    handleCloseHistory();
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

  const getProcessingHistory = () =>
    getHistoryByType('processing').sort((a, b) => b.timestamp - a.timestamp);

  const handleAIModify = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a modification request.');
      return;
    }

    if (!aiService.isConfigured()) {
      setError('Please configure your AI settings first.');
      return;
    }

    setIsAIModifying(true);
    setError(null);

    try {
      const currentCode = processingCode || '';
      const modificationPrompt = `You are a JavaScript expert. Please modify the following data processing function based on the user's request.

**Current Processing Function:**
\`\`\`javascript
${currentCode}
\`\`\`

**User's Modification Request:** ${aiPrompt}

**Requirements:**
1. Maintain the function signature: \`function processData(rows)\`
2. ALWAYS check if the input data is null, undefined, or not an array and handle gracefully
3. Return an array of objects suitable for visualization
4. Make the requested modifications while preserving the core functionality
5. Add comments explaining any changes made

**Output only the modified JavaScript code block:**

\`\`\`javascript
function processData(rows) {
  // ALWAYS check for null/undefined input first
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  
  // Your modified transformation logic here
  return transformedData;
}
\`\`\``;

      const result = await aiService.generateText(modificationPrompt, {
        temperature: 0.2,
        maxTokens: 1500,
      });

      // Extract JavaScript code from the response
      const jsMatch = result.text.match(
        /```(?:javascript|js)\n([\s\S]*?)\n```/i
      );
      if (jsMatch && jsMatch[1]) {
        const modifiedCode = jsMatch[1].trim();
        await onCodeChange(modifiedCode);
        updateProcessingFunctionCode(modifiedCode, modificationPrompt);
        setShowAIDialog(false);
        setAiPrompt('');
      } else {
        setError('The AI did not return a valid JavaScript code block.');
      }
    } catch (err) {
      console.error('Error modifying processing function:', err);
      setError('Failed to modify the processing function. Please try again.');
    } finally {
      setIsAIModifying(false);
    }
  };

  if (!processingCode) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.12)',
              },
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}
            >
              <Code sx={{ color: '#4CAF50' }} />
              <Typography variant="h6" sx={{ color: '#4CAF50' }}>
                Data Processing Function
              </Typography>
              <Chip
                label="JavaScript"
                size="small"
                sx={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontSize: '0.7rem',
                }}
              />
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Tooltip title="Edit Processing Function">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    size="small"
                    sx={{
                      color: '#e86161',
                      '&:hover': {
                        backgroundColor: 'rgba(232, 97, 97, 0.08)',
                      },
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="AI Modify Function">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAIDialog(true);
                    }}
                    size="small"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(232, 97, 97, 0.08)',
                      },
                    }}
                  >
                    <SmartToy fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate Function">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerateCode();
                    }}
                    size="small"
                    disabled={loading}
                    sx={{
                      color: '#FF9800',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 152, 0, 0.08)',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Refresh fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Processing Function History">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenHistory();
                    }}
                    size="small"
                    sx={{
                      color: '#9C27B0',
                      '&:hover': {
                        backgroundColor: 'rgba(156, 39, 176, 0.08)',
                      },
                    }}
                  >
                    <History fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This function transforms the SPARQL query results into the format
              needed for visualization and analysis. You can edit it manually or
              use AI to modify it.
            </Typography>
            {isEditing ? (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiInputBase-input': {
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                />
                <Box
                  sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    sx={{
                      backgroundColor: '#4CAF50',
                      '&:hover': { backgroundColor: '#45a049' },
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  p: 2,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {processingCode}
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* AI Modification Dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy sx={{ color: '#e86161' }} />
            <Typography variant="h6">AI Modify Processing Function</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe how you want to modify the data processing function. The AI
            will update the code while maintaining its core functionality.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Modification Request"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g., Add error handling for missing data, group by different field, change aggregation method..."
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
          <Button onClick={() => setShowAIDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAIModify}
            variant="contained"
            disabled={isAIModifying || !aiPrompt.trim()}
            startIcon={
              isAIModifying ? <CircularProgress size={16} /> : <SmartToy />
            }
            sx={{
              backgroundColor: '#2196F3',
              '&:hover': { backgroundColor: '#1976D2' },
            }}
          >
            {isAIModifying ? 'Modifying...' : 'Modify Function'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing Function History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History sx={{ color: '#e86161' }} />
            <Typography variant="h6">Processing Function History</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View and restore previous versions of your data processing function.
          </Typography>
          {getProcessingHistory().length === 0 ? (
            <Alert severity="info">No processing function history found.</Alert>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {getProcessingHistory().map((item, index) => (
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
                      <Typography variant="subtitle2">
                        Version {getProcessingHistory().length - index}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item.timestamp)} • {item.action}
                      </Typography>
                      {item.prompt && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ display: 'block' }}
                        >
                          AI Generated
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleRevertHistory(item)}
                      sx={{
                        color: '#e86161',
                        borderColor: '#e86161',
                        '&:hover': {
                          borderColor: '#d45151',
                          backgroundColor: 'rgba(232, 97, 97, 0.04)',
                        },
                      }}
                    >
                      Restore
                    </Button>
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: 1,
                      p: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 150,
                    }}
                  >
                    {item.content.slice(0, 300)}
                    {item.content.length > 300 && '...'}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataProcessingCodeSection;

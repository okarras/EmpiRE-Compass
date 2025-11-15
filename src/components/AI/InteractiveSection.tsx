import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  SmartToy,
  Save,
  Cancel,
  History,
  Refresh,
} from '@mui/icons-material';
import { useAIService } from '../../services/backendAIService';
import { useDynamicQuestion } from '../../context/DynamicQuestionContext';

interface InteractiveSectionProps {
  title: string;
  content: string;
  type: 'sparql' | 'chart' | 'analysis';
  analysisType?: 'question' | 'dataCollection' | 'dataAnalysis';
  onContentChange: (content: string, prompt?: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  isHtml?: boolean;
}

const InteractiveSection: React.FC<InteractiveSectionProps> = ({
  title,
  content,
  type,
  analysisType,
  onContentChange,
  placeholder = 'Enter content...',
  multiline = false,
  rows = 4,
  maxRows = 8,
  isHtml = false,
}) => {
  const aiService = useAIService();
  const { state, getHistoryByType } = useDynamicQuestion();

  const [isEditing, setIsEditing] = useState(false);
  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    onContentChange(editContent);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(content);
    setError(null);
  };

  const handleAIModify = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for the AI.');
      return;
    }

    if (!aiService.isConfigured()) {
      setError('Please configure your AI settings first.');
      return;
    }

    setIsAIModifying(true);
    setError(null);

    try {
      // Build context-aware prompt
      const contextPrompt = buildContextPrompt(aiPrompt);

      const result = await aiService.generateText(contextPrompt, {
        temperature: 0.3,
        maxTokens: type === 'chart' ? 3000 : 1000,
      });

      const modifiedContent = result.text.trim();
      onContentChange(modifiedContent, aiPrompt);

      setShowAIDialog(false);
      setAiPrompt('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to modify content with AI'
      );
    } finally {
      setIsAIModifying(false);
    }
  };

  const buildContextPrompt = (userPrompt: string): string => {
    const history = getHistoryByType(type);
    const recentHistory = history.slice(-5); // Last 5 entries for context

    const contextPrompt = `You are modifying content for a dynamic research question analysis. 

Current Research Question: "${state.question}"

Current Data: ${JSON.stringify(state.queryResults, null, 2)}

Content Type: ${type.toUpperCase()}
${analysisType ? `Analysis Type: ${analysisType}` : ''}

Current Content:
${content}

Recent History:
${recentHistory
  .map(
    (entry) =>
      `${entry.action} (${new Date(entry.timestamp).toLocaleString()}): ${entry.prompt || 'Manual edit'}`
  )
  .join('\n')}

User Request: ${userPrompt}

Please modify the content according to the user's request. Consider the context and history provided.

Requirements:
${type === 'sparql' ? '- Return only the SPARQL query, no explanations' : ''}
${type === 'chart' ? '- Return complete HTML with Chart.js, transparent background, no scrollbars' : ''}
${type === 'analysis' ? '- Return clear, concise analysis text (not HTML)' : ''}

Modified Content:`;

    return contextPrompt;
  };

  const getHistoryCount = () => {
    return getHistoryByType(type).length;
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <TextField
          fullWidth
          multiline={multiline}
          rows={rows}
          maxRows={maxRows}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder={placeholder}
          variant="outlined"
          sx={{ mt: 1 }}
        />
      );
    }

    if (isHtml) {
      return (
        <Box
          sx={{
            mt: 1,
            p: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          mt: 1,
          p: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content || 'No content available'}
      </Typography>
    );
  };

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
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 600 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {getHistoryCount() > 0 && (
              <Chip
                icon={<History />}
                label={`${getHistoryCount()} changes`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            <Tooltip title="Edit manually">
              <IconButton
                onClick={handleEdit}
                size="small"
                sx={{
                  color: '#e86161',
                  '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ask AI to modify">
              <IconButton
                onClick={() => setShowAIDialog(true)}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                }}
              >
                <SmartToy />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderContent()}

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              startIcon={<Save />}
              sx={{
                backgroundColor: '#e86161',
                '&:hover': { backgroundColor: '#d45151' },
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Paper>

      {/* AI Modification Dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy sx={{ color: '#e86161' }} />
            <Typography variant="h6">AI Modification</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe how you want the AI to modify the {type} content. The AI
            will have access to the full context of your research question and
            previous changes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Describe how you want to modify the ${type}...`}
            variant="outlined"
            disabled={isAIModifying}
            onKeyDown={(e) => {
              if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                handleAIModify();
              }
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAIDialog(false)}
            disabled={isAIModifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAIModify}
            variant="contained"
            disabled={isAIModifying || !aiPrompt.trim()}
            startIcon={
              isAIModifying ? <CircularProgress size={16} /> : <Refresh />
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            {isAIModifying ? 'Modifying...' : 'Modify with AI'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InteractiveSection;

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
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
import { Query } from '../constants/queries_chart_info';
import { useAIService } from '../services/aiService';
import { useDynamicQuestion } from '../context/DynamicQuestionContext';

interface QuestionInformationViewProps {
  query: Pick<Query, 'dataAnalysisInformation'>;
}

const QuestionInformationView: React.FC<QuestionInformationViewProps> = ({
  query,
}) => {
  const info = query.dataAnalysisInformation;
  const aiService = useAIService();
  const {
    state,
    getHistoryByType,
    updateQuestionInterpretation,
    updateDataCollectionInterpretation,
    updateDataAnalysisInterpretation,
  } = useDynamicQuestion();

  const [editingSection, setEditingSection] = useState<
    'question' | 'dataCollection' | 'dataAnalysis' | null
  >(null);
  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiTargetSection, setAiTargetSection] = useState<
    'question' | 'dataCollection' | 'dataAnalysis' | null
  >(null);
  const [editContent, setEditContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    setEditingSection(section);
    setEditContent(getSectionContent(section) || '');
  };

  const handleSave = () => {
    if (editingSection) {
      const updateFunction = getUpdateFunction(editingSection);
      updateFunction(editContent);
      setEditingSection(null);
      setError(null);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditContent('');
    setError(null);
  };

  const handleAIModify = async () => {
    if (!aiPrompt.trim() || !aiTargetSection) {
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
      const history = getHistoryByType('analysis');
      const recentHistory = history.slice(-5);
      const currentContent = getSectionContent(aiTargetSection);

      const contextPrompt = `You are modifying analysis content for a dynamic research question. 

Current Research Question: "${state.question}"

Current Data: ${JSON.stringify(state.queryResults, null, 2)}

Content Type: ${aiTargetSection === 'question' ? 'Question Interpretation' : aiTargetSection === 'dataCollection' ? 'Data Collection Interpretation' : 'Data Analysis Interpretation'}

Current Content:
${currentContent}

Recent History:
${recentHistory
  .map(
    (entry) =>
      `${entry.action} (${new Date(entry.timestamp).toLocaleString()}): ${entry.prompt || 'Manual edit'}`
  )
  .join('\n')}

User Request: ${aiPrompt}

Please modify the analysis content according to the user's request. Consider the context and history provided.

Requirements:
- Return clear, concise analysis text (not HTML)
- Maintain professional academic tone
- Focus on Requirements Engineering research context

Modified Content:`;

      const result = await aiService.generateText(contextPrompt, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      const modifiedContent = result.text.trim();
      const updateFunction = getUpdateFunction(aiTargetSection);
      updateFunction(modifiedContent, aiPrompt);

      setShowAIDialog(false);
      setAiPrompt('');
      setAiTargetSection(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to modify content with AI'
      );
    } finally {
      setIsAIModifying(false);
    }
  };

  const getSectionContent = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    switch (section) {
      case 'question':
        return state.questionInterpretation || info.questionExplanation;
      case 'dataCollection':
        return (
          state.dataCollectionInterpretation || info.requiredDataForAnalysis
        );
      case 'dataAnalysis':
        return state.dataAnalysisInterpretation || info.dataAnalysis;
      default:
        return '';
    }
  };

  const getUpdateFunction = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    switch (section) {
      case 'question':
        return updateQuestionInterpretation;
      case 'dataCollection':
        return updateDataCollectionInterpretation;
      case 'dataAnalysis':
        return updateDataAnalysisInterpretation;
      default:
        return updateQuestionInterpretation;
    }
  };

  const getHistoryCount = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    return getHistoryByType('analysis').filter(
      (entry) => entry.content === getSectionContent(section)
    ).length;
  };

  const renderInteractiveSection = (
    title: string,
    content: string,
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    const isEditing = editingSection === section;
    // const displayContent = isEditing ? editContent : content || '';
    const historyCount = getHistoryCount(section);

    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: '#e86161' }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {historyCount > 0 && (
              <Chip
                icon={<History />}
                label={`${historyCount} changes`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            <Tooltip title="Edit manually">
              <IconButton
                onClick={() => handleEdit(section)}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ask AI to modify">
              <IconButton
                onClick={() => {
                  setAiTargetSection(section);
                  setShowAIDialog(true);
                }}
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

        {isEditing ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        ) : (
          <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {content}
          </Typography>
        )}

        {isEditing && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderInteractiveSection(
        'Explanation of the Competency Question',
        getSectionContent('question') || '',
        'question'
      )}
      <Divider sx={{ my: 2 }} />
      {renderInteractiveSection(
        'Required Data for Analysis',
        getSectionContent('dataCollection') || '',
        'dataCollection'
      )}
      <Divider sx={{ my: 2 }} />
      {renderInteractiveSection(
        'Data Analysis',
        getSectionContent('dataAnalysis') || '',
        'dataAnalysis'
      )}

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
            <Typography variant="h6">AI Analysis Modification</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe how you want the AI to modify the{' '}
            {aiTargetSection === 'question'
              ? 'question interpretation'
              : aiTargetSection === 'dataCollection'
                ? 'data collection interpretation'
                : 'data analysis interpretation'}
            . The AI will have access to the full context of your research
            question and previous changes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Describe how you want to modify the ${aiTargetSection === 'question' ? 'question interpretation' : aiTargetSection === 'dataCollection' ? 'data collection interpretation' : 'data analysis interpretation'}...`}
            variant="outlined"
            disabled={isAIModifying}
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
    </Box>
  );
};

export default QuestionInformationView;

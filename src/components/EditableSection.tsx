import React, { useState } from 'react';
import {
  Box,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Tooltip,
  Paper,
  Typography,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  AutoAwesome, // For AI
} from '@mui/icons-material';
import { useAIService } from '../services/backendAIService';

interface EditableSectionProps {
  isEditingInfo?: boolean; // Global edit mode for the page
  content: string | string[];
  sectionLabel: string;
  onSave: (newContent: string) => Promise<void>;
  isHtml?: boolean; // If true, render as HTML in read mode
  multiline?: boolean;
}

const EditableSection: React.FC<EditableSectionProps> = ({
  isEditingInfo,
  content,
  sectionLabel,
  onSave,
  isHtml = true,
  multiline = true,
}) => {
  // Local edit state for this specific block
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>(
    Array.isArray(content) ? content.join('\n') : content || ''
  );
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const aiService = useAIService();

  // If the global "Edit Mode" is off, we ensure local editing is off too
  React.useEffect(() => {
    if (!isEditingInfo) {
      setIsEditing(false);
    }
  }, [isEditingInfo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(currentContent);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      // Optional: show error toast
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      // Simple prompt for now
      const prompt = `Rewrite the following text to be more clear and scientific:\n\n${currentContent}`;
      const result = await aiService.generateText(prompt);
      // We might want to remove quotes if the AI wraps it
      setCurrentContent(result.text.replace(/^"|"$/g, ''));
    } catch (err) {
      console.error('AI generation failed', err);
    } finally {
      setAiLoading(false);
    }
  };

  // If not in global edit mode, just render content
  if (!isEditingInfo) {
    if (isHtml) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: Array.isArray(content) ? content.join('') : content,
          }}
        />
      );
    }
    return (
      <Typography>
        {Array.isArray(content) ? content.join(', ') : content}
      </Typography>
    );
  }

  // In global edit mode, we show the content with an edit button (hover effect or always visible)
  if (!isEditing) {
    return (
      <Box
        sx={{
          position: 'relative',
          border: '1px dashed #ccc',
          p: 1,
          borderRadius: 1,
          '&:hover .edit-btn': { opacity: 1 },
        }}
      >
        {isHtml ? (
          <div
            dangerouslySetInnerHTML={{
              __html: Array.isArray(content) ? content.join('') : content,
            }}
          />
        ) : (
          <Typography>
            {Array.isArray(content) ? content.join(', ') : content}
          </Typography>
        )}
        <Tooltip title={`Edit ${sectionLabel}`}>
          <IconButton
            className="edit-btn"
            size="small"
            onClick={() => {
              setCurrentContent(
                Array.isArray(content) ? content.join('\n') : content || ''
              );
              setIsEditing(true);
            }}
            sx={{
              position: 'absolute',
              top: 5,
              right: 5,
              opacity: 0.3,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // Editing Interface
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, display: 'block' }}
      >
        Editing: {sectionLabel}
      </Typography>
      <TextField
        fullWidth
        multiline={multiline}
        minRows={multiline ? 3 : 1}
        value={currentContent}
        onChange={(e) => setCurrentContent(e.target.value)}
        disabled={saving}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          size="small"
          startIcon={
            aiLoading ? <CircularProgress size={16} /> : <AutoAwesome />
          }
          onClick={handleAiGenerate}
          disabled={saving || aiLoading}
          color="secondary"
        >
          Start with AI
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          startIcon={<Cancel />}
          onClick={() => setIsEditing(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d45151',
            },
          }}
        >
          Save
        </Button>
      </Box>
    </Paper>
  );
};

export default EditableSection;

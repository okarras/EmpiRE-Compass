import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
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
import DOMPurify from 'dompurify';
import { useAIService } from '../../services/aiService';
import { useDynamicQuestion } from '../../context/DynamicQuestionContext';

interface HTMLRendererProps {
  html: string;
  title?: string;
  type?: 'chart' | 'description' | 'interpretation';
  onHistoryClick?: React.ReactNode;
  useIframe?: boolean;
  onContentChange?: (content: string, prompt?: string) => void;
}

const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  html,
  title,
  type = 'description',
  onHistoryClick,
  useIframe = false,
  onContentChange,
}) => {
  const aiService = useAIService();
  const { state, getHistoryByType } = useDynamicQuestion();

  const [isEditing, setIsEditing] = useState(false);
  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editContent, setEditContent] = useState(html);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditContent(html);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onContentChange) {
      onContentChange(editContent);
    }
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(html);
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

    if (!onContentChange) {
      setError('Content change function not available.');
      return;
    }

    setIsAIModifying(true);
    setError(null);

    try {
      const history = getHistoryByType('chart');
      const recentHistory = history.slice(-5);

      const contextPrompt = `You are modifying chart HTML for a dynamic research question analysis. 

      Current Research Question: "${state.question}"

      Current Data: ${JSON.stringify(state.queryResults, null, 2)}

      Current Chart HTML:
      ${html}

      Recent History:
      ${recentHistory
        .map(
          (entry) =>
            `${entry.action} (${new Date(entry.timestamp).toLocaleString()}): ${entry.prompt || 'Manual edit'}`
        )
        .join('\n')}

      User Request: ${aiPrompt}

      Please modify the chart HTML according to the user's request. Consider the context and history provided.

      Requirements:
- Return complete HTML with Chart.js CDN included
- Use transparent background, no scrollbars
- Include professional, responsive styling
- Use brand colors (#e86161, #4CAF50, #2196F3, #FF9800, #9C27B0)
- Set chart height to at least 500px for better visibility
- Ensure the chart is properly sized and responsive
- Include comprehensive interactivity (hover tooltips, click events, zoom/pan)
- Enable Chart.js interactions: responsive, maintainAspectRatio, and interaction options

      Modified Chart HTML:`;

      const result = await aiService.generateText(contextPrompt, {
        temperature: 0.3,
        maxTokens: 3000,
      });

      let modifiedHtml = result.text.trim();

      // Clean up the response to extract only HTML content
      // Remove markdown code blocks
      modifiedHtml = modifiedHtml.replace(/```html\s*\n?/gi, '');
      modifiedHtml = modifiedHtml.replace(/```\s*\n?/gi, '');

      // Remove any explanations before or after HTML
      const htmlMatch = modifiedHtml.match(/<html[^>]*>[\s\S]*<\/html>/i);
      if (htmlMatch) {
        modifiedHtml = htmlMatch[0];
      } else {
        // If no complete HTML document, try to find HTML content
        const bodyMatch = modifiedHtml.match(/<body[^>]*>[\s\S]*<\/body>/i);
        if (bodyMatch) {
          modifiedHtml = `<!DOCTYPE html>
<html style="background: transparent !important; overflow: hidden;">
<head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        html, body { background: transparent !important; overflow: hidden; margin: 0; padding: 0; }
    </style>
</head>
${bodyMatch[0]}
</html>`;
        }
      }

      onContentChange(modifiedHtml, aiPrompt);

      setShowAIDialog(false);
      setAiPrompt('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to modify chart with AI'
      );
    } finally {
      setIsAIModifying(false);
    }
  };

  const getHistoryCount = () => {
    return getHistoryByType('chart').length;
  };

  // Sanitize HTML content
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'div',
      'span',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'blockquote',
      'code',
      'pre',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'img',
      'canvas',
      'svg',
      'g',
      'path',
      'circle',
      'rect',
      'line',
      'text',
      'script', // Allow scripts for charts
    ],
    ALLOWED_ATTR: [
      'class',
      'id',
      'style',
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'width',
      'height',
      'data-*',
      'aria-*',
      'viewBox',
      'xmlns',
      'd',
      'fill',
      'stroke',
      'stroke-width',
      'x',
      'y',
      'cx',
      'cy',
      'r',
      'x1',
      'y1',
      'x2',
      'y2',
      'type', // For script tags
    ],
    ALLOW_DATA_ATTR: true,
    ADD_TAGS: ['canvas', 'svg'],
    ADD_ATTR: ['target', 'onclick'], // Be careful with onclick
  });

  const renderContent = () => {
    if (useIframe || type === 'chart') {
      // Clean up HTML content - remove markdown and explanations
      let htmlContent = html;

      // Remove markdown code blocks
      htmlContent = htmlContent.replace(/```html\s*\n?/gi, '');
      htmlContent = htmlContent.replace(/```\s*\n?/gi, '');

      // Extract only HTML content
      const htmlMatch = htmlContent.match(/<html[^>]*>[\s\S]*<\/html>/i);
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      } else {
        // If no complete HTML document, try to find HTML content
        const bodyMatch = htmlContent.match(/<body[^>]*>[\s\S]*<\/body>/i);
        if (bodyMatch) {
          htmlContent = `<!DOCTYPE html>
          <html style="background: transparent !important; overflow: hidden;">
          <head>
              <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
              <style>
                  html, body { background: transparent !important; overflow: hidden; margin: 0; padding: 0; }
              </style>
          </head>
          ${bodyMatch[0]}
          </html>`;
        }
      }

      // For chart HTML, render in an iframe for better isolation
      return (
        <Box
          sx={{
            width: '100%',
            height: '600px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
        >
          <iframe
            srcDoc={htmlContent}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
            }}
            title={title || 'AI Generated Chart'}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            scrolling="no"
          />
        </Box>
      );
    } else {
      // For descriptions and interpretations, render directly
      return (
        <Box
          sx={{
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: '#e86161',
              fontWeight: 600,
              marginBottom: 1,
              marginTop: 2,
            },
            '& h1': { fontSize: '1.5rem' },
            '& h2': { fontSize: '1.3rem' },
            '& h3': { fontSize: '1.1rem' },
            '& p': {
              marginBottom: 1.5,
              lineHeight: 1.6,
            },
            '& ul, & ol': {
              marginBottom: 1.5,
              paddingLeft: 2,
            },
            '& li': {
              marginBottom: 0.5,
            },
            '& strong, & b': {
              fontWeight: 600,
            },
            '& em, & i': {
              fontStyle: 'italic',
            },
            '& blockquote': {
              borderLeft: '4px solid #e86161',
              paddingLeft: 2,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: 1.5,
              fontStyle: 'italic',
              backgroundColor: 'rgba(232, 97, 97, 0.02)',
              padding: 1,
              borderRadius: 1,
            },
            '& code': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '2px 4px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& pre': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: 1.5,
            },
            '& th, & td': {
              border: '1px solid rgba(0, 0, 0, 0.1)',
              padding: 1,
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: 'rgba(232, 97, 97, 0.1)',
              fontWeight: 600,
            },
            '& a': {
              color: '#e86161',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    }
  };

  if (!html) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        backgroundColor:
          type === 'chart' ? 'transparent' : 'rgba(232, 97, 97, 0.02)',
        border: type === 'chart' ? 'none' : '1px solid rgba(232, 97, 97, 0.1)',
        borderRadius: type === 'chart' ? 0 : 2,
      }}
    >
      {title && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 600 }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {type === 'chart' && getHistoryCount() > 0 && (
              <Chip
                icon={<History />}
                label={`${getHistoryCount()} changes`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            {type === 'chart' && onContentChange && (
              <>
                <Tooltip title="Edit manually">
                  <IconButton
                    onClick={handleEdit}
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
              </>
            )}
            {onHistoryClick && <Box>{onHistoryClick}</Box>}
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isEditing && type === 'chart' && (
        <TextField
          fullWidth
          multiline
          rows={8}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          variant="outlined"
          sx={{ mb: 2, fontFamily: 'monospace' }}
        />
      )}

      {isEditing && type === 'chart' && (
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
      {renderContent()}

      {/* AI Modification Dialog */}
      {type === 'chart' && onContentChange && (
        <Dialog
          open={showAIDialog}
          onClose={() => setShowAIDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy sx={{ color: '#e86161' }} />
              <Typography variant="h6">AI Chart Modification</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Describe how you want the AI to modify the chart. The AI will have
              access to the full context of your research question and previous
              changes.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe how you want to modify the chart..."
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
      )}
    </Paper>
  );
};

export default HTMLRenderer;

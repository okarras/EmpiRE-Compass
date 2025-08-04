import {
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Query } from '../../constants/queries_chart_info';
import useBackendAIAssistant from '../../hooks/useBackendAIAssistant';
import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import AIConfigurationButton from './AIConfigurationButton';

// Lazy load components to reduce initial bundle size
const InitialAnalysis = lazy(() => import('./InitialAnalysis'));
const ChatMessage = lazy(() => import('./ChatMessage'));
const TextSkeleton = lazy(() => import('./TextSkeleton'));

interface AIAssistantProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ query, questionData }) => {
  const {
    prompt,
    setPrompt,
    messages,
    loading,
    error,
    initialAnalysis,
    initialReasoning,
    handleGenerate,
    isFromCache,
    undoInitialAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
    refreshingInitialAnalysis,
    streamingText,
    showReasoning,
    setShowReasoning,
    showChart,
    setShowChart,
    clearChatHistory,
    exportChatHistory,
  } = useBackendAIAssistant({ query, questionData });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleClearChat = () => {
    handleMenuClose();
    clearChatHistory();
  };

  const handleExportChat = () => {
    handleMenuClose();
    exportChatHistory();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky Header */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.primary' }}>
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AIConfigurationButton />
            <Tooltip
              title={showReasoning ? 'Hide AI Reasoning' : 'Show AI Reasoning'}
            >
              <IconButton
                onClick={() => setShowReasoning(!showReasoning)}
                sx={{
                  color: showReasoning ? '#e86161' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                  },
                }}
              >
                <PsychologyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={showChart ? 'Hide Chart' : 'Show Chart'}>
              <IconButton
                onClick={() => setShowChart(!showChart)}
                sx={{
                  color: showChart ? '#e86161' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                  },
                }}
              >
                <BarChartIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chat Options">
              <IconButton
                onClick={handleMenuClick}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 180,
                },
              }}
            >
              <MenuItem
                onClick={handleExportChat}
                disabled={messages.length === 0}
              >
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export Chat</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={handleClearChat}
                disabled={messages.length === 0}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" sx={{ color: '#e86161' }} />
                </ListItemIcon>
                <ListItemText sx={{ color: '#e86161' }}>
                  Clear Chat
                </ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      {/* Scrollable Content */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {refreshingInitialAnalysis ? (
          <Box sx={{ p: 2 }}>
            <TextSkeleton lines={8} />
          </Box>
        ) : (
          <Suspense fallback={<div>Loading initial analysis...</div>}>
            <InitialAnalysis
              content={initialAnalysis}
              reasoning={initialReasoning}
              showReasoning={showReasoning}
            />
          </Suspense>
        )}

        {isFromCache && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              backgroundColor: 'rgba(232, 97, 97, 0.04)',
              borderRadius: 1,
              border: '1px solid rgba(232, 97, 97, 0.1)',
              mt: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                flex: 1,
              }}
            >
              Showing cached analysis
            </Typography>
            <Button
              variant="outlined"
              onClick={refreshInitialAnalysis}
              startIcon={
                refreshingInitialAnalysis ? (
                  <CircularProgress size={16} sx={{ color: '#e86161' }} />
                ) : (
                  <RefreshIcon />
                )
              }
              size="small"
              sx={{
                borderColor: '#e86161',
                color: '#e86161',
                '&:hover': {
                  borderColor: '#d45151',
                  backgroundColor: 'rgba(232, 97, 97, 0.08)',
                },
              }}
              disabled={refreshingInitialAnalysis}
            >
              {refreshingInitialAnalysis ? 'Refreshing...' : 'Refresh Analysis'}
            </Button>
          </Paper>
        )}

        {canUndoInitialAnalysis && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              backgroundColor: 'rgba(232, 97, 97, 0.04)',
              borderRadius: 1,
              border: '1px solid rgba(232, 97, 97, 0.1)',
              mt: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic',
                flex: 1,
              }}
            >
              Not satisfied with the new analysis?
            </Typography>
            <Button
              variant="outlined"
              onClick={undoInitialAnalysis}
              size="small"
              sx={{
                borderColor: '#e86161',
                color: '#e86161',
                '&:hover': {
                  borderColor: '#d45151',
                  backgroundColor: 'rgba(232, 97, 97, 0.08)',
                },
              }}
            >
              Undo
            </Button>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Chat Messages */}
        {messages.map((message, index) => (
          <Suspense key={index} fallback={<div>Loading chat message...</div>}>
            <ChatMessage
              content={message.content}
              isUser={message.isUser}
              reasoning={message.reasoning}
              showReasoning={showReasoning}
              chartHtml={message.chartHtml}
              showChart={showChart}
            />
          </Suspense>
        ))}

        {/* Streaming Message */}
        {streamingText && (
          <Suspense fallback={<div>Loading streaming message...</div>}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  backgroundColor: 'background.paper',
                  color: 'text.primary',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    '&::after': {
                      content: '""',
                      display: 'inline-block',
                      width: '4px',
                      height: '20px',
                      backgroundColor: '#e86161',
                      animation: 'blink 1s infinite',
                      ml: 1,
                      verticalAlign: 'text-bottom',
                    },
                    '@keyframes blink': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0 },
                      '100%': { opacity: 1 },
                    },
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: streamingText }} />
                </Box>
              </Paper>
            </Box>
          </Suspense>
        )}

        {loading && !streamingText && (
          <Suspense fallback={<div>Loading skeleton...</div>}>
            <Box sx={{ p: 2 }}>
              <TextSkeleton lines={3} />
            </Box>
          </Suspense>
        )}

        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: 'rgba(232, 97, 97, 0.05)',
              border: '1px solid rgba(232, 97, 97, 0.1)',
              borderRadius: 2,
              mt: 2,
            }}
          >
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Ask a question about this research topic..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                '&:hover': {
                  '& > fieldset': {
                    borderColor: '#e86161',
                  },
                },
                '&.Mui-focused': {
                  '& > fieldset': {
                    borderColor: '#e86161',
                  },
                },
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            endIcon={
              loading ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <SendIcon />
              )
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': {
                backgroundColor: '#d45151',
              },
            }}
          >
            {loading ? 'Generating...' : 'Ask Question'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AIAssistant;

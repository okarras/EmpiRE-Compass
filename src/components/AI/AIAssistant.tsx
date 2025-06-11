import {
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import { Query } from '../../constants/queries_chart_info';
import useAIAssistant from '../../hooks/useAIAssistant';
import InitialAnalysis from './InitialAnalysis';
import ChatMessage from './ChatMessage';
import TextSkeleton from './TextSkeleton';
import { useRef, useEffect } from 'react';

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
    handleGenerate,
    isFromCache,
    undoInitialAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
    refreshingInitialAnalysis,
    streamingText,
  } = useAIAssistant({ query, questionData });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
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
          <InitialAnalysis content={initialAnalysis} />
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
              startIcon={refreshingInitialAnalysis ? <CircularProgress size={16} sx={{ color: '#e86161' }} /> : <RefreshIcon />}
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
          <ChatMessage
            key={index}
            content={message.content}
            isUser={message.isUser}
          />
        ))}

        {/* Streaming Message */}
        {streamingText && (
          <ChatMessage
            content={streamingText}
            isUser={false}
          />
        )}

        {loading && !streamingText && (
          <Box sx={{ p: 2 }}>
            <TextSkeleton lines={3} />
          </Box>
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
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            endIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon />}
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
      </Box>
    </Box>
  );
};

export default AIAssistant;

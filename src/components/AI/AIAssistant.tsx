import {
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Box,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Query } from '../../constants/queries_chart_info';
import useAIAssistant from '../../hooks/useAIAssistant';
import InitialAnalysis from './InitialAnalysis';
import ResponseDisplay from './ResponseDisplay';

interface AIAssistantProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ query, questionData }) => {
  const {
    prompt,
    setPrompt,
    response,
    loading,
    error,
    initialAnalysis,
    handleGenerate,
    isFromCache,
    undoInitialAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
  } = useAIAssistant({ query, questionData });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <InitialAnalysis content={initialAnalysis} />

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
            startIcon={loading ? <CircularProgress size={16} sx={{ color: '#e86161' }} /> : <RefreshIcon />}
            size="small"
            sx={{
              borderColor: '#e86161',
              color: '#e86161',
              '&:hover': {
                borderColor: '#d45151',
                backgroundColor: 'rgba(232, 97, 97, 0.08)',
              },
            }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Analysis'}
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
            mt: 1,
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#e86161',
              width: 32,
              height: 32,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 20 }} />
          </Avatar>
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => handleGenerate()}
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

          {response && (
            <Tooltip title="Refresh response">
              <Button
                variant="outlined"
                onClick={() => handleGenerate()}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{
                  borderColor: '#e86161',
                  color: '#e86161',
                  '&:hover': {
                    borderColor: '#d45151',
                    backgroundColor: 'rgba(232, 97, 97, 0.04)',
                  },
                }}
              >
                Refresh
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {error && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: 'rgba(232, 97, 97, 0.05)',
            border: '1px solid rgba(232, 97, 97, 0.1)',
            borderRadius: 2,
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {response && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#e86161',
                width: 32,
                height: 32,
              }}
            >
              <SmartToyIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <ResponseDisplay content={response} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default AIAssistant;

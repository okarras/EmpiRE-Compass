import {
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  } = useAIAssistant({ query, questionData });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.shiftKey && e.key === 'Enter') {
      handleGenerate();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        mb: 2,
      }}
      onKeyDown={handleKeyDown}
    >
      <Typography
        variant="h5"
        sx={{
          color: '#e86161',
          fontWeight: 600,
          mb: 3,
        }}
      >
        AI Research Assistant
      </Typography>

      <InitialAnalysis content={initialAnalysis} />

      {isFromCache && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
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
            onClick={() => handleGenerate()}
            startIcon={<RefreshIcon />}
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
            Refresh Analysis
          </Button>
        </Box>
      )}

      <TextField
        fullWidth
        multiline
        rows={3}
        variant="outlined"
        placeholder="Ask a question about this research topic..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleGenerate()}
          disabled={loading || !prompt.trim()}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d45151',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            'Ask Question'
          )}
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

      {error && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'rgba(232, 97, 97, 0.05)',
            border: '1px solid rgba(232, 97, 97, 0.1)',
            borderRadius: 2,
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <ResponseDisplay content={response} />
    </Paper>
  );
};

export default AIAssistant;

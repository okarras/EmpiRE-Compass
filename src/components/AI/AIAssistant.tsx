import {
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
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

      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        sx={{
          backgroundColor: '#e86161',
          '&:hover': {
            backgroundColor: '#d45151',
          },
          mb: 2,
        }}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: 'white' }} />
        ) : (
          'Ask Question'
        )}
      </Button>

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
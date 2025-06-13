import { Box, Paper } from '@mui/material';
import HTMLRenderer from './HTMLRenderer';

interface InitialAnalysisProps {
  content: string | null;
  reasoning?: string | null;
  showReasoning?: boolean;
}

const InitialAnalysis: React.FC<InitialAnalysisProps> = ({ 
  content, 
  reasoning,
  showReasoning = true 
}) => {
  if (!content) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
        }}
      >
        <HTMLRenderer content={content} />
      </Paper>
      {reasoning && showReasoning && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: 'rgba(232, 97, 97, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(232, 97, 97, 0.1)',
            fontSize: '0.875rem',
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          <strong>Reasoning:</strong> {reasoning}
        </Paper>
      )}
    </Box>
  );
};

export default InitialAnalysis; 
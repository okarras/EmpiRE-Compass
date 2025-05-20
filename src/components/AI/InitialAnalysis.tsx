import { Paper } from '@mui/material';
import HTMLRenderer from './HTMLRenderer';

interface InitialAnalysisProps {
  content: string | null;
}

const InitialAnalysis: React.FC<InitialAnalysisProps> = ({ content }) => {
  if (!content) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 2,
      }}
    >
      <HTMLRenderer content={content} />
    </Paper>
  );
};

export default InitialAnalysis; 
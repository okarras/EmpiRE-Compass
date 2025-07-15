import { Paper } from '@mui/material';
import HTMLRenderer from './HTMLRenderer';

interface ResponseDisplayProps {
  content: string | null;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ content }) => {
  if (!content) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 2,
      }}
    >
      <HTMLRenderer html={content} />
    </Paper>
  );
};

export default ResponseDisplay;

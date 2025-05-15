import { Paper, Typography } from '@mui/material';

interface ErrorStateProps {
  message: string;
}

const ErrorState = ({ message }: ErrorStateProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 4,
      mt: 4,
      textAlign: 'center',
      backgroundColor: 'rgba(232, 97, 97, 0.05)',
      border: '1px solid rgba(232, 97, 97, 0.1)',
      borderRadius: 2,
    }}
  >
    <Typography variant="h5" color="error" gutterBottom>
      {message}
    </Typography>
    <Typography color="text.secondary">
      Please try again later or contact support if the problem persists.
    </Typography>
  </Paper>
);

export default ErrorState; 
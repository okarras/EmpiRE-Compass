import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingState = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: 2,
    }}
  >
    <CircularProgress sx={{ color: '#e86161' }} />
    <Typography color="text.secondary">Loading data...</Typography>
  </Box>
);

export default LoadingState; 
import React from 'react';
import { Container, ThemeProvider, Typography, Box } from '@mui/material';
import theme from '../utils/theme';
import AIAssistant from '../components/AIAssistant';

const AIPage = () => {
  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 4, sm: 6, md: 8 },
          mb: { xs: 4, sm: 6, md: 8 },
          minHeight: 'calc(100vh - 200px)',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Typography
            variant="h3"
            sx={{
              color: '#e86161',
              fontWeight: 700,
              mb: 4,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.3,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: '60px',
                height: '4px',
                backgroundColor: '#e86161',
                borderRadius: '2px',
              },
            }}
          >
            AI Assistant
          </Typography>

          <AIAssistant />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default AIPage; 
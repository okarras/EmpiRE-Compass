import React from 'react';
import { Box, Typography, Container, ThemeProvider } from '@mui/material';
import DynamicAIQuestion from '../components/DynamicAIQuestion';
import theme from '../utils/theme';

const DynamicQuestionPage: React.FC = () => {
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              mb: 4,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: 1.3,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'primary.main',
                  borderRadius: '2px',
                },
              }}
            >
              Dynamic Question
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Ask any research question, and the AI will generate a SPARQL query,
            execute it, and display the results.
          </Typography>
          <DynamicAIQuestion />
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default DynamicQuestionPage;

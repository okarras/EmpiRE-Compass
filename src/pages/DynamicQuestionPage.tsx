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
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 4,
              pb: 1,
              borderBottom: '4px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: 1.3,
                flex: 1,
                minWidth: 0,
              }}
            >
              Dynamic Question
            </Typography>
            <Box id="page-title-export-action" sx={{ flexShrink: 0 }} />
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

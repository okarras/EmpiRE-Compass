import {
  Container,
  Stack,
  Divider,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import theme from '../utils/theme';
import Header from '../components/Home/Header';
import HighPriorityNews from '../components/Home/HighPriorityNews';
import AboutProject from '../components/Home/AboutProject';
import KeyFeatures from '../components/Home/KeyFeatures';
import FutureDevelopment from '../components/Home/FutureDevelopment';
import Contact from '../components/Home/Contact';
import Partners from '../components/Home/Partners';
import CRUDHomeContent, { HomeContentData } from '../firestore/CRUDHomeContent';
import { useBackupChange } from '../hooks/useBackupChange';

const Home = () => {
  const [homeContent, setHomeContent] = useState<HomeContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backupVersion = useBackupChange(); // Listen for backup changes

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const content = await CRUDHomeContent.getHomeContent();
        setHomeContent(content);
        setError(null);
      } catch (err) {
        console.error('Error fetching home content:', err);
        setError('Failed to load page content. Using default content.');
        // Use default content on error
        setHomeContent(CRUDHomeContent.defaultHomeContent);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [backupVersion]); // Re-fetch when backup changes

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: '100vh',
            width: '100%',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress sx={{ color: '#e86161' }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            py: { xs: 1, sm: 2, md: 3 },
            px: { xs: 1, sm: 1, md: 2 },
          }}
        >
          <Stack spacing={2} sx={{ flex: 1 }}>
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {homeContent && (
              <>
                <Header content={homeContent.header} />
                <HighPriorityNews />
                <Divider sx={{ my: { xs: 3, sm: 4, md: 5 } }} />
                <Stack spacing={4}>
                  <AboutProject content={homeContent.aboutProject} />
                  <KeyFeatures content={homeContent.keyFeatures} />
                  <FutureDevelopment content={homeContent.futureDevelopment} />
                  <Contact content={homeContent.contact} />
                </Stack>
                <Partners content={homeContent.partners} />
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Home;

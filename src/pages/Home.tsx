import { Container, Stack, Divider, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../utils/theme';
import Header from '../components/Home/Header';
import AboutProject from '../components/Home/AboutProject';
import KeyFeatures from '../components/Home/KeyFeatures';
import FutureDevelopment from '../components/Home/FutureDevelopment';
import Contact from '../components/Home/Contact';
import Partners from '../components/Home/Partners';

const Home = () => {
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
            px: { xs: 1, sm: 1, md: 2 }
          }}
        >
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Header />
            <Divider sx={{ my: { xs: 3, sm: 4, md: 5 } }} />
            <Stack spacing={4}>
              <AboutProject />
              <KeyFeatures />
              <FutureDevelopment />
              <Contact />
            </Stack>
            <Partners />
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Home;

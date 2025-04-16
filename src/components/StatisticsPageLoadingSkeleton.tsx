import { ThemeProvider } from '@emotion/react';
import {
  Container,
  Stack,
  Paper,
  Skeleton,
  Typography,
  Divider,
} from '@mui/material';
import theme from '../utils/theme';

const StatisticsPageLoadingSkeleton = () => {
  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 8}}>
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
          mb={4}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                borderRadius: 4,
                width: 160,
                textAlign: 'center',
                backgroundColor: '#eceff1',
              }}
              elevation={0}
            >
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ margin: '0 auto', mb: 1.5 }}
              />
              <Skeleton
                variant="text"
                width="60%"
                height={28}
                sx={{ mx: 'auto' }}
              />
              <Skeleton
                variant="text"
                width="40%"
                height={20}
                sx={{ mx: 'auto' }}
              />
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ mt: 2 }} />

        <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mt: 14 }}>
          <Typography variant="h6" gutterBottom>
            Papers per Venue
          </Typography>
          <Skeleton variant="rectangular" height={100} />
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default StatisticsPageLoadingSkeleton;

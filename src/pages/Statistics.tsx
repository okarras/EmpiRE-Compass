import { ThemeProvider } from '@mui/material/styles';
import { Typography, Container, Grid, Paper } from '@mui/material';
import theme from '../utils/theme';

export default function Statistics() {
  return (
    <ThemeProvider theme={theme}>
      {/* Main Content */}
      <Container sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* First Chart Card */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Chart 1
              </Typography>
              {/* Replace the below with your chart component */}
              <div style={{ height: 250, backgroundColor: '#f5f5f5' }}>
                {/* Chart 1 placeholder */}
              </div>
            </Paper>
          </Grid>

          {/* Second Chart Card */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Chart 2
              </Typography>
              {/* Replace the below with your chart component */}
              <div style={{ height: 250, backgroundColor: '#f5f5f5' }}>
                {/* Chart 2 placeholder */}
              </div>
            </Paper>
          </Grid>

          {/* Statistics Summary */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Statistics Summary
              </Typography>
              {/* Insert your summary or table component here */}
              <div style={{ minHeight: 150, backgroundColor: '#fafafa' }}>
                {/* Summary content placeholder */}
              </div>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

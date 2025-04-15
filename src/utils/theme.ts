import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e88e5', // Replace with your desired primary color (blue tone similar to the reference)
    },
    secondary: {
      main: '#e53935', // Replace with your desired secondary color
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Choose your typography options
  },
});

export default theme;

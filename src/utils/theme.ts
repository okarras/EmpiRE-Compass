import { createTheme, PaletteMode, ThemeOptions } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Common theme settings
const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#e86161' : '#ff7b7b',
      light: mode === 'light' ? '#ff8f8f' : '#ff9d9d',
      dark: mode === 'light' ? '#b13737' : '#cc4444',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#1e88e5' : '#64b5f6',
      light: mode === 'light' ? '#6ab7ff' : '#9be7ff',
      dark: mode === 'light' ? '#005cb2' : '#0077c2',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#0a1929',
      paper: mode === 'light' ? '#ffffff' : '#0f2744',
    },
    text: {
      primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#ffffff',
      secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    action: {
      active: mode === 'light' ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.7)',
      hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
      selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
      disabled: mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.3)',
      disabledBackground: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'all 0.3s linear',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.divider,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.background.paper, mode === 'dark' ? 0.6 : 1),
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          transition: 'all 0.3s ease',
          ...(mode === 'dark' && {
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          }),
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: mode === 'dark' ? '0 4px 12px rgba(255, 123, 123, 0.3)' : 'none',
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          backgroundImage: mode === 'dark' 
            ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
            : 'none',
          boxShadow: mode === 'dark' 
            ? '4px 0 15px rgba(0, 0, 0, 0.5)' 
            : '4px 0 10px rgba(0, 0, 0, 0.05)',
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.paper, mode === 'dark' ? 0.8 : 1),
          backdropFilter: 'blur(8px)',
          boxShadow: mode === 'dark' 
            ? '0 4px 15px rgba(0, 0, 0, 0.5)' 
            : '0 1px 4px rgba(0, 0, 0, 0.05)',
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark' ? '#1e364d' : 'rgba(0, 0, 0, 0.8)',
          fontSize: '0.875rem',
          padding: '8px 12px',
          borderRadius: '6px',
        },
        arrow: {
          color: mode === 'dark' ? '#1e364d' : 'rgba(0, 0, 0, 0.8)',
        },
      },
    },
  },
});

// Create theme instance
const theme = createTheme(getDesignTokens('light'));

export { getDesignTokens };
export default theme;

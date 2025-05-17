import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';
import { getDesignTokens } from './utils/theme';
import Router from './Router';
import { store } from './store';
import { fetchQuestionsFromFirebase } from './store/slices/questionSlice';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Create a wrapper component to use Redux hooks and theme
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { mode } = useTheme();

  // Create theme instance based on mode
  const theme = createTheme(getDesignTokens(mode));

  useEffect(() => {
    // Fetch questions when the app loads
    dispatch(fetchQuestionsFromFirebase());
  }, [dispatch]);

  return (
    <MuiThemeProvider theme={theme}>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;

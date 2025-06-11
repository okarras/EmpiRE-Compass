import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';
import { getDesignTokens } from './utils/theme';
import Router from './Router';
import { store } from './store';
import { fetchQuestionsFromFirebase } from './store/slices/questionSlice';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AIAssistantProvider } from './context/AIAssistantContext';
import FloatingAIAssistant from './components/AI/FloatingAIAssistant';
import './styles/global.css';

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
      <CssBaseline />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BrowserRouter>
          <Router />
          <FloatingAIAssistant />
        </BrowserRouter>
      </div>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AIAssistantProvider>
          <AppContent />
        </AIAssistantProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

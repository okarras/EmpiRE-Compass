import { BrowserRouter } from 'react-router-dom';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { Provider } from 'react-redux';
import { useEffect, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';
import { getDesignTokens } from './utils/theme';
import { store } from './store';
import { fetchQuestionsFromFirebase } from './store/slices/questionSlice';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AIAssistantProvider } from './context/AIAssistantContext';
import { DynamicQuestionProvider } from './context/DynamicQuestionContext';
import './styles/global.css';
import AuthProvider from './auth/AuthProvider';

// Lazy load components to reduce initial bundle size
const Router = lazy(() => import('./Router'));
const FloatingAIAssistant = lazy(
  () => import('./components/AI/FloatingAIAssistant')
);

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
      <div
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <Router />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <FloatingAIAssistant />
            </Suspense>
          </AuthProvider>
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
          <DynamicQuestionProvider>
            <AppContent />
          </DynamicQuestionProvider>
        </AIAssistantProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

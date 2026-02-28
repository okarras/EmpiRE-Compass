import { BrowserRouter } from 'react-router-dom';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { Provider } from 'react-redux';
import { lazy, Suspense } from 'react';
import { getDesignTokens } from './utils/theme';
import { store } from './store';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AIAssistantProvider } from './context/AIAssistantContext';
import { DynamicQuestionProvider } from './context/DynamicQuestionContext';
import './styles/global.css';
import AuthProvider from './auth/AuthProvider';
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from './components/LoadingSpinner';
import { ChunkLoadErrorBoundary } from './components/ChunkLoadErrorBoundary';

// Lazy load components to reduce initial bundle size
const Router = lazy(() => import('./Router'));
const FloatingAIAssistant = lazy(
  () => import('./components/AI/FloatingAIAssistant')
);

// Create a wrapper component to use Redux hooks and theme
const AppContent = () => {
  const { mode } = useTheme();

  // Create theme instance based on mode
  const theme = createTheme(getDesignTokens(mode));

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <BrowserRouter>
          <AuthProvider>
            <ChunkLoadErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <Router />
              </Suspense>
              <Suspense fallback={null}>
                <FloatingAIAssistant />
              </Suspense>
            </ChunkLoadErrorBoundary>
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
            <Toaster />
          </DynamicQuestionProvider>
        </AIAssistantProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

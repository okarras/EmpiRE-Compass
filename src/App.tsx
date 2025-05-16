import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from './store';
import theme from './utils/theme';
import Router from './Router';
import { store } from './store';
import { fetchQuestionsFromFirebase } from './store/slices/questionSlice';

// Create a wrapper component to use Redux hooks
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Fetch questions when the app loads
    dispatch(fetchQuestionsFromFirebase());
  }, [dispatch]);

  return <Router />;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

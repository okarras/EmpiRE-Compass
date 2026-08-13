import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{ p: 4, bgcolor: '#fee', color: '#c00', borderRadius: 2, m: 2 }}
        >
          <Typography variant="h5" gutterBottom>
            Something went wrong.
          </Typography>
          <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 2 }}>
            {this.state.error?.toString()}
          </Typography>
          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              bgcolor: '#fff',
              p: 2,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
            >
              {this.state.errorInfo?.componentStack}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            sx={{ mt: 3 }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

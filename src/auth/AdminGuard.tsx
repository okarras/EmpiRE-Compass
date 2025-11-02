import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthData } from './useAuthData';
import {
  Box,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Typography,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard - Protects admin routes
 * Only allows access if user is authenticated AND is_admin === true
 */
const AdminGuard = ({ children }: AdminGuardProps) => {
  const { isAuthenticated, isLoading, user } = useAuthData();

  // Show loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress sx={{ color: '#e86161' }} />
      </Box>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/R186491/" replace />;
  }

  // Authenticated but not admin
  if (!user?.is_admin) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          px: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 600,
            textAlign: 'center',
            border: '2px solid',
            borderColor: 'error.light',
          }}
        >
          <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Access Denied</AlertTitle>
            You do not have permission to access this page.
          </Alert>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            This page is restricted to administrators only.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Logged in as: <strong>{user?.display_name || user?.email}</strong>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1 }}
          >
            If you believe you should have access, please contact the system
            administrator.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // User is admin - render protected content
  return <>{children}</>;
};

export default AdminGuard;

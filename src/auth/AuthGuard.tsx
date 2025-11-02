import React from 'react';
import { useAuthData } from './useAuthData';
import { CircularProgress, Box, Typography } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading } = useAuthData();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          gap={2}
        >
          <Typography variant="h6" color="text.secondary">
            Authentication Required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please sign in to access this content.
          </Typography>
        </Box>
      )
    );
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
};

export default AuthGuard;

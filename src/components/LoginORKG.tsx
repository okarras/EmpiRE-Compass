import { useState, useEffect } from 'react';
import {
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Chip,
  Box,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Fade,
} from '@mui/material';
import { Login, Logout, CheckCircle, Refresh } from '@mui/icons-material';
import { useAuthData } from '../auth/useAuthData';

export default function LoginORKG() {
  const { isAuthenticated, isLoading, user, login, logout, error } =
    useAuthData();
  const [timedOut, setTimedOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showError, setShowError] = useState(false);
  const [hasShownSuccess, setHasShownSuccess] = useState(false);

  // If silent SSO can't finish (cookies/CSP), show manual button after 2.5s.
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(id);
  }, []);

  // Show success message ONCE when user first authenticates
  useEffect(() => {
    if (isAuthenticated && user && !hasShownSuccess) {
      setShowSuccess(true);
      setIsLoggingIn(false);
      setShowError(false);
      setHasShownSuccess(true); // Mark as shown
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, hasShownSuccess]);

  // Handle error display
  useEffect(() => {
    if (error) {
      setShowError(true);
      setIsLoggingIn(false);
    }
  }, [error]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setShowError(false);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    setHasShownSuccess(false); // Reset so success shows again on next login
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRetry = () => {
    setShowError(false);
    handleLogin();
  };

  // Show loading state during initialization
  if (isLoading && !timedOut) {
    return (
      <Fade in={true}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} thickness={4} />
        </Stack>
      </Fade>
    );
  }

  // Show login button if not authenticated or initialization timed out
  if (!isAuthenticated) {
    return (
      <Fade in={true}>
        <Box>
          {showError && (
            <Snackbar
              open={showError}
              autoHideDuration={6000}
              onClose={() => setShowError(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                severity="error"
                onClose={() => setShowError(false)}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRetry}
                    startIcon={<Refresh />}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </Snackbar>
          )}

          <Button
            variant="outlined"
            size="small"
            onClick={handleLogin}
            disabled={isLoggingIn}
            startIcon={
              isLoggingIn ? (
                <CircularProgress size={14} thickness={4} />
              ) : (
                <Login sx={{ fontSize: '1rem' }} />
              )
            }
            sx={{
              borderRadius: 1.5,
              py: 0.75,
              px: 1.5,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.875rem',
              minWidth: 'auto',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: '#e86161',
                backgroundColor: 'rgba(232, 97, 97, 0.04)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>
      </Fade>
    );
  }

  // User is authenticated - show user info with dropdown menu
  const displayName = user?.display_name || user?.email || 'User';
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Fade in={true}>
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* User Avatar */}
          <Tooltip title={`Signed in as ${displayName}`} arrow>
            <Chip
              avatar={
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                >
                  {userInitials}
                </Avatar>
              }
              label={
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, maxWidth: 120 }}
                >
                  {displayName.length > 15
                    ? `${displayName.slice(0, 15)}...`
                    : displayName}
                </Typography>
              }
              onClick={handleMenuOpen}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            />
          </Tooltip>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: 3,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Account
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 32,
                    height: 32,
                    fontSize: '0.75rem',
                  }}
                >
                  {userInitials}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {displayName}
                  </Typography>
                  {user?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            <Divider />

            <MenuItem
              onClick={handleLogout}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                },
              }}
            >
              <Logout sx={{ mr: 1.5, fontSize: 20 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Stack>

        {/* Success notification */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            icon={<CheckCircle />}
            onClose={() => setShowSuccess(false)}
            sx={{ borderRadius: 2 }}
          >
            Successfully signed in!
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
}

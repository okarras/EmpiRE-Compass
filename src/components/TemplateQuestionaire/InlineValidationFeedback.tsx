import React from 'react';
import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface InlineValidationFeedbackProps {
  error?: string | null;
  warning?: string | null;
  success?: string | null;
}

const InlineValidationFeedback: React.FC<InlineValidationFeedbackProps> = ({
  error,
  warning,
  success,
}) => {
  if (!error && !warning && !success) {
    return null;
  }

  const message = error || warning || success;
  const type = error ? 'error' : warning ? 'warning' : 'success';

  const getColor = () => {
    switch (type) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'success':
        return 'success.main';
      default:
        return 'text.secondary';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'error.lighter';
      case 'warning':
        return 'warning.lighter';
      case 'success':
        return 'success.lighter';
      default:
        return 'grey.100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <ErrorOutlineIcon fontSize="small" />;
      case 'warning':
        return <WarningAmberIcon fontSize="small" />;
      case 'success':
        return <CheckCircleOutlineIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        mt: 0.5,
        p: 1,
        borderRadius: 1,
        backgroundColor: getBackgroundColor(),
        border: 1,
        borderColor: getColor(),
      }}
      role="alert"
      aria-live="polite"
    >
      <Box
        sx={{
          color: getColor(),
          display: 'flex',
          alignItems: 'center',
          mt: 0.25,
        }}
      >
        {getIcon()}
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: getColor(),
          flex: 1,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default InlineValidationFeedback;

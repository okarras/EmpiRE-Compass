import React, { useState } from 'react';
import { IconButton, Tooltip, Badge } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import AIConfigurationDialog from './AIConfigurationDialog';

const AIConfigurationButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isConfigured } = useAppSelector((state) => state.ai);

  // Check if settings are loaded from localStorage
  const hasStoredSettings = () => {
    try {
      return localStorage.getItem('ai-configuration') !== null;
    } catch {
      return false;
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip
        title={
          isConfigured
            ? `AI Configuration${hasStoredSettings() ? ' (Saved in Browser)' : ''}`
            : 'Configure AI (Required)'
        }
      >
        <IconButton
          onClick={handleOpenDialog}
          sx={{
            color: isConfigured ? 'text.secondary' : '#e86161',
            '&:hover': {
              backgroundColor: 'rgba(232, 97, 97, 0.08)',
            },
          }}
        >
          <Badge
            variant="dot"
            color={isConfigured ? 'default' : 'error'}
            invisible={isConfigured}
          >
            <Settings />
          </Badge>
        </IconButton>
      </Tooltip>

      <AIConfigurationDialog open={dialogOpen} onClose={handleCloseDialog} />
    </>
  );
};

export default AIConfigurationButton;

import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import BackupService from '../services/BackupService';
import { useBackupChange } from '../hooks/useBackupChange';
import CloudOffIcon from '@mui/icons-material/CloudOff';

/**
 * Banner component that shows a warning when backup mode is active
 */
const BackupWarningBanner = () => {
  const [isUsingBackup, setIsUsingBackup] = useState(false);
  const [backupName, setBackupName] = useState<string>('');
  const backupVersion = useBackupChange(); // Listen for backup changes

  useEffect(() => {
    const checkBackup = () => {
      const usingBackup = BackupService.isExplicitlyUsingBackup();
      setIsUsingBackup(usingBackup);
      if (usingBackup) {
        setBackupName(BackupService.getCurrentBackupName() || 'uploaded file');
      } else {
        setBackupName('');
      }
    };

    checkBackup();
    // Also check periodically
    const interval = setInterval(checkBackup, 2000);
    return () => clearInterval(interval);
  }, [backupVersion]);

  if (!isUsingBackup) {
    return null;
  }

  const handleSwitchToLive = () => {
    BackupService.clearBackupSelection();
    window.location.reload(); // Reload to ensure clean state
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100, // Below header but above content
        width: '100%',
      }}
    >
      <Alert
        severity="warning"
        sx={{
          borderRadius: 0,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<CloudOffIcon />}
            onClick={handleSwitchToLive}
          >
            Switch to Live
          </Button>
        }
      >
        <AlertTitle>Backup Mode Active</AlertTitle>
        You are currently using backup data ({backupName}). Some features may be
        limited. Live data is not available when using backups.
      </Alert>
    </Box>
  );
};

export default BackupWarningBanner;

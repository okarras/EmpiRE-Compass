import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Paper,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import BackupService, { BackupData } from '../services/BackupService';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { fetchQuestionsFromFirebase } from '../store/slices/questionSlice';
import { AppDispatch } from '../store';
import { Alert, AlertTitle } from '@mui/material';

interface BackupSelectorProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
}

const BackupSelector: React.FC<BackupSelectorProps> = ({
  open,
  onClose,
  templateId,
}) => {
  const [availableBackups, setAvailableBackups] = useState<string[]>([]);
  const [currentBackup, setCurrentBackup] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (open) {
      setAvailableBackups(BackupService.getAvailableBackups());
      setCurrentBackup(BackupService.getCurrentBackupName());
    }
  }, [open]);

  const handleSelectBackup = async (filename: string) => {
    try {
      await BackupService.loadBackupFile(filename);
      setCurrentBackup(filename);
      toast.success(`Loaded backup: ${filename}`);
      toast('You are now using backup data. Some features may be limited.', {
        duration: 5000,
        icon: '⚠️',
      });

      // Refresh questions in Redux store
      const currentTemplateId = templateId || 'R186491';
      await dispatch(fetchQuestionsFromFirebase(currentTemplateId));

      // Close dialog - components will refresh automatically via event listener
      onClose();
    } catch (error: unknown) {
      console.error('Error loading backup:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load backup file';
      toast.error(errorMessage);
    }
  };

  const handleClearBackup = async () => {
    try {
      BackupService.clearBackupSelection();
      setCurrentBackup('');
      toast.success('Switched to live data');

      // Refresh questions in Redux store
      const currentTemplateId = templateId || 'R186491';
      await dispatch(fetchQuestionsFromFirebase(currentTemplateId));

      // Close dialog - components will refresh automatically via event listener
      onClose();
    } catch (error) {
      console.error('Error clearing backup:', error);
      toast.error('Failed to switch to live data');
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        const data = (json.data || json) as BackupData;

        // Clear all existing data and caches before setting new data
        BackupService.setData(data);
        setCurrentBackup(file.name);
        // Set a marker in localStorage to indicate we are using an uploaded file
        localStorage.setItem('EMPIRE_BACKUP_FILENAME', 'UPLOADED_FILE');
        // Note: We no longer clear LIVE_MODE_KEY - users can switch between live and backup freely

        // Emit backup change event manually since setData doesn't emit it
        window.dispatchEvent(new CustomEvent('backup-changed'));

        toast.success(`Loaded uploaded file: ${file.name}`);
        toast('You are now using backup data. Some features may be limited.', {
          duration: 5000,
          icon: '⚠️',
        });

        // Refresh questions in Redux store
        const currentTemplateId = templateId || 'R186491';
        await dispatch(fetchQuestionsFromFirebase(currentTemplateId));

        // Close dialog - components will refresh automatically via event listener
        onClose();
      } catch (error) {
        console.error('Error parsing uploaded file:', error);
        toast.error('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        handleFileUpload(file);
      } else {
        toast.error('Please upload a JSON file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isUsingBackup =
    BackupService.isExplicitlyUsingBackup() || !!currentBackup;
  const isLiveModeEnabled = BackupService.isLiveModeEnabled();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Data Source</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          EmpiRE-Compass can load its data either from the live Firebase
          database or from JSON backup files. This dialog lets you switch to a
          specific backup snapshot (from the built-in backups folder or an
          uploaded file) for reproducible analyses, demos, or when live data is
          not available. When backup mode is active, the application reads data
          only from the selected backup, and some write or admin features may be
          limited.
        </Typography>

        {isUsingBackup && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Backup Mode Active</AlertTitle>
            You are currently using backup data (
            {currentBackup || 'uploaded file'}). Some features may be limited.
          </Alert>
        )}

        {isLiveModeEnabled && !isUsingBackup && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Live Mode Active</AlertTitle>
            You are currently using live data. You can switch to backup mode at
            any time.
          </Alert>
        )}

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudOffIcon />}
            onClick={handleClearBackup}
            disabled={
              !currentBackup && !BackupService.isExplicitlyUsingBackup()
            }
          >
            Use Live Data
          </Button>
        </Box>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Available Backups
        </Typography>
        <Paper
          variant="outlined"
          sx={{ maxHeight: 200, overflow: 'auto', mb: 3 }}
        >
          <List dense>
            {availableBackups.map((filename) => (
              <ListItem key={filename} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectBackup(filename)}
                  selected={filename === currentBackup}
                >
                  <ListItemIcon>
                    {filename === currentBackup ? (
                      <CheckCircleIcon color="primary" />
                    ) : (
                      <InsertDriveFileIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={filename}
                    primaryTypographyProps={{
                      noWrap: true,
                      variant: 'body2',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {availableBackups.length === 0 && (
              <ListItem>
                <ListItemText primary="No backup files found in backups/" />
              </ListItem>
            )}
          </List>
        </Paper>

        <Divider sx={{ mb: 2 }}>OR</Divider>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('backup-file-input')?.click()}
        >
          <CloudUploadIcon
            sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }}
          />
          <Typography variant="body1" gutterBottom>
            Drag and drop a JSON file here
          </Typography>
          <Typography variant="caption" color="text.secondary">
            or click to browse
          </Typography>
          <input
            type="file"
            id="backup-file-input"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackupSelector;

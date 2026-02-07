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
import BackupService, { BackupData } from '../services/BackupService';
import { toast } from 'react-hot-toast';

interface BackupSelectorProps {
  open: boolean;
  onClose: () => void;
}

const BackupSelector: React.FC<BackupSelectorProps> = ({ open, onClose }) => {
  const [availableBackups, setAvailableBackups] = useState<string[]>([]);
  const [currentBackup, setCurrentBackup] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

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
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error loading backup:', error);
      toast.error('Failed to load backup file');
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        const data = (json.data || json) as BackupData;

        BackupService.setData(data);
        setCurrentBackup(file.name);
        toast.success(`Loaded uploaded file: ${file.name}`);
        // Reload page to reflect changes
        window.location.reload();
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Data Source</DialogTitle>
      <DialogContent>
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

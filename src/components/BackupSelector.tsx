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
  TextField,
  IconButton,
  Tooltip,
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
import { apiRequest } from '../services/backendApi';
import { useAuth } from '../auth/useAuth';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

interface BackupSelectorProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
}

interface BackupMetadata {
  fileName: string;
  displayName: string;
  description?: string;
  includesQuestions?: boolean;
  includesStatistics?: boolean;
  includesHomeContent?: boolean;
  includesUsers?: boolean;
  includesNews?: boolean;
  includesPapers?: boolean;
}

const BackupSelector: React.FC<BackupSelectorProps> = ({
  open,
  onClose,
  templateId,
}) => {
  const [availableBackups, setAvailableBackups] = useState<string[]>([]);
  const [currentBackup, setCurrentBackup] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [metadataByFile, setMetadataByFile] = useState<
    Record<string, BackupMetadata>
  >({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [savingForFile, setSavingForFile] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    if (open) {
      const backups = BackupService.getAvailableBackups();
      setAvailableBackups(backups);
      setCurrentBackup(BackupService.getCurrentBackupName());
      const loadMetadata = async () => {
        try {
          setIsLoadingMetadata(true);
          const params =
            backups.length > 0
              ? `?files=${encodeURIComponent(backups.join(','))}`
              : '';
          const json = await apiRequest<{
            success: boolean;
            items?: BackupMetadata[];
            error?: string;
          }>(`/api/backup/metadata${params}`);
          if (!json.success || !json.items) {
            return;
          }
          const map: Record<string, BackupMetadata> = {};
          json.items.forEach((item) => {
            map[item.fileName] = {
              fileName: item.fileName,
              displayName: item.displayName || item.fileName,
              description: item.description,
              includesQuestions: item.includesQuestions,
              includesStatistics: item.includesStatistics,
              includesHomeContent: item.includesHomeContent,
              includesUsers: item.includesUsers,
              includesNews: item.includesNews,
              includesPapers: item.includesPapers,
            };
          });
          setMetadataByFile(map);
        } catch (error) {
          console.error('Failed to load backup metadata:', error);
        } finally {
          setIsLoadingMetadata(false);
        }
      };
      loadMetadata();
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

  const getDisplayNameForBackup = (filename: string) => {
    const meta = metadataByFile[filename];
    return meta?.displayName || filename;
  };

  const currentEditingMeta =
    editingFile && metadataByFile[editingFile]
      ? metadataByFile[editingFile]
      : editingFile
        ? { fileName: editingFile, displayName: editingFile, description: '' }
        : null;

  const handleAdminFieldChange = (
    filename: string,
    changes: Partial<BackupMetadata>
  ) => {
    setMetadataByFile((prev) => ({
      ...prev,
      [filename]: {
        ...(prev[filename] || {
          fileName: filename,
          displayName: filename,
        }),
        ...changes,
      },
    }));
  };

  const handleSaveMetadata = async (filename: string) => {
    const meta = metadataByFile[filename];
    if (!meta) return;
    try {
      setSavingForFile(filename);
      await apiRequest(`/api/backup/metadata/${encodeURIComponent(filename)}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: meta.displayName,
          description: meta.description,
          includesQuestions: meta.includesQuestions,
          includesStatistics: meta.includesStatistics,
          includesHomeContent: meta.includesHomeContent,
          includesUsers: meta.includesUsers,
          includesNews: meta.includesNews,
          includesPapers: meta.includesPapers,
        }),
        requiresAdmin: true,
      });
      toast.success('Backup metadata saved');
    } catch (error) {
      console.error('Failed to save backup metadata:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save metadata'
      );
    } finally {
      setSavingForFile((current) => (current === filename ? null : current));
    }
  };

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
          {isLoadingMetadata && ' (loading metadata...)'}
        </Typography>
        <Paper
          variant="outlined"
          sx={{ maxHeight: 240, overflow: 'auto', mb: 2 }}
        >
          <List dense>
            {availableBackups.map((filename) => (
              <ListItem key={filename} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectBackup(filename)}
                  selected={filename === currentBackup}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1.5,
                  }}
                >
                  <ListItemIcon sx={{ mt: 0.5 }}>
                    {filename === currentBackup ? (
                      <CheckCircleIcon color="primary" />
                    ) : (
                      <InsertDriveFileIcon />
                    )}
                  </ListItemIcon>
                  <Box sx={{ flex: 1, minWidth: 0, pr: isAdmin ? 1 : 0 }}>
                    <ListItemText
                      primary={getDisplayNameForBackup(filename)}
                      secondaryTypographyProps={{ variant: 'caption' }}
                      secondary={
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {filename}
                          </Typography>
                          {metadataByFile[filename]?.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {metadataByFile[filename]?.description}
                            </Typography>
                          )}
                        </Box>
                      }
                      primaryTypographyProps={{
                        noWrap: true,
                        variant: 'body2',
                      }}
                    />

                    {isAdmin && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                      >
                        <Tooltip title="Edit metadata">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFile(filename);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
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

        {isAdmin && currentEditingMeta && (
          <Box
            sx={{
              mb: 3,
              mt: 1,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.default',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Edit backup metadata
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: 'monospace', display: 'block', mb: 1 }}
            >
              {currentEditingMeta.fileName}
            </Typography>
            <TextField
              label="Display name"
              fullWidth
              size="small"
              margin="dense"
              value={currentEditingMeta.displayName}
              onChange={(e) =>
                handleAdminFieldChange(currentEditingMeta.fileName, {
                  displayName: e.target.value || currentEditingMeta.fileName,
                })
              }
            />
            <TextField
              label="Description (what is included / not included)"
              fullWidth
              size="small"
              margin="dense"
              multiline
              minRows={2}
              value={currentEditingMeta.description || ''}
              onChange={(e) =>
                handleAdminFieldChange(currentEditingMeta.fileName, {
                  description: e.target.value,
                })
              }
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                mt: 1,
              }}
            >
              <Button
                size="small"
                onClick={() => setEditingFile(null)}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={savingForFile === currentEditingMeta.fileName}
                onClick={() => handleSaveMetadata(currentEditingMeta.fileName)}
                sx={{ textTransform: 'none' }}
              >
                Save
              </Button>
            </Box>
          </Box>
        )}

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

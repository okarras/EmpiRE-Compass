import { useRef, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Download,
  CloudDownload,
  CloudUpload,
  Storage,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Upload,
} from '@mui/icons-material';
import FirebaseBackup, {
  BackupResult,
  BackupProgress,
} from '../firestore/FirebaseBackup';
import FirebaseRestore, {
  RestoreResult,
  RestoreProgress,
} from '../firestore/FirebaseRestore';
import { getKeycloakToken } from '../auth/keycloakStore';

const AdminBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(
    null
  );
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] =
    useState<RestoreProgress | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(
    null
  );
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<
    { collection: string; documentCount: number }[] | null
  >(null);

  const handleBackupAll = async () => {
    setIsBackingUp(true);
    setError(null);
    setBackupResult(null);
    setBackupProgress(null);

    try {
      const result = await FirebaseBackup.backupAllCollections(
        (progress: BackupProgress) => {
          setBackupProgress(progress);
        }
      );

      setBackupResult(result);

      if (result.success && result.data) {
        // Automatically download the backup
        FirebaseBackup.downloadBackupWithMetadata(result);
      } else {
        setError(result.error || 'Backup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsBackingUp(false);
      setBackupProgress(null);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const backupData = FirebaseRestore.parseBackupFile(content);
        setBackupPreview(FirebaseRestore.getBackupPreview(backupData));
        setSelectedFile(file);
      } catch (err) {
        setRestoreError(
          err instanceof Error ? err.message : 'Invalid backup file'
        );
        setSelectedFile(null);
        setBackupPreview(null);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreResult(null);
    setRestoreProgress(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const useBackend = Boolean(backendUrl);

    try {
      if (useBackend) {
        // Restore via backend (Firebase Admin SDK bypasses security rules)
        const content = await selectedFile.text();
        const token = getKeycloakToken();
        if (!token) {
          setRestoreError('You must be logged in to restore.');
          setRestoreResult({
            success: false,
            error: 'Authentication required',
          });
          return;
        }
        setRestoreProgress({
          currentCollection: 'Sending to backend...',
          collectionsProcessed: 0,
          totalCollections: 0,
          documentsProcessed: 0,
          totalDocuments: 0,
        });
        const response = await fetch(`${backendUrl}/api/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${token}`,
          },
          body: content,
        });
        const result: RestoreResult = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        setRestoreResult(result);
        if (!result.success) {
          setRestoreError(result.error || 'Restore failed');
        }
      } else {
        // Restore via client (subject to Firestore rules)
        const result = await FirebaseRestore.restoreFromFile(
          selectedFile,
          (progress: RestoreProgress) => setRestoreProgress(progress)
        );
        setRestoreResult(result);
        if (!result.success) {
          setRestoreError(result.error || 'Restore failed');
        }
      }
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
      setRestoreResult({ success: false, error: 'Restore failed' });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(null);
    }
  };

  const handleClearRestore = () => {
    setSelectedFile(null);
    setBackupPreview(null);
    setRestoreError(null);
    setRestoreResult(null);
  };

  const handleBackupSingleCollection = async (collectionName: string) => {
    setIsBackingUp(true);
    setError(null);

    try {
      const result =
        await FirebaseBackup.backupSingleCollection(collectionName);

      if (result.success && result.data) {
        FirebaseBackup.downloadBackupAsJSON(
          result.data,
          `${collectionName}-backup-${new Date().toISOString().split('T')[0]}.json`
        );
        setBackupResult(result);
      } else {
        setError(result.error || 'Backup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsBackingUp(false);
    }
  };

  const progressPercentage = backupProgress
    ? Math.round(
        (backupProgress.collectionsProcessed /
          backupProgress.totalCollections) *
          100
      )
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: '#e86161', mb: 1 }}
        >
          Firebase Backup Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Backup and export your Firebase collections as JSON files, or restore
          from a backup to another Firebase database
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Admin Access Required</AlertTitle>
        Backup all Firebase collections to JSON, or upload a backup file to
        restore collections to the currently connected Firebase database. To
        restore to a different database, configure your .env to point to the
        target Firebase project before restoring.
      </Alert>

      {/* Main Backup Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CloudDownload sx={{ fontSize: 40, color: '#e86161', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Backup All Collections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download a complete backup of all Firebase collections
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<Download />}
          onClick={handleBackupAll}
          disabled={isBackingUp}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d55555',
            },
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
          }}
        >
          {isBackingUp ? 'Backing Up...' : 'Backup All Collections'}
        </Button>
      </Paper>

      {/* Progress Section */}
      {isBackingUp && backupProgress && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Backup in Progress...
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Processing: {backupProgress.currentCollection}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {backupProgress.collectionsProcessed} /{' '}
                {backupProgress.totalCollections} collections
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#e86161',
                },
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Documents processed: {backupProgress.documentsProcessed}
          </Typography>
        </Paper>
      )}

      {/* Error Section */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Backup Failed</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Success Section */}
      {backupResult && backupResult.success && (
        <>
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            icon={<CheckCircle fontSize="large" />}
          >
            <AlertTitle>Backup Completed Successfully!</AlertTitle>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Chip
                  label={`${backupResult.collectionsCount} Collections`}
                  color="success"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip
                  label={`${backupResult.documentsCount} Documents`}
                  color="success"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip
                  label={new Date(
                    backupResult.timestamp || ''
                  ).toLocaleString()}
                  color="success"
                  size="small"
                />
              </Grid>
            </Grid>
          </Alert>

          {/* Warning if some collections were skipped */}
          {backupResult.error && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>Partial Backup</AlertTitle>
              {backupResult.error}
            </Alert>
          )}
        </>
      )}

      {/* Individual Collections */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Storage sx={{ fontSize: 32, color: '#e86161', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Individual Collection Backups
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Backup a specific collection
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List>
          {FirebaseBackup.COLLECTIONS_TO_BACKUP.map((collection, index) => (
            <ListItem
              key={collection}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <Info sx={{ color: '#e86161' }} />
              </ListItemIcon>
              <ListItemText
                primary={collection}
                secondary={`Collection #${index + 1}`}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download />}
                onClick={() => handleBackupSingleCollection(collection)}
                disabled={isBackingUp}
                sx={{
                  textTransform: 'none',
                  borderColor: '#e86161',
                  color: '#e86161',
                  '&:hover': {
                    borderColor: '#d55555',
                    backgroundColor: 'rgba(232, 97, 97, 0.08)',
                  },
                }}
              >
                Backup
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Restore / Import Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CloudUpload sx={{ fontSize: 32, color: '#e86161', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Restore / Import to Firebase
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a backup JSON file to restore collections to the connected
              Firebase database
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring || isBackingUp}
            sx={{
              textTransform: 'none',
              borderColor: '#e86161',
              color: '#e86161',
              '&:hover': {
                borderColor: '#d55555',
                backgroundColor: 'rgba(232, 97, 97, 0.08)',
              },
            }}
          >
            Choose Backup File
          </Button>
          {selectedFile && (
            <>
              <Typography variant="body2" color="text.secondary">
                {selectedFile.name}
              </Typography>
              <Button
                size="small"
                onClick={handleClearRestore}
                disabled={isRestoring}
                sx={{ textTransform: 'none' }}
              >
                Clear
              </Button>
            </>
          )}
        </Box>

        {backupPreview && backupPreview.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Preview: Collections to restore
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {backupPreview.map(({ collection, documentCount }) => (
                <Chip
                  key={collection}
                  label={`${collection}: ${documentCount} docs`}
                  size="small"
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {selectedFile && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Restoring will overwrite existing documents in matching collections.
            The connected Firebase is:{' '}
            {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'not configured'}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<CloudUpload />}
          onClick={handleRestore}
          disabled={!selectedFile || isRestoring}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d55555',
            },
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
          }}
        >
          {isRestoring ? 'Restoring...' : 'Restore to Firebase'}
        </Button>

        {isRestoring && restoreProgress && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Restoring: {restoreProgress.currentCollection} (
              {restoreProgress.documentsProcessed} /
              {restoreProgress.totalDocuments} documents)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                restoreProgress.totalDocuments > 0
                  ? Math.round(
                      (restoreProgress.documentsProcessed /
                        restoreProgress.totalDocuments) *
                        100
                    )
                  : 0
              }
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(232, 97, 97, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#e86161',
                },
              }}
            />
          </Box>
        )}

        {restoreError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Restore Failed</AlertTitle>
            {restoreError}
          </Alert>
        )}

        {restoreResult && restoreResult.success && (
          <Alert
            severity="success"
            sx={{ mt: 2 }}
            icon={<CheckCircle fontSize="large" />}
          >
            <AlertTitle>Restore Completed Successfully!</AlertTitle>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Chip
                  label={`${restoreResult.collectionsRestored} Collections`}
                  color="success"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Chip
                  label={`${restoreResult.documentsRestored} Documents`}
                  color="success"
                  size="small"
                />
              </Grid>
            </Grid>
          </Alert>
        )}
      </Paper>

      {/* Instructions Card */}
      <Card sx={{ mt: 3, backgroundColor: 'rgba(232, 97, 97, 0.05)' }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, mb: 2, color: '#e86161' }}
          >
            📋 Backup Instructions
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircle sx={{ color: '#e86161', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Full Backup"
                secondary="Click 'Backup All Collections' to download all data as a single JSON file"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle sx={{ color: '#e86161', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Individual Backup"
                secondary="Click the 'Backup' button next to any collection to download only that collection"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle sx={{ color: '#e86161', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="File Storage"
                secondary="Store backup files securely and include dates in filenames for version control"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle sx={{ color: '#e86161', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Restore / Import"
                secondary="Upload a backup JSON file (same format as export) to restore all collections to the connected Firebase"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ErrorIcon sx={{ color: '#e86161', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary="Important"
                secondary="Keep your backup files secure as they contain all your database data"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminBackup;

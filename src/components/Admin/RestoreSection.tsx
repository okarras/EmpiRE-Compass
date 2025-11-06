import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Chip,
} from '@mui/material';
import { CloudUpload, Storage, Upload } from '@mui/icons-material';
import { RestoreProgress } from '../../firestore/RestoreFromBackup';

interface RestoreSectionProps {
  hasData: boolean;
  restoring: boolean;
  restoreProgress: RestoreProgress | null;
  onRestoreFromBackup: (file: File) => void;
}

const RestoreSection = ({
  hasData,
  restoring,
  restoreProgress,
  onRestoreFromBackup,
}: RestoreSectionProps) => {
  if (hasData) {
    return (
      <Alert severity="success" sx={{ mb: 3 }}>
        <AlertTitle>Database Ready!</AlertTitle>
        Your Firebase database has been populated with templates, questions, and
        statistics. You can now manage your data below.
      </Alert>
    );
  }

  return (
    <>
      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>Database is Empty - Restore Required</AlertTitle>
        Your Firebase database is empty. Upload your backup file below to
        populate it with the new nested structure.
      </Alert>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CloudUpload sx={{ fontSize: 48, color: '#e86161', mr: 2 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Restore from Backup File
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your backup JSON file to populate Firebase with the new
              nested structure
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: restoring ? '#e86161' : 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: restoring
              ? 'rgba(232, 97, 97, 0.05)'
              : 'transparent',
          }}
        >
          <Storage sx={{ fontSize: 64, color: '#e86161', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            {restoring ? 'Restoring Data...' : 'Upload Backup File'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select your firebase-backup-*.json file
          </Typography>

          <Button
            variant="contained"
            component="label"
            startIcon={<Upload />}
            disabled={restoring}
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d55555' },
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
            }}
          >
            {restoring ? 'Restoring...' : 'Select Backup File'}
            <input
              type="file"
              hidden
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onRestoreFromBackup(file);
                }
              }}
            />
          </Button>
        </Box>

        {restoreProgress && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {restoreProgress.currentStep}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`Templates: ${restoreProgress.templatesProcessed}`}
                size="small"
                color="primary"
              />
              <Chip
                label={`Questions: ${restoreProgress.questionsProcessed}`}
                size="small"
                color="primary"
              />
              <Chip
                label={`Statistics: ${restoreProgress.statisticsProcessed}`}
                size="small"
                color="primary"
              />
              <Chip
                label={`Users: ${restoreProgress.usersProcessed}`}
                size="small"
                color="primary"
              />
            </Box>
          </Box>
        )}
      </Paper>
    </>
  );
};

export default RestoreSection;

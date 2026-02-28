import {
  Box,
  Typography,
  Button,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  Alert,
  Paper,
} from '@mui/material';
import { Refresh, Science } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useKeycloak } from '@react-keycloak/web';
import {
  updateOrkgStatisticsStream,
  type StatisticsStreamEvent,
} from '../../services/backendApi';

type TemplateKey = 'empire' | 'nlp4re';

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  empire: 'KG-EmpiRE',
  nlp4re: 'NLP4RE',
};

const StatisticsUpdateSection = () => {
  const { user } = useAuth();
  const { keycloak } = useKeycloak();
  const [updating, setUpdating] = useState<TemplateKey | null>(null);
  const [progress, setProgress] = useState<{
    totalPapers: number;
    processedCount: number;
    currentPaper?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resume, setResume] = useState(true);

  const handleUpdate = useCallback(
    async (template: TemplateKey) => {
      if (!user?.id || !user?.email) {
        setError('You must be logged in to update statistics');
        return;
      }

      setError(null);
      setSuccess(null);
      setUpdating(template);
      setProgress(null);

      const onEvent = (event: StatisticsStreamEvent) => {
        if (event.type === 'progress') {
          setProgress({
            totalPapers: event.totalPapers,
            processedCount: event.processedCount,
            currentPaper: event.currentPaper,
          });
        } else if (event.type === 'complete') {
          setUpdating(null);
          setProgress(null);
          if (event.success) {
            setSuccess(
              `${TEMPLATE_LABELS[template]} statistics updated successfully`
            );
          } else {
            setError(event.error || 'Update failed');
          }
        } else if (event.type === 'error') {
          setUpdating(null);
          setProgress(null);
          setError(event.error);
        }
      };

      try {
        await updateOrkgStatisticsStream(
          template,
          {
            updateFirebase: true,
            resume,
          },
          onEvent,
          user.id,
          user.email,
          keycloak?.token
        );
      } catch (err) {
        setUpdating(null);
        setProgress(null);
        setError(err instanceof Error ? err.message : 'Update failed');
      }
    },
    [user, keycloak?.token, resume]
  );

  const progressPercent =
    progress && progress.totalPapers > 0
      ? Math.round((progress.processedCount / progress.totalPapers) * 100)
      : 0;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mt: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Science sx={{ color: '#e86161' }} />
        ORKG Statistics Update
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Fetch papers from ORKG, compute RPL metrics, and update Firebase.
        Progress is saved so you can refresh and resume without starting over.
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={resume}
            onChange={(e) => setResume(e.target.checked)}
            disabled={!!updating}
          />
        }
        label="Resume from saved progress (skip already processed papers)"
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => handleUpdate('empire')}
          disabled={!!updating}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d55555' },
            textTransform: 'none',
          }}
        >
          {updating === 'empire' ? 'Updating...' : 'Update KG-EmpiRE'}
        </Button>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => handleUpdate('nlp4re')}
          disabled={!!updating}
          sx={{
            backgroundColor: '#e86161',
            '&:hover': { backgroundColor: '#d55555' },
            textTransform: 'none',
          }}
        >
          {updating === 'nlp4re' ? 'Updating...' : 'Update NLP4RE'}
        </Button>
      </Box>

      {updating && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Processing {TEMPLATE_LABELS[updating]} papers...
            {progress?.currentPaper && ` (${progress.currentPaper})`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {progress?.processedCount ?? 0} / {progress?.totalPapers ?? 0}{' '}
            papers ({progressPercent}%)
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mt: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}
    </Paper>
  );
};

export default StatisticsUpdateSection;

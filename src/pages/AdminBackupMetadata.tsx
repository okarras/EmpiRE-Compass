import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import { apiRequest } from '../services/backendApi';
import BackupService from '../services/BackupService';

type BackupMetadata = {
  fileName: string;
  displayName: string;
  description?: string;
  includesQuestions?: boolean;
  includesStatistics?: boolean;
  includesHomeContent?: boolean;
  includesUsers?: boolean;
  includesNews?: boolean;
  includesPapers?: boolean;
};

type ApiListResponse = {
  success: boolean;
  items?: BackupMetadata[];
  error?: string;
};

type ApiUpdateResponse = {
  success: boolean;
  item?: BackupMetadata;
  error?: string;
};

type EditableRow = BackupMetadata & {
  isSaving?: boolean;
  hasChanges?: boolean;
  error?: string | null;
};

const AdminBackupMetadata = () => {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const loadMetadata = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const files = BackupService.getAvailableBackups();
      const params =
        files.length > 0 ? `?files=${encodeURIComponent(files.join(','))}` : '';
      const data = await apiRequest<ApiListResponse>(
        `/api/backup/metadata${params}`,
        {
          requiresAdmin: true,
        }
      );

      if (!data.success || !data.items) {
        setGlobalError(data.error || 'Failed to load metadata');
        setRows([]);
        return;
      }

      const fileSet = new Set(files);
      const merged: EditableRow[] = [
        ...files.map((f) => {
          const existing = data.items?.find((i) => i.fileName === f);
          return {
            fileName: f,
            displayName: existing?.displayName || f,
            description: existing?.description,
            includesQuestions: existing?.includesQuestions ?? false,
            includesStatistics: existing?.includesStatistics ?? false,
            includesHomeContent: existing?.includesHomeContent ?? false,
            includesUsers: existing?.includesUsers ?? false,
            includesNews: existing?.includesNews ?? false,
            includesPapers: existing?.includesPapers ?? false,
            isSaving: false,
            hasChanges: false,
            error: null,
          };
        }),
        // Also show any metadata docs that don't have a local file (e.g. old backups)
        ...data.items
          .filter((i) => !fileSet.has(i.fileName))
          .map((i) => ({
            fileName: i.fileName,
            displayName: i.displayName || i.fileName,
            description: i.description,
            includesQuestions: i.includesQuestions ?? false,
            includesStatistics: i.includesStatistics ?? false,
            includesHomeContent: i.includesHomeContent ?? false,
            includesUsers: i.includesUsers ?? false,
            includesNews: i.includesNews ?? false,
            includesPapers: i.includesPapers ?? false,
            isSaving: false,
            hasChanges: false,
            error: null,
          })),
      ];

      setRows(merged);
    } catch (error) {
      console.error('Failed to load backup metadata:', error);
      setGlobalError(
        error instanceof Error ? error.message : 'Failed to load metadata'
      );
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMetadata();
  }, []);

  const updateRow = (fileName: string, changes: Partial<EditableRow>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.fileName === fileName
          ? { ...row, ...changes, hasChanges: true, error: null }
          : row
      )
    );
  };

  const handleSave = async (row: EditableRow) => {
    setRows((prev) =>
      prev.map((r) =>
        r.fileName === row.fileName ? { ...r, isSaving: true, error: null } : r
      )
    );

    try {
      const body: Partial<BackupMetadata> = {
        displayName: row.displayName,
        description: row.description,
        includesQuestions: row.includesQuestions,
        includesStatistics: row.includesStatistics,
        includesHomeContent: row.includesHomeContent,
        includesUsers: row.includesUsers,
        includesNews: row.includesNews,
        includesPapers: row.includesPapers,
      };

      const data = await apiRequest<ApiUpdateResponse>(
        `/api/backup/metadata/${encodeURIComponent(row.fileName)}`,
        {
          method: 'PUT',
          body: JSON.stringify(body),
          requiresAdmin: true,
        }
      );

      if (!data.success || !data.item) {
        const errorMessage = data.error || 'Failed to save metadata';
        setRows((prev) =>
          prev.map((r) =>
            r.fileName === row.fileName
              ? { ...r, isSaving: false, error: errorMessage }
              : r
          )
        );
        return;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.fileName === row.fileName
            ? {
                ...r,
                displayName: data.item?.displayName || r.displayName,
                description: data.item?.description,
                includesQuestions: data.item?.includesQuestions ?? false,
                includesStatistics: data.item?.includesStatistics ?? false,
                includesHomeContent: data.item?.includesHomeContent ?? false,
                includesUsers: data.item?.includesUsers ?? false,
                includesNews: data.item?.includesNews ?? false,
                includesPapers: data.item?.includesPapers ?? false,
                isSaving: false,
                hasChanges: false,
                error: null,
              }
            : r
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      setRows((prev) =>
        prev.map((r) =>
          r.fileName === row.fileName
            ? { ...r, isSaving: false, error: message }
            : r
        )
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: '#e86161', mb: 1 }}
          >
            Backup Metadata Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Edit human‑readable names and coverage information for each bundled
            backup file used by EmpiRE‑Compass.
          </Typography>
        </Box>
        <Tooltip title="Reload from server">
          <span>
            <IconButton
              onClick={() => void loadMetadata()}
              disabled={isLoading}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>How this works</AlertTitle>
        Each row corresponds to a JSON backup file deployed with the app.
        Updates are stored in the <strong>BackupFiles</strong> collection in
        Firestore and immediately used across the UI (for example in the backup
        selector dialog).
      </Alert>

      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {globalError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Failed to load metadata</AlertTitle>
          {globalError}
        </Alert>
      )}

      {rows.map((row) => {
        const hasAnyIncludes =
          row.includesQuestions ||
          row.includesStatistics ||
          row.includesHomeContent ||
          row.includesUsers ||
          row.includesNews ||
          row.includesPapers;

        return (
          <Paper
            key={row.fileName}
            elevation={1}
            sx={{
              p: 2.5,
              mb: 2,
              border:
                row.hasChanges || row.error
                  ? '1px solid rgba(232, 97, 97, 0.5)'
                  : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  noWrap
                  sx={{ fontFamily: 'monospace' }}
                >
                  {row.fileName}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {row.hasChanges && (
                  <Chip
                    size="small"
                    color="warning"
                    label="Unsaved changes"
                    variant="outlined"
                  />
                )}
                <Tooltip title="Save changes">
                  <span>
                    <IconButton
                      color="primary"
                      disabled={row.isSaving || !row.hasChanges}
                      onClick={() => void handleSave(row)}
                    >
                      <SaveIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Display name"
                fullWidth
                value={row.displayName}
                onChange={(e) =>
                  updateRow(row.fileName, { displayName: e.target.value })
                }
                helperText="Shown in selectors instead of the raw filename."
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={row.description || ''}
                onChange={(e) =>
                  updateRow(row.fileName, { description: e.target.value })
                }
                helperText="Short explanation of what this snapshot represents, and any caveats."
              />

              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2">
                    Included data (for this backup)
                  </Typography>
                  <Tooltip title="Use these toggles to document which parts of the dataset are actually present in this JSON file.">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(row.includesQuestions)}
                        onChange={(e) =>
                          updateRow(row.fileName, {
                            includesQuestions: e.target.checked,
                          })
                        }
                        color="primary"
                      />
                    }
                    label="Questions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(row.includesStatistics)}
                        onChange={(e) =>
                          updateRow(row.fileName, {
                            includesStatistics: e.target.checked,
                          })
                        }
                        color="primary"
                      />
                    }
                    label="Statistics"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(row.includesHomeContent)}
                        onChange={(e) =>
                          updateRow(row.fileName, {
                            includesHomeContent: e.target.checked,
                          })
                        }
                        color="primary"
                      />
                    }
                    label="Home content"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(row.includesUsers)}
                        onChange={(e) =>
                          updateRow(row.fileName, {
                            includesUsers: e.target.checked,
                          })
                        }
                        color="primary"
                      />
                    }
                    label="Users"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(row.includesNews)}
                        onChange={(e) =>
                          updateRow(row.fileName, {
                            includesNews: e.target.checked,
                          })
                        }
                        color="primary"
                      />
                    }
                    label="News"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(row.includesPapers)}
                        onChange={(e) =>
                          updateRow(row.fileName, {
                            includesPapers: e.target.checked,
                          })
                        }
                        color="primary"
                      />
                    }
                    label="Papers"
                  />
                </Stack>

                {hasAnyIncludes ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      This will appear as an “Includes: …” summary in the UI.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Leave all toggles off if this backup doesn&apos;t contain
                      structured data for these collections.
                    </Typography>
                  </Box>
                )}
              </Box>

              {row.error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {row.error}
                </Alert>
              )}
            </Box>
          </Paper>
        );
      })}

      {!isLoading && rows.length === 0 && !globalError && (
        <Typography variant="body2" color="text.secondary">
          No backup metadata found yet. Open the backup source selector once to
          auto‑register current backup files, then refresh this page.
        </Typography>
      )}
    </Container>
  );
};

export default AdminBackupMetadata;

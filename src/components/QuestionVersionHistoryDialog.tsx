import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { History, Restore } from '@mui/icons-material';
import type {
  QuestionOverrideDocument,
  QuestionVersion,
} from '../firestore/CRUDStaticQuestionOverrides';

interface QuestionVersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  overrideData: QuestionOverrideDocument | null;
  onRestore: (versionId: string) => Promise<void>;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getVersionSummary(version: QuestionVersion): string[] {
  const parts: string[] = [];
  if (version.title) parts.push('Title');
  if (version.dataAnalysisInformation) {
    const dai = version.dataAnalysisInformation;
    if (dai.question) parts.push('Question');
    if (dai.questionExplanation) parts.push('Question explanation');
    if (dai.dataAnalysis) parts.push('Data analysis');
    if (dai.dataInterpretation) parts.push('Data interpretation');
    if (dai.requiredDataForAnalysis) parts.push('Required data');
  }
  if (version.chartSettings) parts.push('Chart settings');
  if (version.chartSettings2) parts.push('Chart settings 2');
  return parts;
}

const QuestionVersionHistoryDialog: React.FC<
  QuestionVersionHistoryDialogProps
> = ({ open, onClose, overrideData, onRestore }) => {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    setError(null);
    setRestoringId(versionId);
    try {
      await onRestore(versionId);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to restore version'
      );
    } finally {
      setRestoringId(null);
    }
  };

  const versions = overrideData?.versions ?? [];
  const latestVersionId = overrideData?.latestVersion?.versionId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History sx={{ color: '#e86161' }} />
          <Typography variant="h6">Version History</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          View and restore previous versions of this question&apos;s overrides
          (chart settings, interpretations, etc.).
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {versions.length === 0 ? (
          <Alert severity="info">No version history found.</Alert>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {versions.map((version, index) => {
              const isLatest = version.versionId === latestVersionId;
              const summary = getVersionSummary(version);
              return (
                <Paper
                  key={version.versionId}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 1,
                    borderLeft: isLatest
                      ? '3px solid #e86161'
                      : '3px solid transparent',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="subtitle2">
                          Version {versions.length - index}
                          {isLatest && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                ml: 1,
                                color: '#e86161',
                                fontWeight: 600,
                              }}
                            >
                              (Current)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(version.timestamp)}
                        {version.authorName && ` • ${version.authorName}`}
                      </Typography>
                      {version.changeDescription && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5 }}
                          color="text.secondary"
                        >
                          {version.changeDescription}
                        </Typography>
                      )}
                      {summary.length > 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 1,
                            display: 'block',
                            color: 'text.secondary',
                          }}
                        >
                          Changed: {summary.join(', ')}
                        </Typography>
                      )}
                    </Box>
                    {!isLatest && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={restoringId !== null}
                        onClick={() => handleRestore(version.versionId)}
                        startIcon={
                          restoringId === version.versionId ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <Restore />
                          )
                        }
                        sx={{
                          color: '#e86161',
                          borderColor: '#e86161',
                          '&:hover': {
                            borderColor: '#d45151',
                            backgroundColor: 'rgba(232, 97, 97, 0.04)',
                          },
                        }}
                      >
                        Restore
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionVersionHistoryDialog;

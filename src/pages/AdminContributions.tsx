import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Delete,
  OpenInNew,
  Refresh,
  Visibility,
} from '@mui/icons-material';
import {
  buildQuestionDefinitions,
  type QuestionnaireTemplate,
} from '@orkg/scidquest';
import { useAuth } from '../auth/useAuth';
import {
  getContributions,
  reviewContribution,
  deleteContribution,
  type Contribution,
  type ContributionStatus,
} from '../services/backendApi/contributions';
import empireQuestionnaire from '../templates/empire_questionnaire.json';

const TEMPLATE_SPEC = empireQuestionnaire as unknown as QuestionnaireTemplate;

const STATUS_TABS: ContributionStatus[] = ['pending', 'approved', 'rejected'];

const STATUS_COLOR: Record<
  ContributionStatus,
  'warning' | 'success' | 'error'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : '—';

/** Renders any answer shape the questionnaire produces as readable text. */
const formatAnswer = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number')
    return String(value);
  if (Array.isArray(value))
    return value.map((item) => formatAnswer(item)).filter(Boolean).join(', ');
  if (typeof value === 'object')
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${key}: ${formatAnswer(nested)}`)
      .filter(Boolean)
      .join(' · ');
  return String(value);
};

const isAnswered = (value: unknown): boolean =>
  formatAnswer(value).trim().length > 0;

/** DOIs are stored either bare or as a full URL; normalize for linking. */
const doiHref = (doi?: string): string | null => {
  if (!doi) return null;
  const trimmed = doi.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    return trimmed;
  return `https://doi.org/${trimmed}`;
};

const AdminContributions = () => {
  const { user } = useAuth();

  const [statusTab, setStatusTab] = useState<ContributionStatus>('pending');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState<Contribution | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Question labels live in the template, not in the stored answers, so the
  // reviewer sees the same wording the submitter answered.
  const questionDefinitions = useMemo(
    () => buildQuestionDefinitions(TEMPLATE_SPEC),
    []
  );

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContributions(await getContributions(statusTab));
    } catch (err) {
      console.error('Error fetching contributions:', err);
      setError(
        err instanceof Error
          ? `Failed to load contributions: ${err.message}`
          : 'Failed to load contributions.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handleReview = async (
    contribution: Contribution,
    status: 'approved' | 'rejected'
  ) => {
    if (!user?.id || !user?.email) {
      setError('User authentication required');
      return;
    }
    if (!contribution.id) return;

    setSavingId(contribution.id);
    setError(null);
    try {
      await reviewContribution(
        contribution.id,
        status,
        reviewNote.trim() || undefined,
        user.id,
        user.email
      );
      setSuccess(
        `Contribution "${contribution.paper?.title ?? contribution.id}" ${status}.`
      );
      setReviewing(null);
      setReviewNote('');
      await fetchContributions();
    } catch (err) {
      console.error('Error reviewing contribution:', err);
      setError(
        err instanceof Error
          ? `Failed to ${status === 'approved' ? 'approve' : 'reject'} contribution: ${err.message}`
          : 'Failed to review contribution.'
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (contribution: Contribution) => {
    if (!user?.id || !user?.email || !contribution.id) return;
    if (
      !window.confirm(
        `Delete the contribution "${contribution.paper?.title ?? contribution.id}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setSavingId(contribution.id);
    setError(null);
    try {
      await deleteContribution(contribution.id, user.id, user.email);
      setSuccess('Contribution deleted.');
      await fetchContributions();
    } catch (err) {
      console.error('Error deleting contribution:', err);
      setError(
        err instanceof Error
          ? `Failed to delete contribution: ${err.message}`
          : 'Failed to delete contribution.'
      );
    } finally {
      setSavingId(null);
    }
  };

  const openReview = (contribution: Contribution) => {
    setReviewing(contribution);
    setReviewNote(contribution.reviewNote ?? '');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Contributions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Questionnaire submissions awaiting review.
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={fetchContributions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Paper>
        <Tabs
          value={statusTab}
          onChange={(_, value: ContributionStatus) => setStatusTab(value)}
        >
          {STATUS_TABS.map((status) => (
            <Tab
              key={status}
              value={status}
              label={status[0].toUpperCase() + status.slice(1)}
            />
          ))}
        </Tabs>

        {loading && <LinearProgress />}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paper</TableCell>
                <TableCell>Submitter</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && contributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 3, textAlign: 'center' }}
                    >
                      No {statusTab} contributions.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {contributions.map((contribution) => {
                const href = doiHref(contribution.paper?.doi);
                const busy = savingId === contribution.id;

                return (
                  <TableRow key={contribution.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {contribution.paper?.title || 'Untitled'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          contribution.paper?.authors,
                          contribution.paper?.year,
                          contribution.paper?.venue,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </Typography>
                      {href && (
                        <Box>
                          <Link
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="caption"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {contribution.paper?.doi}
                            <OpenInNew sx={{ fontSize: 12 }} />
                          </Link>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {contribution.submittedByEmail || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(contribution.submittedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={contribution.status}
                        color={STATUS_COLOR[contribution.status]}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {busy ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Review answers">
                            <IconButton
                              size="small"
                              onClick={() => openReview(contribution)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {contribution.status !== 'approved' && (
                            <Tooltip title="Accept">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                  handleReview(contribution, 'approved')
                                }
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {contribution.status !== 'rejected' && (
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() =>
                                  handleReview(contribution, 'rejected')
                                }
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(contribution)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{reviewing?.paper?.title || 'Contribution'}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary">
            Submitted by {reviewing?.submittedByEmail || 'unknown'} on{' '}
            {formatDate(reviewing?.submittedAt)} · template{' '}
            {reviewing?.templateId ?? '—'} v{reviewing?.templateVersion ?? '—'}
          </Typography>

          {TEMPLATE_SPEC.sections.map((section) => {
            const rows = section.questions
              .map((question) => ({
                id: question.id,
                label:
                  questionDefinitions[question.id]?.label ||
                  questionDefinitions[question.id]?.title ||
                  question.id,
                value: formatAnswer(reviewing?.answers?.[question.id]),
              }))
              .filter((row) => row.value.trim().length > 0);

            if (rows.length === 0) return null;

            return (
              <Box key={section.id} sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {section.title}
                </Typography>
                <Stack spacing={1.5}>
                  {rows.map((row) => (
                    <Box key={row.id}>
                      <Typography variant="caption" color="text.secondary">
                        {row.label}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {row.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            );
          })}

          {reviewing &&
            !Object.values(reviewing.answers ?? {}).some(isAnswered) && (
              <Alert severity="info" sx={{ mt: 3 }}>
                This submission contains no answered questions.
              </Alert>
            )}

          <TextField
            label="Review note (optional)"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 3 }}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            helperText="Stored with the contribution for the record."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewing(null)}>Close</Button>
          <Button
            color="warning"
            disabled={!!savingId}
            onClick={() => reviewing && handleReview(reviewing, 'rejected')}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={!!savingId}
            onClick={() => reviewing && handleReview(reviewing, 'approved')}
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminContributions;

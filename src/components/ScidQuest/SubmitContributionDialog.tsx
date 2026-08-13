import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import type { ContributionPaper } from '../../services/backendApi/contributions';

/** Reads an answer that the questionnaire stores as a plain string. */
const readStringAnswer = (
  answers: Record<string, unknown>,
  questionId: string
): string => {
  const value = answers[questionId];
  return typeof value === 'string' ? value.trim() : '';
};

/**
 * The questionnaire captures the DOI and venue but has no title/author fields,
 * so those are collected here and the rest is prefilled from the answers.
 */
const derivePaperDefaults = (
  answers: Record<string, unknown>
): Pick<ContributionPaper, 'doi' | 'venue'> => ({
  doi: readStringAnswer(answers, 'doi'),
  venue: readStringAnswer(answers, 'venue_series'),
});

interface SubmitContributionDialogProps {
  open: boolean;
  answers: Record<string, unknown>;
  answeredCount: number;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (paper: ContributionPaper) => void;
}

export default function SubmitContributionDialog({
  open,
  answers,
  answeredCount,
  submitting,
  onClose,
  onSubmit,
}: SubmitContributionDialogProps) {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [doi, setDoi] = useState('');
  const [venue, setVenue] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);

  // Re-seed from the answers each time the dialog opens, so edits made after a
  // failed submit are picked up rather than showing stale values.
  useEffect(() => {
    if (!open) return;
    const defaults = derivePaperDefaults(answers);
    setDoi(defaults.doi ?? '');
    setVenue(defaults.venue ?? '');
    setTitleTouched(false);
  }, [open, answers]);

  const trimmedTitle = title.trim();
  const parsedYear = Number(year);
  const yearInvalid =
    year.trim() !== '' &&
    (!Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > new Date().getFullYear() + 1);
  const canSubmit = trimmedTitle.length > 0 && !yearInvalid && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) {
      setTitleTouched(true);
      return;
    }

    onSubmit({
      title: trimmedTitle,
      ...(doi.trim() ? { doi: doi.trim() } : {}),
      ...(authors.trim() ? { authors: authors.trim() } : {}),
      ...(year.trim() ? { year: parsedYear } : {}),
      ...(venue.trim() ? { venue: venue.trim() } : {}),
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Submit contribution for review</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Your answers are sent to the EmpiRE-Compass admins for review. You can
          keep editing until an admin accepts the contribution.
        </DialogContentText>

        {answeredCount === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have not answered any questions yet.
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Paper title"
            required
            fullWidth
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            error={titleTouched && trimmedTitle.length === 0}
            helperText={
              titleTouched && trimmedTitle.length === 0
                ? 'A paper title is required.'
                : 'Title of the paper this contribution describes.'
            }
          />
          <TextField
            label="DOI"
            fullWidth
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            helperText="Prefilled from the questionnaire."
          />
          <TextField
            label="Authors"
            fullWidth
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            helperText="Optional, comma separated."
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Year"
              fullWidth
              value={year}
              onChange={(e) => setYear(e.target.value)}
              error={yearInvalid}
              helperText={yearInvalid ? 'Enter a valid publication year.' : ' '}
            />
            <TextField
              label="Venue"
              fullWidth
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              helperText="Prefilled from the questionnaire."
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

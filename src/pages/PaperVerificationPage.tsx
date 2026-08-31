import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import toast from 'react-hot-toast';
import {
  ResearchQuestionnaireApp,
  type QuestionnaireTemplate,
} from '@orkg/scidquest';
import '@orkg/scidquest/dist/contribute-standalone.css';
import { createScidQuestTheme } from '../components/ScidQuest/scidQuestTheme';
import { ScidQuestProviders } from '../components/ScidQuest/ScidQuestProviders';
import { ErrorBoundary } from '../components/ScidQuest/ErrorBoundary';
import { ensureReactPdfWorkerConfigured } from '../utils/pdfWorker';
import {
  getVerification,
  submitVerification,
  type VerificationData,
} from '../services/backendApi/verifications';
import empireQuestionnaire from '../templates/empire_questionnaire.json';

/** Same fixed template ScidQuestPage/AdminContributions use — the backend only sends answers, not the form shape. */
const TEMPLATE_SPEC = empireQuestionnaire as unknown as QuestionnaireTemplate;

type PageStatus = 'loading' | 'error' | 'ready' | 'submitted';

export default function PaperVerificationPage() {
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<VerificationData | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [submitting, setSubmitting] = useState<'confirm' | 'corrections' | null>(
    null
  );
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  useEffect(() => {
    ensureReactPdfWorkerConfigured()
      .then(() => setIsWorkerReady(true))
      .catch(() => setIsWorkerReady(true));
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('This verification link is missing its token.');
      return;
    }

    getVerification(token)
      .then((result) => {
        setData(result);
        setAnswers(result.answers ?? {});
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'This verification link could not be loaded.'
        );
        setStatus('error');
      });
  }, [token]);

  const outerTheme = useTheme();
  const scidQuestTheme = useMemo(
    () => createScidQuestTheme(outerTheme),
    [outerTheme]
  );

  const handleSubmit = async (confirmedAsIs: boolean) => {
    if (!token) return;
    setSubmitting(confirmedAsIs ? 'confirm' : 'corrections');
    try {
      await submitVerification(token, {
        answers,
        confirmedAsIs,
        authorName: authorName.trim() || undefined,
        authorEmail: authorEmail.trim() || undefined,
      });
      setStatus('submitted');
      toast.success('Thank you — your response has been recorded.');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Could not submit: ${err.message}`
          : 'Could not submit. Please try again.'
      );
    } finally {
      setSubmitting(null);
    }
  };

  if (status === 'loading' || !isWorkerReady) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            This link isn't available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {errorMessage}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (status === 'submitted') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Thank you!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your response has been sent to the EmpiRE-Compass curators for
            review. This link can't be used again.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!data) return null;

  const busy = submitting !== null;

  return (
    <ThemeProvider theme={scidQuestTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg" disableGutters>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {data.paper.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[data.paper.venue, data.paper.year].filter(Boolean).join(' · ')}
              {data.paper.doi && (
                <>
                  {' · '}
                  <Link
                    href={`https://doi.org/${data.paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {data.paper.doi}
                  </Link>
                </>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              We've pre-filled this from what's already recorded in ORKG for
              this paper. Please check it over and correct anything that's
              wrong before submitting.
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 3 }}>
          {data.unmappedNotes.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                A few fields couldn't be filled in automatically and were left
                blank — please fill these in if you can:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {data.unmappedNotes.map((note, i) => (
                  <li key={i}>
                    <Typography variant="body2">{note}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 3 }}>
            <ErrorBoundary>
              <ScidQuestProviders>
                <ResearchQuestionnaireApp
                  templateSpec={TEMPLATE_SPEC}
                  answers={answers}
                  setAnswers={setAnswers}
                  layout="single"
                  fileManagerView="hidden"
                />
              </ScidQuestProviders>
            </ErrorBoundary>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your details (optional)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Your name"
                fullWidth
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <TextField
                label="Your email"
                fullWidth
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                helperText="In case a curator needs to follow up."
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => handleSubmit(true)}
              >
                {submitting === 'confirm'
                  ? 'Submitting…'
                  : 'This is correct as-is'}
              </Button>
              <Button
                variant="contained"
                disabled={busy}
                onClick={() => handleSubmit(false)}
              >
                {submitting === 'corrections'
                  ? 'Submitting…'
                  : 'Submit my corrections'}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

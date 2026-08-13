import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { createScidQuestTheme } from '../components/ScidQuest/scidQuestTheme';
import toast from 'react-hot-toast';
import {
  ResearchQuestionnaireApp,
  type QuestionnaireTemplate,
} from '@orkg/scidquest';
import { ScidQuestProviders } from '../components/ScidQuest/ScidQuestProviders';
import { ensureReactPdfWorkerConfigured } from '../utils/pdfWorker';
import { ErrorBoundary } from '../components/ScidQuest/ErrorBoundary';
import SubmitContributionDialog from '../components/ScidQuest/SubmitContributionDialog';
import '@orkg/scidquest/dist/contribute-standalone.css';

import { useAppDispatch } from '../store/hooks';
import { setScidQuestAnswers } from '../store/slices/scidQuestSlice';
import AIConfigurationButton from '../components/AI/AIConfigurationButton';
import { useAuthData } from '../auth/useAuthData';
import {
  submitContribution,
  type ContributionPaper,
} from '../services/backendApi/contributions';
import empireQuestionnaire from '../templates/empire_questionnaire.json';

/**
 * The EmpiRE questionnaire is a curated ScidQuest `QuestionnaireTemplate`, not
 * the raw ORKG template dump: it carries the field types, option lists,
 * validation rules and ORKG mappings that the ORKG shape has no room for. It is
 * therefore used as-is, with no conversion step.
 */
const TEMPLATE_SPEC = empireQuestionnaire as unknown as QuestionnaireTemplate;

/** Counts top-level questions the researcher has actually filled in. */
const countAnswered = (answers: Record<string, unknown>): number =>
  Object.values(answers).filter((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }).length;

export default function ScidQuestPage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuthData();

  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ensureReactPdfWorkerConfigured()
      .then(() => setIsWorkerReady(true))
      .catch((err) => {
        console.error('Failed to configure PDF worker:', err);
        setIsWorkerReady(true);
      });
  }, []);

  const answeredCount = useMemo(() => countAnswered(answers), [answers]);

  /**
   * The questionnaire and PDF panes scroll internally, which only works if this
   * page has a *definite* height. It cannot get one from flex: the surrounding
   * layout's `<main>` uses the default `min-height: auto`, so any flex chain
   * through it stretches to fit content — the PDF pane grew to the full stack of
   * pages instead of scrolling. Relaxing that globally would let the footer
   * overlap genuinely long pages such as Statistics, so the height is measured
   * here instead, which also adapts to the backup banner and any header change.
   */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = rootRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const footer = document.querySelector('footer');
      const footerHeight = footer?.getBoundingClientRect().height ?? 0;
      setAvailableHeight(
        Math.max(360, Math.round(window.innerHeight - top - footerHeight))
      );
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Scoped to this page so the questionnaire picks up the SciD-QuESt look
  // without restyling the rest of the dashboard.
  const outerTheme = useTheme();
  const scidQuestTheme = useMemo(
    () => createScidQuestTheme(outerTheme),
    [outerTheme]
  );

  // Mirrored into the store from an effect rather than from the setState
  // updater, which React may invoke more than once per commit.
  useEffect(() => {
    dispatch(setScidQuestAnswers(answers));
  }, [answers, dispatch]);

  const handleSubmit = async (paper: ContributionPaper) => {
    if (!user?.id || !user?.email) {
      toast.error('Please sign in again before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContribution(
        {
          paper,
          answers,
          templateId: TEMPLATE_SPEC.template_id,
          templateVersion: TEMPLATE_SPEC.version,
        },
        user.id,
        user.email
      );
      setSubmitDialogOpen(false);
      toast.success('Contribution submitted. An admin will review it shortly.');
    } catch (error) {
      console.error('Failed to submit contribution:', error);
      toast.error(
        error instanceof Error
          ? `Submission failed: ${error.message}`
          : 'Submission failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isWorkerReady) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={scidQuestTheme}>
      <Box
        ref={rootRef}
        sx={{
          height: availableHeight ?? 'calc(100vh - 64px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 1.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}
            >
              {TEMPLATE_SPEC.template}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Template {TEMPLATE_SPEC.template_id} · v{TEMPLATE_SPEC.version} ·{' '}
              {answeredCount} question{answeredCount === 1 ? '' : 's'} answered
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <AIConfigurationButton />
            <Tooltip
              title={
                isAuthenticated
                  ? ''
                  : 'Sign in to submit a contribution for review'
              }
            >
              {/* span keeps the tooltip working while the button is disabled */}
              <span>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!isAuthenticated}
                  onClick={() => setSubmitDialogOpen(true)}
                >
                  Submit for review
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <ErrorBoundary>
            <ScidQuestProviders>
              <ResearchQuestionnaireApp
                templateSpec={TEMPLATE_SPEC}
                answers={answers}
                setAnswers={setAnswers}
                // Inline actions under each field instead of one "AI Assistant"
                // dropdown. `config` is omitted — AI setup lives in the page
                // header, not per question.
                aiLayout="buttons"
                aiActions={['suggest', 'history', 'verify']}
              />
            </ScidQuestProviders>
          </ErrorBoundary>
        </Box>

        <SubmitContributionDialog
          open={submitDialogOpen}
          answers={answers}
          answeredCount={answeredCount}
          submitting={submitting}
          onClose={() => setSubmitDialogOpen(false)}
          onSubmit={handleSubmit}
        />
      </Box>
    </ThemeProvider>
  );
}

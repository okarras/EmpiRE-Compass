import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ResearchQuestionnaireApp } from '@orkg/scidquest';
import { ScidQuestProviders } from '../components/ScidQuest/ScidQuestProviders';
import { ensureReactPdfWorkerConfigured } from '../utils/pdfWorker';
import { ErrorBoundary } from '../components/ScidQuest/ErrorBoundary';
import '@orkg/scidquest/dist/scidquest.css';

import { getTemplate } from '../services/backendApi/templates';
import { useAppDispatch } from '../store/hooks';
import { setScidQuestAnswers } from '../store/slices/scidQuestSlice';

export default function ScidQuestPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const dispatch = useAppDispatch();

  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templateSpec, setTemplateSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureReactPdfWorkerConfigured()
      .then(() => setIsWorkerReady(true))
      .catch((err) => {
        console.error('Failed to configure PDF worker:', err);
        setIsWorkerReady(true);
      });
  }, []);

  useEffect(() => {
    if (templateId) {
      getTemplate(templateId)
        .then((res) => {
          setTemplateSpec(res);
        })
        .catch((err) => {
          console.error('Failed to fetch template:', err);
          setError('Failed to fetch template data.');
        });
    } else {
      setError('No template ID provided in route.');
    }
  }, [templateId]);

  const handleAnswersChange = (newAnswers: Record<string, string>) => {
    setAnswers(newAnswers);
    dispatch(setScidQuestAnswers(newAnswers));
  };

  const mockPdfTextExtractor = {
    extractFullText: async (url: string) => {
      console.log('Extracting text from:', url);
      return 'Sample extracted text from PDF... Integration with an actual backend extractor goes here.';
    },
  };

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!isWorkerReady || !templateSpec) {
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
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ErrorBoundary>
        <ScidQuestProviders>
          <ResearchQuestionnaireApp
            templateSpec={templateSpec}
            answers={answers}
            setAnswers={handleAnswersChange}
            pdfTextExtractor={mockPdfTextExtractor}
          />
        </ScidQuestProviders>
      </ErrorBoundary>
    </Box>
  );
}

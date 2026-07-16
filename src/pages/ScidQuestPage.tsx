import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ResearchQuestionnaireApp } from '@orkg/scidquest';
import { ScidQuestProviders } from '../components/ScidQuest/ScidQuestProviders';
import { ensureReactPdfWorkerConfigured } from '../utils/pdfWorker';
import { QuestionnaireForm } from '../components/ScidQuest/QuestionnaireForm';
import { ErrorBoundary } from '../components/ScidQuest/ErrorBoundary';
import '@orkg/scidquest/dist/scidquest.css';

export default function ScidQuestPage() {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    ensureReactPdfWorkerConfigured()
      .then(() => {
        setIsWorkerReady(true);
      })
      .catch((err) => {
        console.error('Failed to configure PDF worker:', err);
        setIsWorkerReady(true);
      });
  }, []);

  const renderQuestionnaireSlot = useCallback(() => {
    return <QuestionnaireForm answers={answers} setAnswers={setAnswers} />;
  }, [answers]);

  const mockPdfTextExtractor = {
    extractFullText: async (url: string) => {
      console.log('Extracting text from:', url);
      return 'Sample extracted text from PDF... Integration with an actual backend extractor goes here.';
    },
  };

  const mockTemplateSpec = {
    version: '1.0',
    template: 'scidquest',
    template_id: 'test',
    sections: [],
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
            templateSpec={mockTemplateSpec}
            answers={answers}
            setAnswers={setAnswers}
            pdfTextExtractor={mockPdfTextExtractor}
            questionnaireSlot={renderQuestionnaireSlot}
          />
        </ScidQuestProviders>
      </ErrorBoundary>
    </Box>
  );
}

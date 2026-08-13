import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { ResearchQuestionnaireApp } from '@orkg/scidquest';
import { ScidQuestProviders } from '../components/ScidQuest/ScidQuestProviders';
import { ensureReactPdfWorkerConfigured } from '../utils/pdfWorker';
import { ErrorBoundary } from '../components/ScidQuest/ErrorBoundary';
import '@orkg/scidquest/dist/scidquest.css';

import { getTemplate } from '../services/backendApi/templates';
import { useAppDispatch } from '../store/hooks';
import { setScidQuestAnswers } from '../store/slices/scidQuestSlice';

// Helper to convert an ORKG template format to the ScidQuest QuestionnaireTemplate format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertOrkgToScidQuest = (orkgTemplate: any) => {
  if (orkgTemplate.sections || orkgTemplate.template_id) {
    return orkgTemplate; // Already in ScidQuest format
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (orkgTemplate.properties || []).map((prop: any) => {
    return {
      id: prop.path?.id || prop.id,
      label: prop.description || prop.path?.label || prop.label || 'Question',
      type: 'text', // Default to text for all ORKG properties
      required: prop.min_count > 0,
    };
  });

  return {
    version: '1',
    template: orkgTemplate.label || 'Extracted Information',
    template_id: orkgTemplate.id || 'unknown_template',
    sections: [
      {
        id: `sec-${orkgTemplate.id || 'default'}`,
        title: orkgTemplate.label || 'Template Sections',
        questions: questions,
      },
    ],
  };
};

export default function ScidQuestPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const dispatch = useAppDispatch();

  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templateSpec, setTemplateSpec] = useState<any>(null);
  const [templateSource, setTemplateSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setTemplateSpec(convertOrkgToScidQuest(res));
          setTemplateSource(`${templateId} (ORKG API)`);
        })
        .catch((err) => {
          console.error('Failed to fetch template:', err);
          setError('Failed to fetch template data.');
          setTemplateSpec(null);
        });
    }
  }, [templateId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const parsed = JSON.parse(result);
          console.log('Uploaded Template Spec:', parsed);

          // The @orkg/scidquest library actually expects a `QuestionnaireTemplate`
          // which uses `template_id` and `sections`. We allow both here so we don't block
          // you, but the UI will render blank if it lacks `sections`.
          const isOrkgTemplate = !!(parsed.id || parsed.properties);
          const isScidQuestTemplate = !!(parsed.template_id || parsed.sections);

          if (!isOrkgTemplate && !isScidQuestTemplate) {
            setFileError(
              'Invalid JSON file. Please upload a valid template schema.'
            );
            setTemplateSpec(null);
            return;
          }

          setTemplateSpec(convertOrkgToScidQuest(parsed));
          setTemplateSource(`${file.name} (Local)`);
        }
      } catch (err) {
        console.error('Failed to parse JSON file:', err);
        setFileError('Invalid JSON file. Please upload a valid template.');
        setTemplateSpec(null);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read the uploaded file.');
      setTemplateSpec(null);
    };
    reader.readAsText(file);

    // Reset input so the same file can be uploaded again if needed
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleAnswersChange = (newAnswers: Record<string, string>) => {
    setAnswers(newAnswers);
    dispatch(setScidQuestAnswers(newAnswers));
  };

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

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

  // Shared hidden file input and snackbar for both states
  const fileUploadComponents = (
    <>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <Snackbar
        open={!!fileError}
        autoHideDuration={6000}
        onClose={() => setFileError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFileError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {fileError}
        </Alert>
      </Snackbar>
    </>
  );

  if (!templateSpec || Object.keys(templateSpec).length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          gap: 2,
        }}
      >
        <Typography variant="h6">Upload JSON Template</Typography>
        {fileUploadComponents}
        <Button
          variant="contained"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload Template
        </Button>
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
      {fileUploadComponents}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #ddd',
        }}
      >
        <Typography variant="body1" fontWeight="bold">
          Active Template: {templateSource || 'Unknown'}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => fileInputRef.current?.click()}
        >
          Switch / Upload Template
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ErrorBoundary>
          <ScidQuestProviders>
            <ResearchQuestionnaireApp
              templateSpec={templateSpec}
              answers={answers}
              setAnswers={handleAnswersChange}
            />
          </ScidQuestProviders>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}

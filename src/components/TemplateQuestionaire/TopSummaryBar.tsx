import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from '@mui/icons-material/Refresh';
import AIConfigurationButton from '../AI/AIConfigurationButton';
import ValidationStatusButton from './ValidationStatusButton';

interface MissingField {
  questionId: string;
  questionLabel: string;
  sectionId: string;
  sectionTitle: string;
}

interface InvalidField {
  questionId: string;
  questionLabel: string;
  errorMessage: string;
  sectionId: string;
  sectionTitle: string;
}

interface AIVerification {
  questionId: string;
  status: 'pending' | 'verified' | 'needs_improvement' | 'error';
  feedback?: string;
  suggestions?: string[];
  confidence: number;
  qualityScore?: number;
}

interface TopSummaryBarProps {
  templateSpec: any;
  requiredSummary: {
    totalRequired: number;
    answeredRequired: number;
    perSection: any[];
  };
  exportAnswers: () => void;
  importAnswers: () => void;
  pdfExtractionError?: Error | null;
  onRetryExtraction?: () => void;
  missingFields?: MissingField[];
  invalidFields?: InvalidField[];
  aiVerificationStatus?: 'not_started' | 'in_progress' | 'complete';
  aiVerifications?: Record<string, AIVerification>;
  onRunAIVerification?: () => Promise<void>;
}

const TopSummaryBar: React.FC<TopSummaryBarProps> = ({
  templateSpec,
  requiredSummary,
  exportAnswers,
  importAnswers,
  pdfExtractionError,
  onRetryExtraction,
  missingFields = [],
  invalidFields = [],
  aiVerificationStatus = 'not_started',
  aiVerifications = {},
  onRunAIVerification,
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 1, mx: 0, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {templateSpec?.template ?? 'Template'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {templateSpec?.version ? `v${templateSpec.version}` : ''}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={importAnswers}
          >
            Import
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportAnswers}
          >
            Export
          </Button>
          <ValidationStatusButton
            totalRequired={requiredSummary.totalRequired}
            answeredRequired={requiredSummary.answeredRequired}
            missingFields={missingFields}
            invalidFields={invalidFields}
            aiVerificationStatus={aiVerificationStatus}
            aiVerifications={aiVerifications}
            onRunAIVerification={onRunAIVerification}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 2 }}>
        <AIConfigurationButton />
        <Typography variant="body2" color="text.secondary">
          Configure AI settings to use OpenAI or Groq models
        </Typography>
      </Box>

      {!pdfExtractionError && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            PDF Status: Text extraction{' '}
            {typeof window !== 'undefined' && (window as any).__pdfTextExtracted
              ? 'completed'
              : 'in progress or not started'}
          </Typography>
        </Box>
      )}
      {pdfExtractionError && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            onRetryExtraction ? (
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetryExtraction}
              >
                Retry
              </Button>
            ) : undefined
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            PDF Text Extraction Failed
          </Typography>
          <Typography variant="body2">
            {pdfExtractionError.message ||
              'Failed to extract text from PDF. AI suggestions will not be available.'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            You can continue filling out the questionnaire manually, or click
            Retry to attempt extraction again.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default TopSummaryBar;

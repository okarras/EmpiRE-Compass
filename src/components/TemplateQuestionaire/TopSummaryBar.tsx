import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import AIConfigurationButton from '../AI/AIConfigurationButton';

interface TopSummaryBarProps {
  templateSpec: any;
  requiredSummary: {
    totalRequired: number;
    answeredRequired: number;
    perSection: any[];
  };
  exportAnswers: () => void;
  importAnswers: () => void;
  missingCount: number;
  onValidate: () => void;
  pdfExtractionError?: Error | null;
  onRetryExtraction?: () => void;
}

const TopSummaryBar: React.FC<TopSummaryBarProps> = ({
  templateSpec,
  requiredSummary,
  exportAnswers,
  importAnswers,
  missingCount,
  onValidate,
  pdfExtractionError,
  onRetryExtraction,
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

        <Chip
          icon={<CheckCircleOutlineIcon />}
          label={`${requiredSummary.answeredRequired}/${requiredSummary.totalRequired} required`}
          variant="outlined"
        />

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
          <Button
            size="small"
            color={missingCount ? 'error' : 'primary'}
            variant="contained"
            onClick={onValidate}
          >
            Validate {missingCount > 0 ? `(${missingCount})` : ''}
          </Button>
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

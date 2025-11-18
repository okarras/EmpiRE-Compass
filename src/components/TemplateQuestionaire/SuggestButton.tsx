import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import { AutoAwesome, Refresh } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import AIConfigurationDialog from '../AI/AIConfigurationDialog';
import useSuggestionGenerator from '../../hooks/useSuggestionGenerator';
import {
  isAuthError,
  isConfigError,
  type Suggestion,
} from '../../utils/suggestions';

interface SuggestButtonProps {
  questionText: string;
  questionType: 'text' | 'select' | 'multi_select' | 'repeat_text' | 'group';
  questionOptions?: string[];
  onSuggestionsGenerated: (suggestions: Suggestion[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  pdfContent?: string;
}

export interface SuggestButtonRef {
  triggerGeneration: () => Promise<void>;
}

// AI suggestion button for questionnaire questions.

const SuggestButton = React.forwardRef<SuggestButtonRef, SuggestButtonProps>(
  (
    {
      questionText,
      questionType,
      questionOptions,
      onSuggestionsGenerated,
      onError,
      disabled = false,
      pdfContent,
    },
    ref
  ) => {
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [showError, setShowError] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const { isConfigured } = useAppSelector((state) => state.ai);
    const [announceMessage, setAnnounceMessage] = React.useState<string>('');

    const announce = React.useCallback((message: string) => {
      setAnnounceMessage(message);
      setTimeout(() => setAnnounceMessage(''), 100);
    }, []);

    const { suggestions, loading, error, rawError, generateSuggestions } =
      useSuggestionGenerator({
        questionText,
        questionType,
        questionOptions,
        pdfContent,
      });

    const notifiedSuggestionsRef = React.useRef<string>('');

    React.useEffect(() => {
      if (suggestions.length > 0) {
        const suggestionsKey = suggestions.map((s) => s.id).join(',');

        if (suggestionsKey !== notifiedSuggestionsRef.current) {
          notifiedSuggestionsRef.current = suggestionsKey;
          onSuggestionsGenerated(suggestions);
          setShowSuccess(true);
          announce(`${suggestions.length} suggestions generated successfully`);
          const timer = setTimeout(() => {
            setShowSuccess(false);
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    }, [suggestions, onSuggestionsGenerated, announce]);

    React.useEffect(() => {
      if (error) {
        setLastError(error);
        setShowError(true);
        announce(`Error: ${error}`);
        if (onError) {
          onError(error);
        }
      }
    }, [error, onError, announce]);

    React.useEffect(() => {
      if (loading) {
        announce('Generating suggestions, please wait...');
      }
    }, [loading, announce]);

    const handleClick = async () => {
      if (!isConfigured) {
        setConfigDialogOpen(true);
        const errorMsg =
          'AI is not configured. Please configure your AI settings to generate suggestions.';
        setLastError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }

      if (!pdfContent || pdfContent.trim().length === 0) {
        const errorMsg =
          'PDF content is required to generate suggestions. Please ensure a PDF is loaded and text extraction has completed.';
        setLastError(errorMsg);
        setShowError(true);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }

      setLastError(null);
      setShowError(false);
      await generateSuggestions();
    };

    const handleCloseConfigDialog = () => {
      setConfigDialogOpen(false);
      if (isConfigured) {
        setLastError(null);
        setShowError(false);
      }
    };

    const handleRetry = () => {
      setShowError(false);
      handleClick();
    };

    React.useImperativeHandle(
      ref,
      () => ({
        triggerGeneration: handleClick,
      }),
      [handleClick]
    );

    const isDisabled = disabled || loading || !questionText.trim();
    const isRetryable =
      lastError &&
      rawError &&
      !isAuthError(rawError) &&
      !isConfigError(rawError);

    return (
      <>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {announceMessage}
        </div>

        <Tooltip
          title={
            !questionText.trim()
              ? 'Question text is required'
              : !isConfigured
                ? 'Configure AI to use suggestions'
                : !pdfContent
                  ? 'PDF content is required'
                  : loading
                    ? 'Generating suggestions...'
                    : lastError
                      ? 'Failed to generate suggestions. Click to try again.'
                      : 'Get AI-powered suggestions from PDF'
          }
        >
          <span>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClick}
              disabled={isDisabled}
              startIcon={
                loading ? (
                  <CircularProgress size={16} />
                ) : lastError && isRetryable ? (
                  <Refresh sx={{ fontSize: 18 }} />
                ) : (
                  <AutoAwesome sx={{ fontSize: 18 }} />
                )
              }
              sx={{
                textTransform: 'none',
                borderColor: lastError ? 'error.main' : '#e86161',
                color: lastError ? 'error.main' : '#e86161',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  borderColor: lastError ? 'error.dark' : '#d45151',
                  backgroundColor: lastError
                    ? 'rgba(211, 47, 47, 0.04)'
                    : 'rgba(232, 97, 97, 0.04)',
                },
                '&.Mui-disabled': {
                  borderColor: 'action.disabled',
                  color: 'action.disabled',
                },
              }}
              aria-label={
                lastError && isRetryable
                  ? 'Retry generating suggestions after error'
                  : 'Generate AI suggestions for this question'
              }
              aria-busy={loading}
              aria-describedby={lastError ? 'suggest-button-error' : undefined}
            >
              {loading
                ? 'Generating...'
                : lastError && isRetryable
                  ? 'Try Again'
                  : 'Suggest'}
            </Button>
          </span>
        </Tooltip>

        <AIConfigurationDialog
          open={configDialogOpen}
          onClose={handleCloseConfigDialog}
        />

        <Snackbar
          open={showError}
          autoHideDuration={8000}
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowError(false)}
            severity="error"
            sx={{ width: '100%' }}
            action={
              isRetryable ? (
                <Tooltip title="Attempt to generate suggestions again">
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRetry}
                    startIcon={<Refresh />}
                  >
                    Try Again
                  </Button>
                </Tooltip>
              ) : undefined
            }
          >
            {lastError}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showSuccess}
          autoHideDuration={2000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            icon={<AutoAwesome />}
            sx={{ width: '100%' }}
          >
            Suggestions generated successfully!
          </Alert>
        </Snackbar>
      </>
    );
  }
);

SuggestButton.displayName = 'SuggestButton';

export default SuggestButton;

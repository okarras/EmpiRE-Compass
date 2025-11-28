import React, { useState, useRef } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AutoAwesome,
  VerifiedUser,
  ArrowDropDown,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import AIConfigurationDialog from '../AI/AIConfigurationDialog';
import useSuggestionGenerator from '../../hooks/useSuggestionGenerator';
import {
  useAIService,
  type AIVerificationResult,
} from '../../services/backendAIService';
import {
  isAuthError,
  isConfigError,
  type Suggestion,
} from '../../utils/suggestions';

interface AIAssistantButtonProps {
  questionId: string;
  questionText: string;
  questionType: 'text' | 'select' | 'multi_select' | 'repeat_text' | 'group';
  questionOptions?: string[];
  currentAnswer: string;
  onSuggestionsGenerated: (suggestions: Suggestion[]) => void;
  onVerificationComplete?: (result: AIVerificationResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  pdfContent?: string;
  context?: string;
  hasSuggestions?: boolean;
}

export interface AIAssistantButtonRef {
  triggerSuggestion: () => Promise<void>;
  triggerVerification: () => Promise<void>;
}

const AIAssistantButton = React.forwardRef<
  AIAssistantButtonRef,
  AIAssistantButtonProps
>(
  (
    {
      questionId,
      questionText,
      questionType,
      questionOptions,
      currentAnswer,
      onSuggestionsGenerated,
      onVerificationComplete,
      onError,
      disabled = false,
      pdfContent,
      context,
      hasSuggestions = false,
    },
    ref
  ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [showError, setShowError] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [verificationResult, setVerificationResult] =
      useState<AIVerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const { isConfigured } = useAppSelector((state) => state.ai);
    const aiService = useAIService();
    const [announceMessage, setAnnounceMessage] = useState<string>('');

    const announce = React.useCallback((message: string) => {
      setAnnounceMessage(message);
      setTimeout(() => setAnnounceMessage(''), 100);
    }, []);

    const {
      suggestions,
      loading: suggestLoading,
      error,
      rawError,
      generateSuggestions,
    } = useSuggestionGenerator({
      questionText,
      questionType,
      questionOptions,
      pdfContent,
    });

    const notifiedSuggestionsRef = useRef<string>('');

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
      if (suggestLoading) {
        announce('Generating suggestions, please wait...');
      }
    }, [suggestLoading, announce]);

    React.useEffect(() => {
      if (isVerifying) {
        announce('Verifying answer, please wait...');
      }
    }, [isVerifying, announce]);

    React.useEffect(() => {
      setVerificationResult(null);
    }, [currentAnswer]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      if (!isConfigured) {
        setConfigDialogOpen(true);
        const errorMsg =
          'AI is not configured. Please configure your AI settings.';
        setLastError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleSuggest = async () => {
      handleMenuClose();

      if (!pdfContent || pdfContent.trim().length === 0) {
        const errorMsg =
          'PDF content is required to generate suggestions. Please ensure a PDF is loaded.';
        setLastError(errorMsg);
        setShowError(true);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }

      setLastError(null);
      setShowError(false);
      setVerificationResult(null);
      await generateSuggestions();
    };

    const handleVerify = async () => {
      handleMenuClose();

      if (!currentAnswer || currentAnswer.trim().length === 0) {
        const errorMsg = 'Please provide an answer before verification.';
        setLastError(errorMsg);
        setShowError(true);
        announce(`Error: ${errorMsg}`);
        if (onError) {
          onError(errorMsg);
        }
        return;
      }

      setIsVerifying(true);
      setLastError(null);
      setShowError(false);
      setShowSuccess(false);
      setVerificationResult(null);

      try {
        const result = await aiService.verifyAnswer({
          questionId,
          questionText,
          currentAnswer,
          questionType,
          context,
          pdfContent,
        });

        setVerificationResult(result);

        if (result.status === 'verified') {
          setShowSuccess(true);
          announce('Answer verified with supporting evidence from the paper');
        } else if (result.status === 'needs_improvement') {
          announce('Verification complete. Review feedback and evidence.');
        } else {
          setShowError(true);
          setLastError(result.feedback || 'Verification failed');
          announce(`Error: ${result.feedback || 'Verification failed'}`);
        }

        if (onVerificationComplete) {
          onVerificationComplete(result);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to verify answer';
        setLastError(errorMsg);
        setShowError(true);
        announce(`Error: ${errorMsg}`);
        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setIsVerifying(false);
      }
    };

    const handleCloseConfigDialog = () => {
      setConfigDialogOpen(false);
    };

    const handleRetry = () => {
      setShowError(false);
      if (verificationResult) {
        handleVerify();
      } else {
        handleSuggest();
      }
    };

    React.useImperativeHandle(
      ref,
      () => ({
        triggerSuggestion: handleSuggest,
        triggerVerification: handleVerify,
      }),
      [handleSuggest, handleVerify]
    );

    const isDisabled =
      disabled || suggestLoading || isVerifying || !questionText.trim();
    const isRetryable =
      lastError &&
      rawError &&
      !isAuthError(rawError) &&
      !isConfigError(rawError);
    const isLoading = suggestLoading || isVerifying;

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
                ? 'Configure AI to use assistant'
                : isLoading
                  ? 'Processing...'
                  : 'AI Assistant - Suggest or Verify answers'
          }
        >
          <span>
            <Button
              variant="outlined"
              size="small"
              onClick={handleMenuOpen}
              disabled={isDisabled}
              endIcon={
                isLoading ? <CircularProgress size={16} /> : <ArrowDropDown />
              }
              startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                borderColor: '#e86161',
                color: '#e86161',
                minWidth: '140px',
                px: 1.5,
                py: 0.5,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#d45151',
                  backgroundColor: 'rgba(232, 97, 97, 0.04)',
                },
                '&.Mui-disabled': {
                  borderColor: 'action.disabled',
                  color: 'action.disabled',
                },
              }}
              aria-label="AI Assistant menu"
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
            >
              {isLoading ? 'Processing...' : 'AI Assistant'}
            </Button>
          </span>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem
            onClick={handleSuggest}
            disabled={
              !pdfContent || pdfContent.trim().length === 0 || hasSuggestions
            }
          >
            <ListItemIcon>
              <AutoAwesome fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Suggest Answer"
              secondary={
                hasSuggestions
                  ? 'Suggestions already shown'
                  : !pdfContent || pdfContent.trim().length === 0
                    ? 'No PDF content available'
                    : 'Generate from PDF'
              }
            />
          </MenuItem>
          <MenuItem
            onClick={handleVerify}
            disabled={!currentAnswer || currentAnswer.trim().length === 0}
          >
            <ListItemIcon>
              <VerifiedUser fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Verify Answer" secondary="Check quality" />
          </MenuItem>
        </Menu>

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
                <Tooltip title="Try again">
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleRetry}
                    startIcon={<Refresh />}
                  >
                    Retry
                  </Button>
                </Tooltip>
              ) : undefined
            }
          >
            {lastError}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showSuccess && !verificationResult}
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

        <Snackbar
          open={showSuccess && verificationResult?.status === 'verified'}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            icon={<CheckCircle />}
            sx={{ width: '100%' }}
          >
            Answer verified successfully!
          </Alert>
        </Snackbar>
      </>
    );
  }
);

AIAssistantButton.displayName = 'AIAssistantButton';

export default AIAssistantButton;

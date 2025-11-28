import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import { Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import BufferedTextField from '../BufferedTextField';
import AIAssistantButton, {
  type AIAssistantButtonRef,
} from '../AIAssistantButton';
import SuggestionBox from '../SuggestionBox';
import InlineValidationFeedback from '../InlineValidationFeedback';
import type { Suggestion } from '../../../utils/suggestions';
import type { AIVerificationResult } from '../../../services/backendAIService';

const TextQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
  pdfContent?: string;
  onNavigateToPage?: (pageNumber: number) => void;
  onHighlightsChange?: (
    highlights: Record<
      number,
      { left: number; top: number; width: number; height: number }[]
    >
  ) => void;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  validationError?: string | null;
  questionRef?: (element: HTMLElement | null) => void;
  onAIVerificationComplete?: (result: AIVerificationResult) => void;
}> = ({
  q,
  value,
  onChange,
  idAttr,
  level = 0,
  pdfContent,
  onNavigateToPage,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
  validationError,
  questionRef,
  onAIVerificationComplete,
}) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';

  const aiAssistantRef = useRef<AIAssistantButtonRef>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<AIVerificationResult | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isVerificationCollapsed, setIsVerificationCollapsed] = useState(false);

  const handleSuggestionsGenerated = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions);
    setShowSuggestions(true);
    setIsCollapsed(false);
    setError(null);
    setLoading(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setShowSuggestions(true);
    setSuggestions([]);
    setLoading(false);
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setIsCollapsed(true);
  };

  const handleCloseSuggestions = () => {
    // Suggestions should not be closeable - only collapsible
    // Keep them visible so users can always access them
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRegenerate = async () => {
    setSuggestions([]);
    setError(null);
    setIsCollapsed(false);
    setLoading(true);
    if (aiAssistantRef.current) {
      await aiAssistantRef.current.triggerSuggestion();
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowSuggestions(false);
  };

  const handleFeedback = (_suggestionId: string, _feedback: any) => {
    // Feedback handling can be implemented here if needed
  };

  const handleVerificationComplete = (result: AIVerificationResult) => {
    setVerificationResult(result);
    setShowVerification(true);
    setIsVerificationCollapsed(false);
    if (onAIVerificationComplete) {
      onAIVerificationComplete(result);
    }
  };

  const handleCloseVerification = () => {
    setShowVerification(false);
  };

  const handleToggleVerificationCollapse = () => {
    setIsVerificationCollapsed(!isVerificationCollapsed);
  };

  const handleNavigateToPage = (pageNumber: number) => {
    if (onNavigateToPage) {
      onNavigateToPage(pageNumber);
    }
  };

  return (
    <NodeWrapper level={level} ref={questionRef}>
      <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start',
            flexDirection: 'column',
            width: '100%',
          }}
          role="group"
          aria-labelledby={idAttr ? `${idAttr}-label` : undefined}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <BufferedTextField
              id={idAttr}
              value={String(value ?? '')}
              onCommit={(v) => onChange(v)}
              size="small"
              fullWidth
              commitOnBlurOnly
              placeholder={q.placeholder ?? ''}
              aria-label={commonLabel}
              aria-required={q.required}
              aria-describedby={desc ? `${idAttr}-description` : undefined}
              error={!!validationError}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-error fieldset': {
                    borderColor: 'error.main',
                    borderWidth: 2,
                  },
                },
              }}
            />
            {q.disable_ai_assistant !== true && (
              <AIAssistantButton
                ref={aiAssistantRef}
                questionId={idAttr || q.id || commonLabel}
                questionText={commonLabel}
                questionType="text"
                currentAnswer={String(value ?? '')}
                onSuggestionsGenerated={handleSuggestionsGenerated}
                onVerificationComplete={handleVerificationComplete}
                onError={handleError}
                pdfContent={pdfContent}
                hasSuggestions={suggestions.length > 0}
              />
            )}
          </Box>
          {validationError && (
            <InlineValidationFeedback error={validationError} />
          )}
          {showSuggestions && (
            <SuggestionBox
              suggestions={suggestions}
              onApply={handleApplySuggestion}
              onClose={handleCloseSuggestions}
              onFeedback={handleFeedback}
              onNavigateToPage={handleNavigateToPage}
              questionId={idAttr || q.id || commonLabel}
              isCollapsed={isCollapsed}
              onToggleCollapse={handleToggleCollapse}
              onRegenerate={handleRegenerate}
              onHighlightsChange={onHighlightsChange}
              pdfUrl={pdfUrl}
              pageWidth={pageWidth}
              loading={loading}
              error={error}
              onRetry={handleRetry}
            />
          )}
          {showVerification &&
            verificationResult &&
            verificationResult.status !== 'error' && (
              <Card
                sx={{
                  mt: 0.5,
                  mb: 1,
                  width: '100%',
                  maxWidth: '100%',
                  boxShadow: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  position: 'relative',
                  boxSizing: 'border-box',
                }}
              >
                <CardHeader
                  title={
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                        }}
                      >
                        Verification Result
                      </Typography>
                    </Box>
                  }
                  action={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip
                        title={
                          isVerificationCollapsed
                            ? 'Expand verification'
                            : 'Collapse verification'
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={handleToggleVerificationCollapse}
                          aria-label={
                            isVerificationCollapsed
                              ? 'Expand verification'
                              : 'Collapse verification'
                          }
                          aria-expanded={!isVerificationCollapsed}
                        >
                          {isVerificationCollapsed ? (
                            <ExpandMore />
                          ) : (
                            <ExpandLess />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Close verification">
                        <IconButton
                          size="small"
                          onClick={handleCloseVerification}
                          aria-label="Close verification"
                        >
                          <Close />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  sx={{
                    pb: 0.5,
                    pl: 2,
                    pr: 2,
                    py: 0.75,
                  }}
                />

                <Collapse
                  in={!isVerificationCollapsed}
                  timeout="auto"
                  unmountOnExit
                >
                  <CardContent
                    sx={{
                      pt: 0,
                      pl: 2,
                      pr: 2,
                      pb: 2,
                      '&:last-child': {
                        pb: 2,
                      },
                    }}
                  >
                    {/* Answer being verified */}
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          mb: 0.5,
                        }}
                      >
                        Answer:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                        }}
                      >
                        {String(value ?? '')}
                      </Typography>
                    </Box>

                    {/* Status and Confidence */}
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          mb: 1,
                        }}
                      >
                        Status:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={
                            verificationResult.status === 'verified'
                              ? 'Verified'
                              : 'Needs Improvement'
                          }
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.75rem',
                            height: '20px',
                          }}
                        />
                        {verificationResult.confidence !== undefined && (
                          <Chip
                            label={`${Math.round(verificationResult.confidence * 100)}% confidence`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.75rem',
                              height: '20px',
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Feedback */}
                    {verificationResult.feedback && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            mb: 0.5,
                          }}
                        >
                          Feedback:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                            color: 'text.secondary',
                          }}
                        >
                          {verificationResult.feedback}
                        </Typography>
                      </Box>
                    )}

                    {/* Evidence from Paper */}
                    {verificationResult.evidence &&
                      verificationResult.evidence.length > 0 && (
                        <Box
                          sx={{
                            mb: 2,
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              mb: 1,
                            }}
                          >
                            Evidence from Paper:
                          </Typography>
                          {verificationResult.evidence.map(
                            (evidence, index) => (
                              <Box
                                key={index}
                                sx={{
                                  mb:
                                    index <
                                    verificationResult.evidence!.length - 1
                                      ? 1.5
                                      : 0,
                                  p: 1,
                                  backgroundColor: 'background.paper',
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 0.5,
                                  }}
                                >
                                  <Chip
                                    label={`Page ${evidence.pageNumber}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                  <Chip
                                    label={
                                      evidence.supportsAnswer
                                        ? 'Supports'
                                        : 'Contradicts'
                                    }
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                    display: 'block',
                                  }}
                                >
                                  "{evidence.excerpt}"
                                </Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      )}

                    {/* Suggestions for Improvement */}
                    {verificationResult.suggestions &&
                      verificationResult.suggestions.length > 0 && (
                        <Box
                          sx={{
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              mb: 0.5,
                            }}
                          >
                            Suggestions for Improvement:
                          </Typography>
                          <Box
                            component="ul"
                            sx={{
                              m: 0,
                              pl: 2,
                              '& li': {
                                fontSize: '0.875rem',
                                color: 'text.secondary',
                              },
                            }}
                          >
                            {verificationResult.suggestions.map(
                              (suggestion, index) => (
                                <Typography
                                  component="li"
                                  variant="body2"
                                  key={index}
                                  sx={{ mb: 0.5 }}
                                >
                                  {suggestion}
                                </Typography>
                              )
                            )}
                          </Box>
                        </Box>
                      )}
                  </CardContent>
                </Collapse>
              </Card>
            )}
        </Box>
      </FieldRow>
    </NodeWrapper>
  );
};

export default TextQuestion;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Typography,
  Button,
  TextField,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
  Skeleton,
  LinearProgress,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import {
  FeedbackService,
  type Suggestion,
  type FeedbackData,
  type Evidence,
} from '../../utils/suggestions';
import {
  generateSingleEvidenceHighlightMap,
  loadPDFDocument,
} from '../../utils/pdf';

interface SuggestionBoxProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onClose: () => void;
  onFeedback: (
    suggestionId: string,
    feedback: Omit<
      FeedbackData,
      'suggestionId' | 'questionId' | 'timestamp' | 'userId'
    >
  ) => void;
  onNavigateToPage: (pageNumber: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  questionId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRegenerate?: () => void;
  onHighlightsChange?: (
    highlights: Record<
      number,
      { left: number; top: number; width: number; height: number }[]
    >
  ) => void;
  pdfUrl?: string | null;
  pageWidth?: number | null;
}

/**
 * Displays AI-generated suggestions with evidence and interaction controls.
 */
const SuggestionBox: React.FC<SuggestionBoxProps> = ({
  suggestions,
  onApply,
  onFeedback,
  onNavigateToPage,
  loading = false,
  error = null,
  onRetry,
  questionId,
  isCollapsed = false,
  onToggleCollapse,
  onRegenerate,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const firstSuggestionRef = useRef<HTMLButtonElement>(null);

  const [feedbackStates, setFeedbackStates] = useState<
    Record<
      string,
      {
        rating: 'positive' | 'negative' | null;
      }
    >
  >({});
  const [sharedFeedbackComment, setSharedFeedbackComment] =
    useState<string>('');
  const [showFeedbackConfirmation, setShowFeedbackConfirmation] =
    useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] =
    useState<number>(0);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [announceMessage, setAnnounceMessage] = useState<string>('');

  const announce = useCallback((message: string) => {
    setAnnounceMessage(message);
    setTimeout(() => setAnnounceMessage(''), 100);
  }, []);

  useEffect(() => {
    if (loading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  // PDF document loading
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const doc = await loadPDFDocument(pdfUrl);

        if (!cancelled) {
          setPdfDoc(doc);
        }
      } catch (error) {
        console.error('Error loading PDF for highlighting:', error);
        setPdfDoc(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      if (onHighlightsChange) {
        onHighlightsChange({});
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && suggestions.length > 0 && !error) {
      setShowSuccessMessage(true);
      const plural = suggestions.length !== 1 ? 's' : '';
      announce(
        `${suggestions.length} suggestion${plural} loaded. Use arrow keys to navigate, Enter to apply, or Escape to collapse.`
      );
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, suggestions.length, error, announce]);

  useEffect(() => {
    if (loading) {
      announce('Generating suggestions, please wait...');
    }
  }, [loading, announce]);

  useEffect(() => {
    if (error) {
      announce(`Error: ${error}`);
    }
  }, [error, announce]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(event.target as Node) &&
        !isCollapsed &&
        onToggleCollapse
      ) {
        onToggleCollapse();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onToggleCollapse, isCollapsed]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!isCollapsed && onToggleCollapse) {
          onToggleCollapse();
        }
        return;
      }

      if (suggestions.length === 0 || loading || isCollapsed) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (
        event.key === 'Enter' &&
        document.activeElement?.getAttribute('role') === 'article'
      ) {
        event.preventDefault();
        const focusedSuggestion = suggestions[focusedSuggestionIndex];
        if (focusedSuggestion) {
          handleApply(focusedSuggestion);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onToggleCollapse,
    isCollapsed,
    suggestions,
    loading,
    focusedSuggestionIndex,
  ]);

  useEffect(() => {
    if (!loading && suggestions.length > 0 && boxRef.current) {
      const firstSuggestion = boxRef.current.querySelector(
        '[role="article"]'
      ) as HTMLElement;
      if (firstSuggestion) {
        firstSuggestion.focus();
      }
    }
  }, [loading, suggestions.length]);

  useEffect(() => {
    if (boxRef.current && suggestions.length > 0) {
      const suggestionElements =
        boxRef.current.querySelectorAll('[role="article"]');
      const targetElement = suggestionElements[
        focusedSuggestionIndex
      ] as HTMLElement;
      if (targetElement) {
        targetElement.focus();
      }
    }
  }, [focusedSuggestionIndex, suggestions.length]);

  const handleFeedbackClick = (
    suggestionId: string,
    rating: 'positive' | 'negative'
  ) => {
    setFeedbackStates((prev) => {
      const current = prev[suggestionId];
      const newRating = current?.rating === rating ? null : rating;

      return {
        ...prev,
        [suggestionId]: {
          rating: newRating,
        },
      };
    });
  };

  const handleSharedCommentChange = (comment: string) => {
    setSharedFeedbackComment(comment);
  };

  const handleSubmitAllFeedback = () => {
    Object.entries(feedbackStates).forEach(([suggestionId, feedback]) => {
      if (feedback?.rating) {
        try {
          const suggestion = suggestions.find((s) => s.id === suggestionId);

          const feedbackData: FeedbackData = {
            suggestionId,
            questionId,
            rating: feedback.rating,
            comment: sharedFeedbackComment || undefined,
            timestamp: Date.now(),
            suggestionText: suggestion?.text,
            suggestionRank: suggestion?.rank,
          };

          FeedbackService.saveFeedback(feedbackData);

          onFeedback(suggestionId, {
            rating: feedback.rating,
            comment: sharedFeedbackComment || undefined,
          });
        } catch (error) {
          console.error('Failed to save feedback:', error);
        }
      }
    });

    const ratedCount = Object.values(feedbackStates).filter(
      (f) => f?.rating
    ).length;
    if (ratedCount > 0) {
      setFeedbackMessage(
        `Thank you for rating ${ratedCount} suggestion${ratedCount !== 1 ? 's' : ''}!`
      );
      setShowFeedbackConfirmation(true);
    }
  };

  const handleCloseFeedbackConfirmation = () => {
    setShowFeedbackConfirmation(false);
  };

  const handleApply = (suggestion: Suggestion) => {
    onApply(suggestion);
  };

  const handlePageClick = async (evidence: Evidence, suggestionId: string) => {
    onNavigateToPage(evidence.pageNumber);

    if (pdfDoc && pageWidth && onHighlightsChange) {
      try {
        const evidenceId = `${suggestionId}-${evidence.pageNumber}`;
        setActiveEvidenceId(evidenceId);

        const highlights = await generateSingleEvidenceHighlightMap(
          pdfDoc,
          pageWidth,
          evidence,
          suggestionId
        );

        onHighlightsChange(highlights);
      } catch (error) {
        console.error('Error generating highlights:', error);
      }
    }
  };

  const getRankLabel = (rank: number): string => {
    switch (rank) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${rank}th`;
    }
  };

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

      <Card
        ref={boxRef}
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
        role="dialog"
        aria-labelledby="suggestions-title"
        aria-describedby="suggestions-description"
        aria-modal="false"
        aria-live="polite"
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                id="suggestions-title"
                variant="body2"
                component="div"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                AI Suggestions
              </Typography>
              {!loading && suggestions.length > 0 && (
                <Chip
                  label={`${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''} available`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: '20px',
                  }}
                />
              )}
            </Box>
          }
          action={
            onToggleCollapse && !loading && suggestions.length > 0 ? (
              <Tooltip
                title={
                  isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'
                }
              >
                <IconButton
                  aria-label={
                    isCollapsed ? 'Expand suggestions' : 'Collapse suggestions'
                  }
                  aria-expanded={!isCollapsed}
                  onClick={onToggleCollapse}
                  size="small"
                  tabIndex={0}
                >
                  {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              </Tooltip>
            ) : null
          }
          sx={{
            pb: 0.5,
            pl: 2,
            pr: 2,
            py: 0.75,
          }}
        />

        <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
          <CardContent
            sx={{
              pt: 0,
              pl: 2,
              pr: 2,
              pb: 0,
              '&:last-child': {
                pb: 0,
              },
              overflowY: 'visible',
              overflowX: 'hidden',
            }}
          >
            {loading && (
              <LinearProgress
                variant="determinate"
                value={loadingProgress}
                sx={{
                  mb: 2,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(232, 97, 97, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#e86161',
                  },
                }}
              />
            )}

            {error ? (
              <Box sx={{ mb: 2 }}>
                <Alert
                  severity="error"
                  action={
                    onRetry ? (
                      <Button color="inherit" size="small" onClick={onRetry}>
                        Retry
                      </Button>
                    ) : undefined
                  }
                >
                  {error}
                </Alert>
              </Box>
            ) : loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[1, 2, 3].map((index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <Skeleton
                          variant="rectangular"
                          width={50}
                          height={24}
                          sx={{ borderRadius: 3 }}
                        />
                        <Skeleton
                          variant="rectangular"
                          width={120}
                          height={24}
                          sx={{ borderRadius: 3 }}
                        />
                      </Box>

                      <Skeleton
                        variant="text"
                        width="100%"
                        height={28}
                        sx={{ mb: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width="85%"
                        height={28}
                        sx={{ mb: 2 }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <Skeleton
                          variant="text"
                          width={80}
                          height={20}
                          sx={{ mb: 1 }}
                        />
                        <Box
                          sx={{
                            pl: 2,
                            py: 0.5,
                            borderLeft: '3px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Skeleton variant="text" width="90%" height={20} />
                          <Skeleton variant="text" width="75%" height={20} />
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          alignItems: 'center',
                          pt: 1,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Skeleton
                          variant="rectangular"
                          width={90}
                          height={32}
                          sx={{ borderRadius: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    mt: 2,
                  }}
                >
                  <CircularProgress size={20} sx={{ color: '#e86161' }} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing PDF and generating suggestions...
                  </Typography>
                </Box>
              </Box>
            ) : suggestions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No suggestions available
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {suggestions.map((suggestion, index) => {
                  const feedbackState = feedbackStates[suggestion.id];

                  return (
                    <Box key={suggestion.id}>
                      <Box
                        role="article"
                        aria-label={`Suggestion ${index + 1} of ${suggestions.length}: ${suggestion.text}`}
                        tabIndex={0}
                        onFocus={() => setFocusedSuggestionIndex(index)}
                        sx={{
                          outline: 'none',
                          p: 2,
                          borderRadius: 1,
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s ease-in-out',
                          '&:focus': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
                            outline: 'none',
                            borderColor: 'rgba(25, 118, 210, 0.3)',
                          },
                          '&:focus-visible': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
                            outline: 'none',
                            borderColor: 'rgba(25, 118, 210, 0.3)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip
                            label={getRankLabel(suggestion.rank)}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                            aria-label={`Ranked ${getRankLabel(suggestion.rank)}`}
                          />
                          {suggestion.confidence > 0 && (
                            <Chip
                              label={`${Math.round(suggestion.confidence * 100)}% confidence`}
                              size="small"
                              variant="outlined"
                              aria-label={`Confidence level: ${Math.round(suggestion.confidence * 100)} percent`}
                            />
                          )}
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            fontWeight: 400,
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          {suggestion.text}
                        </Typography>

                        {suggestion.evidence &&
                          suggestion.evidence.length > 0 && (
                            <Box
                              sx={{ mb: 2 }}
                              role="region"
                              aria-label="Supporting evidence"
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 1,
                                }}
                                id={`evidence-label-${suggestion.id}`}
                              >
                                Evidence:
                              </Typography>
                              {suggestion.evidence.map(
                                (evidence, evidenceIndex) => {
                                  const evidenceId = `${suggestion.id}-${evidence.pageNumber}`;
                                  const isActive =
                                    activeEvidenceId === evidenceId;

                                  return (
                                    <Box
                                      key={evidenceIndex}
                                      sx={{
                                        pl: 2,
                                        py: 0.5,
                                        borderLeft: '3px solid',
                                        borderColor: isActive
                                          ? 'warning.main'
                                          : 'primary.main',
                                        mb: 1.5,
                                        transition: 'border-color 0.3s ease',
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          mb: 0.5,
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                        }}
                                      >
                                        <Tooltip title="Click to navigate to this page and highlight evidence">
                                          <Button
                                            size="small"
                                            onClick={() =>
                                              handlePageClick(
                                                evidence,
                                                suggestion.id
                                              )
                                            }
                                            aria-label={`Navigate to page ${evidence.pageNumber} in PDF and highlight evidence`}
                                            sx={{
                                              minWidth: 'auto',
                                              p: 0,
                                              textTransform: 'none',
                                              fontWeight: 600,
                                              textDecoration: 'underline',
                                              color: isActive
                                                ? 'warning.main'
                                                : 'primary.main',
                                              '&:hover': {
                                                textDecoration: 'underline',
                                                backgroundColor: 'transparent',
                                              },
                                            }}
                                          >
                                            Page {evidence.pageNumber}
                                          </Button>
                                        </Tooltip>
                                        {' - '}
                                        <Typography
                                          component="span"
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{
                                            fontStyle: 'italic',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                          }}
                                        >
                                          "{evidence.excerpt}"
                                        </Typography>
                                      </Typography>
                                    </Box>
                                  );
                                }
                              )}
                            </Box>
                          )}

                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'center',
                            mb: 1.5,
                            pt: 1,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          }}
                          role="group"
                          aria-label="Suggestion actions"
                        >
                          <Button
                            ref={index === 0 ? firstSuggestionRef : undefined}
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleApply(suggestion)}
                            aria-label={`Apply suggestion: ${suggestion.text}`}
                            sx={{
                              textTransform: 'none',
                              backgroundColor: '#e86161',
                              fontSize: '0.875rem',
                              '&:hover': {
                                backgroundColor: '#d45151',
                              },
                            }}
                          >
                            Apply
                          </Button>

                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              ml: 'auto',
                            }}
                            role="group"
                            aria-label="Provide feedback on suggestion quality"
                          >
                            <Tooltip title="Helpful suggestion">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleFeedbackClick(suggestion.id, 'positive')
                                }
                                sx={{
                                  color:
                                    feedbackState?.rating === 'positive'
                                      ? 'success.main'
                                      : 'action.active',
                                  padding: '8px',
                                  '&:hover': {
                                    backgroundColor: 'success.light',
                                    color: 'success.dark',
                                  },
                                }}
                                aria-label={
                                  feedbackState?.rating === 'positive'
                                    ? 'Marked as helpful (selected)'
                                    : 'Mark as helpful'
                                }
                                aria-pressed={
                                  feedbackState?.rating === 'positive'
                                }
                              >
                                <ThumbUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Not helpful">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleFeedbackClick(suggestion.id, 'negative')
                                }
                                sx={{
                                  color:
                                    feedbackState?.rating === 'negative'
                                      ? 'error.main'
                                      : 'action.active',
                                  padding: '8px',
                                  '&:hover': {
                                    backgroundColor: 'error.light',
                                    color: 'error.dark',
                                  },
                                }}
                                aria-label={
                                  feedbackState?.rating === 'negative'
                                    ? 'Marked as not helpful (selected)'
                                    : 'Mark as not helpful'
                                }
                                aria-pressed={
                                  feedbackState?.rating === 'negative'
                                }
                              >
                                <ThumbDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

                <Box
                  sx={{
                    mt: 3,
                    pt: 2.5,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      mb: 1,
                      fontWeight: 500,
                    }}
                    id="shared-feedback-label"
                  >
                    Additional feedback (optional)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    placeholder="Share your thoughts on the suggestions..."
                    value={sharedFeedbackComment}
                    onChange={(e) => handleSharedCommentChange(e.target.value)}
                    onBlur={handleSubmitAllFeedback}
                    aria-label="Additional feedback for all suggestions"
                    aria-describedby="shared-feedback-label"
                    sx={{
                      mb: 2,
                      '& .MuiInputBase-input': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </Box>

                {onRegenerate && !loading && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      pb: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={onRegenerate}
                      aria-label="Regenerate suggestions"
                      sx={{
                        textTransform: 'none',
                        borderColor: '#e86161',
                        color: '#e86161',
                        '&:hover': {
                          borderColor: '#d45151',
                          backgroundColor: 'rgba(232, 97, 97, 0.04)',
                        },
                      }}
                    >
                      Regenerate Suggestions
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>

      <Snackbar
        open={showFeedbackConfirmation}
        autoHideDuration={3000}
        onClose={handleCloseFeedbackConfirmation}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseFeedbackConfirmation}
          severity={feedbackMessage.includes('Failed') ? 'error' : 'success'}
          sx={{ width: '100%', fontSize: '0.875rem' }}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccessMessage(false)}
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ width: '100%', fontSize: '0.875rem' }}
        >
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}{' '}
          generated successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default SuggestionBox;

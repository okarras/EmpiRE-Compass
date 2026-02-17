import React, { useState, useRef } from 'react';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Close from '@mui/icons-material/Close';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import AIAssistantButton, {
  type AIAssistantButtonRef,
} from '../AIAssistantButton';
import SuggestionBox from '../SuggestionBox';
import type { Suggestion } from '../../../utils/suggestions';
import type { AIVerificationResult } from '../../../services/backendAIService';
import type { StructuredDocument } from '../../../utils/structuredPdfExtractor';
import type { SemanticDocument } from '../../../utils/semanticChunker';
import type { ParentContext } from '../../../types/context';

const MultiSelectQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
  pdfContent?: string;
  structuredDocument?: StructuredDocument | null;
  semanticDocument?: SemanticDocument | null;
  isProcessingPdf?: boolean;
  onNavigateToPage?: (pageNumber: number) => void;
  onHighlightsChange?: (
    highlights: Record<
      number,
      { left: number; top: number; width: number; height: number }[]
    >
  ) => void;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  questionRef?: (element: HTMLElement | null) => void;
  onAIVerificationComplete?: (result: AIVerificationResult) => void;
  parentContext?: ParentContext;
  allAnswers?: Record<string, any>;
  siblingQuestionIds?: string[];
  questionDefinitions?: Record<string, any>;
  allEntries?: any[];
  currentEntryIndex?: number;
}> = ({
  q,
  value,
  onChange,
  level = 0,
  pdfContent,
  structuredDocument,
  isProcessingPdf,
  onNavigateToPage,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
  questionRef,
  onAIVerificationComplete,
  parentContext,
  allAnswers,
  siblingQuestionIds,
  questionDefinitions,
  allEntries,
  currentEntryIndex,
}) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';
  const opts = q.options ?? [];

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

  const parseSuggestionText = (text: string | string[]): string[] => {
    if (Array.isArray(text)) {
      return text
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
    }

    const textStr = String(text);
    const separators = [',', ';', '\n', '|'];

    for (const separator of separators) {
      if (textStr.includes(separator)) {
        return textStr
          .split(separator)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    }

    return [textStr.trim()];
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const suggestedItems = parseSuggestionText(suggestion.text);
    const matchedOptions: string[] = [];

    suggestedItems.forEach((item) => {
      const itemLower = item.toLowerCase().trim();
      const exactMatch = opts.find(
        (opt: string) => opt.toLowerCase().trim() === itemLower
      );

      if (exactMatch) {
        matchedOptions.push(exactMatch);
      } else {
        const partialMatch = opts.find(
          (opt: string) =>
            opt.toLowerCase().includes(itemLower) ||
            itemLower.includes(opt.toLowerCase())
        );

        if (partialMatch) {
          matchedOptions.push(partialMatch);
        }
      }
    });

    if (matchedOptions.length > 0) {
      const uniqueOptions = Array.from(new Set(matchedOptions));
      onChange(uniqueOptions);
    } else {
      console.warn(
        'Suggestion does not match any available options:',
        suggestion.text
      );
      onChange(suggestedItems);
    }
    setIsCollapsed(true);
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
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

  const handleFeedback = (_suggestionId: string, _feedback: any) => {};

  const handleNavigateToPage = (pageNumber: number) => {
    if (onNavigateToPage) {
      onNavigateToPage(pageNumber);
    }
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
          aria-labelledby={q.id ? `${q.id}-label` : undefined}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={Array.isArray(value) ? value : []}
                onChange={(e) => {
                  const v = (e.target as any).value;
                  onChange(typeof v === 'string' ? v.split(',') : v);
                }}
                input={<OutlinedInput />}
                aria-label={commonLabel}
                aria-required={q.required}
                aria-describedby={desc ? `${q.id}-description` : undefined}
                inputProps={{
                  'aria-label': `${commonLabel} (multiple selection)`,
                }}
                renderValue={(selected: any) => (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(selected as string[]).map((s) => (
                      <Chip key={s} label={s} size="small" />
                    ))}
                  </Box>
                )}
              >
                {opts.map((opt: string) => (
                  <MenuItem key={opt} value={opt}>
                    <Checkbox
                      checked={
                        Array.isArray(value) ? value.indexOf(opt) > -1 : false
                      }
                      inputProps={
                        {
                          'aria-label': `Select ${opt}`,
                        } as any
                      }
                    />
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {q.disable_ai_assistant !== true && (
              <AIAssistantButton
                ref={aiAssistantRef}
                questionId={q.id || commonLabel}
                questionText={commonLabel}
                questionType="multi_select"
                questionOptions={opts}
                currentAnswer={
                  Array.isArray(value) ? value.join(', ') : String(value ?? '')
                }
                onSuggestionsGenerated={handleSuggestionsGenerated}
                onVerificationComplete={handleVerificationComplete}
                onError={handleError}
                pdfContent={pdfContent}
                structuredDocument={structuredDocument}
                isProcessingPdf={isProcessingPdf}
                hasSuggestions={suggestions.length > 0}
                parentContext={parentContext}
                allAnswers={allAnswers}
                siblingQuestionIds={siblingQuestionIds}
                questionDefinitions={questionDefinitions}
                allEntries={allEntries}
                currentEntryIndex={currentEntryIndex}
              />
            )}
          </Box>
          {showSuggestions && (
            <SuggestionBox
              suggestions={suggestions}
              onApply={handleApplySuggestion}
              onClose={handleCloseSuggestions}
              onFeedback={handleFeedback}
              onNavigateToPage={handleNavigateToPage}
              questionId={q.id || commonLabel}
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
                    {/* Status and Confidence */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        mb: 2,
                        alignItems: 'center',
                      }}
                    >
                      <Chip
                        label={
                          verificationResult.status === 'verified'
                            ? 'Verified'
                            : 'Needs Improvement'
                        }
                        color={
                          verificationResult.status === 'verified'
                            ? 'success'
                            : 'warning'
                        }
                        icon={
                          verificationResult.status === 'verified' ? (
                            <CheckCircle />
                          ) : (
                            <Warning />
                          )
                        }
                        size="small"
                      />
                      {verificationResult.confidence !== undefined && (
                        <Chip
                          label={`${Math.round(verificationResult.confidence * 100)}% confidence`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {/* Feedback */}
                    {verificationResult.feedback && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 1.5,
                          backgroundColor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mb: 0.5,
                            fontWeight: 500,
                            color: 'text.secondary',
                          }}
                        >
                          Feedback
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.primary',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {verificationResult.feedback}
                        </Typography>
                      </Box>
                    )}

                    {/* Evidence from Paper */}
                    {verificationResult.evidence &&
                      verificationResult.evidence.length > 0 && (
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mb: 1,
                              fontWeight: 500,
                              color: 'text.secondary',
                            }}
                          >
                            Evidence from Paper
                          </Typography>
                          {verificationResult.evidence.map((ev, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                mb: 1.5,
                                p: 1.5,
                                backgroundColor: 'background.paper',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:last-child': {
                                  mb: 0,
                                },
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  mb: 0.5,
                                  fontStyle: 'italic',
                                }}
                              >
                                "{ev.excerpt}"
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  display: 'block',
                                }}
                              >
                                Page {ev.pageNumber}
                              </Typography>
                            </Box>
                          ))}
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

export default MultiSelectQuestion;

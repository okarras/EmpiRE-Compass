import React, { useState, useRef, useEffect } from 'react';
import NodeWrapper from '../NodeWrapper';
import BufferedTextField from '../BufferedTextField';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Typography from '@mui/material/Typography';
import InfoTooltip from '../InfoTooltip';
import AIAssistantButton, {
  type AIAssistantButtonRef,
} from '../AIAssistantButton';
import SuggestionBox from '../SuggestionBox';
import type { Suggestion } from '../../../utils/suggestions';
import type { AIVerificationResult } from '../../../services/backendAIService';
import type { StructuredDocument } from '../../../utils/structuredPdfExtractor';
import type { SemanticDocument } from '../../../utils/semanticChunker';
import type { ParentContext } from '../../../types/context';

const RepeatTextQuestion: React.FC<{
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
  idAttr,
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
  const arr: string[] = Array.isArray(value) ? value : [];
  const desc = q.desc ?? q.description ?? '';

  const aiAssistantRef = useRef<AIAssistantButtonRef>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const parseSuggestionText = (text: string): string[] => {
    const separators = ['\n', ';', ',', '|'];

    for (const separator of separators) {
      if (text.includes(separator)) {
        return text
          .split(separator)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    }

    return [text.trim()];
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const suggestedItems = parseSuggestionText(suggestion.text);
    onChange([...arr, ...suggestedItems]);
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

  // Initialize required repeat_text fields with one empty entry
  useEffect(() => {
    if (q.required && (!Array.isArray(value) || value.length === 0)) {
      onChange(['']);
    }
  }, [q.required, q.id]);

  return (
    <NodeWrapper level={level} ref={questionRef}>
      <Box
        role="group"
        aria-labelledby={idAttr ? `${idAttr}-label` : undefined}
        aria-describedby={desc ? `${idAttr}-description` : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography
            variant="subtitle2"
            id={idAttr ? `${idAttr}-label` : undefined}
          >
            {q.label}
            {q.required ? ' *' : ''}
          </Typography>
          <InfoTooltip desc={desc} />
          {q.disable_ai_assistant !== true && (
            <Box
              sx={{
                display: 'inline-block',
              }}
            >
              <AIAssistantButton
                ref={aiAssistantRef}
                questionId={idAttr || q.id || q.label}
                questionText={q.label}
                questionType="repeat_text"
                currentAnswer={
                  Array.isArray(value) ? value.join(', ') : String(value ?? '')
                }
                onSuggestionsGenerated={handleSuggestionsGenerated}
                onVerificationComplete={onAIVerificationComplete}
                onError={handleError}
                pdfContent={pdfContent}
                structuredDocument={structuredDocument}
                isProcessingPdf={isProcessingPdf}
                parentContext={parentContext}
                allAnswers={allAnswers}
                siblingQuestionIds={siblingQuestionIds}
                questionDefinitions={questionDefinitions}
                allEntries={allEntries}
                currentEntryIndex={currentEntryIndex}
              />
            </Box>
          )}
        </Box>
        {desc && (
          <Typography
            variant="caption"
            color="text.secondary"
            id={idAttr ? `${idAttr}-description` : undefined}
            sx={{ display: 'none' }}
          >
            {desc}
          </Typography>
        )}
        {showSuggestions && (
          <Box sx={{ mb: 1 }}>
            <SuggestionBox
              suggestions={suggestions}
              onApply={handleApplySuggestion}
              onClose={handleCloseSuggestions}
              onFeedback={handleFeedback}
              onNavigateToPage={handleNavigateToPage}
              questionId={q.id || q.label}
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
          </Box>
        )}
        <Stack spacing={1} role="list" aria-label={`${q.label} items`}>
          {arr.map((v, i) => {
            const canDelete = !q.required || arr.length > 1;
            return (
              <Box key={i} sx={{ display: 'flex', gap: 1 }} role="listitem">
                <BufferedTextField
                  id={`${idAttr ?? 'repeat_text'}-${i}`}
                  value={String(v ?? '')}
                  onCommit={(val) => {
                    const copy = [...arr];
                    copy[i] = val;
                    onChange(copy);
                  }}
                  size="small"
                  fullWidth
                  commitOnBlurOnly
                  aria-label={`${q.label} item ${i + 1}`}
                  aria-required={q.required}
                />
                <IconButton
                  size="small"
                  disabled={!canDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    const copy = [...arr];
                    copy.splice(i, 1);
                    onChange(copy);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={
                    !canDelete
                      ? `Cannot delete last required ${q.label} item`
                      : `Delete ${q.label} item ${i + 1}`
                  }
                  sx={{
                    opacity: canDelete ? 1 : 0.4,
                    cursor: canDelete ? 'pointer' : 'not-allowed',
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            );
          })}
          <Button
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange([...arr, '']);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={`Add new ${q.label} item`}
          >
            Add
          </Button>
        </Stack>
      </Box>
    </NodeWrapper>
  );
};

export default RepeatTextQuestion;

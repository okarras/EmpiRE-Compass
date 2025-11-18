import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import BufferedTextField from '../BufferedTextField';
import SuggestButton, { type SuggestButtonRef } from '../SuggestButton';
import SuggestionBox from '../SuggestionBox';
import type { Suggestion } from '../../../utils/suggestions';

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
}) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';

  const suggestButtonRef = useRef<SuggestButtonRef>(null);

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

  const handleApplySuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
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
    if (suggestButtonRef.current) {
      await suggestButtonRef.current.triggerGeneration();
    }
  };

  const handleRetry = () => {
    setError(null);
    setShowSuggestions(false);
  };

  const handleFeedback = (suggestionId: string, feedback: any) => {
    console.log('Feedback received:', { suggestionId, feedback });
  };

  const handleNavigateToPage = (pageNumber: number) => {
    if (onNavigateToPage) {
      onNavigateToPage(pageNumber);
    }
  };

  return (
    <NodeWrapper level={level}>
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
            />
            <Box sx={{ display: suggestions.length === 0 ? 'block' : 'none' }}>
              <SuggestButton
                ref={suggestButtonRef}
                questionText={commonLabel}
                questionType="text"
                onSuggestionsGenerated={handleSuggestionsGenerated}
                onError={handleError}
                pdfContent={pdfContent}
              />
            </Box>
          </Box>
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
        </Box>
      </FieldRow>
    </NodeWrapper>
  );
};

export default TextQuestion;

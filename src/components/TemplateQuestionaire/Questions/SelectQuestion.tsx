import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import AIAssistantButton, {
  type AIAssistantButtonRef,
} from '../AIAssistantButton';
import SuggestionBox from '../SuggestionBox';
import type { Suggestion } from '../../../utils/suggestions';
import type { AIVerificationResult } from '../../../services/backendAIService';
import type { StructuredDocument } from '../../../utils/structuredPdfExtractor';
import type { SemanticDocument } from '../../../utils/semanticChunker';
import type { ParentContext } from '../../../types/context';

const SelectQuestion: React.FC<{
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
  const opts =
    q.options && q.options.length
      ? q.options
      : q.type === 'boolean'
        ? ['yes', 'no']
        : [];

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

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const suggestionLower = suggestion.text.toLowerCase().trim();
    const matchedOption = opts.find(
      (opt: string) => opt.toLowerCase().trim() === suggestionLower
    );

    if (matchedOption) {
      onChange(matchedOption);
    } else {
      const partialMatch = opts.find(
        (opt: string) =>
          opt.toLowerCase().includes(suggestionLower) ||
          suggestionLower.includes(opt.toLowerCase())
      );

      if (partialMatch) {
        onChange(partialMatch);
      } else {
        console.warn(
          'Suggestion does not match any available options:',
          suggestion.text
        );
        onChange(suggestion.text);
      }
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
                value={value ?? ''}
                onChange={(e) => onChange((e.target as any).value)}
                displayEmpty
                input={<OutlinedInput />}
                aria-label={commonLabel}
                aria-required={q.required}
                aria-describedby={desc ? `${q.id}-description` : undefined}
                inputProps={{
                  'aria-label': commonLabel,
                }}
              >
                {opts.map((opt: string) => (
                  <MenuItem key={opt} value={opt}>
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
                questionType="select"
                questionOptions={opts}
                currentAnswer={String(value ?? '')}
                onSuggestionsGenerated={handleSuggestionsGenerated}
                onVerificationComplete={onAIVerificationComplete}
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
        </Box>
      </FieldRow>
    </NodeWrapper>
  );
};

export default SelectQuestion;

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
import SuggestButton, { type SuggestButtonRef } from '../SuggestButton';
import SuggestionBox from '../SuggestionBox';
import type { Suggestion } from '../../../utils/suggestions';

const MultiSelectQuestion: React.FC<{
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
  level = 0,
  pdfContent,
  onNavigateToPage,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
}) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';
  const opts = q.options ?? [];

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

  const parseSuggestionText = (text: string): string[] => {
    const separators = [',', ';', '\n', '|'];

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
            <Box sx={{ display: suggestions.length === 0 ? 'block' : 'none' }}>
              <SuggestButton
                ref={suggestButtonRef}
                questionText={commonLabel}
                questionType="multi_select"
                questionOptions={opts}
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

export default MultiSelectQuestion;

import { useState, useCallback, useRef } from 'react';
import { useAIService } from '../services/backendAIService';
import { formatErrorMessage, type Suggestion } from '../utils/suggestions';

interface UseSuggestionGeneratorProps {
  questionText: string;
  questionType: string;
  questionOptions?: string[];
  pdfContent?: string;
}

interface UseSuggestionGeneratorReturn {
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  rawError: unknown;
  generateSuggestions: () => Promise<void>;
  clearSuggestions: () => void;
}

// Cache Key Generation
const generateCacheKey = (questionText: string, pdfContent: string): string => {
  const hash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const questionHash = hash(questionText);
  const pdfHash = hash(pdfContent.substring(0, 1000));
  return `suggestion_${questionHash}_${pdfHash}`;
};

//  Hook for generating AI-powered suggestions for questionnaire questions.
//  Handles caching, validation, and error states.

const useSuggestionGenerator = ({
  questionText,
  questionType,
  questionOptions,
  pdfContent,
}: UseSuggestionGeneratorProps): UseSuggestionGeneratorReturn => {
  const aiService = useAIService();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  const lastRequestRef = useRef<string | null>(null);

  const generateSuggestions = useCallback(async () => {
    if (!questionText?.trim()) {
      setError('Failed to generate suggestions: Question text is required.');
      return;
    }

    if (!pdfContent?.trim()) {
      setError(
        'Failed to generate suggestions: PDF content is required. Please ensure a PDF is loaded and text extraction has completed successfully.'
      );
      return;
    }

    const cacheKey = generateCacheKey(questionText, pdfContent);

    if (lastRequestRef.current === cacheKey && loading) {
      return;
    }

    lastRequestRef.current = cacheKey;
    setLoading(true);
    setError(null);
    setRawError(null);

    try {
      const response = await aiService.generateSuggestions({
        questionText,
        questionType,
        questionOptions,
        pdfContent,
      });

      if (!response.suggestions?.length) {
        throw new Error(
          'Failed to generate suggestions: No suggestions were generated. Please try again.'
        );
      }

      setSuggestions(response.suggestions);
      setError(null);
      setRawError(null);
    } catch (err) {
      setError(formatErrorMessage(err, 'generate suggestions'));
      setRawError(err);
      setSuggestions([]);
    } finally {
      setLoading(false);
      lastRequestRef.current = null;
    }
  }, [
    questionText,
    questionType,
    questionOptions,
    pdfContent,
    aiService,
    loading,
  ]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setRawError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    rawError,
    generateSuggestions,
    clearSuggestions,
  };
};

export default useSuggestionGenerator;

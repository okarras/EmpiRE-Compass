import { useState, useCallback, useRef } from 'react';
import { useAIService } from '../services/backendAIService';
import {
  formatErrorMessage,
  type Suggestion,
  FeedbackService,
} from '../utils/suggestions';
import type { ParentContext } from '../types/context';
import { contextGatherer } from '../utils/contextGatherer';
import { useQuestionnaireAI } from '../context/QuestionnaireAIContext';
import type { StructuredDocument } from '../utils/structuredPdfExtractor';
import { useAppSelector } from '../store/hooks';

interface UseSuggestionGeneratorProps {
  questionText: string;
  questionType: string;
  questionOptions?: string[];
  pdfContent?: string;
  questionId?: string;
  parentContext?: ParentContext;
  allAnswers?: Record<string, any>;
  siblingQuestionIds?: string[];
  questionDefinitions?: Record<string, any>;
  allEntries?: any[];
  currentEntryIndex?: number;
  structuredDocument?: StructuredDocument | null;
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

const useSuggestionGenerator = ({
  questionText,
  questionType,
  questionOptions,
  pdfContent,
  questionId,
  parentContext,
  allAnswers,
  siblingQuestionIds,
  questionDefinitions,
  allEntries,
  currentEntryIndex,
  structuredDocument,
}: UseSuggestionGeneratorProps): UseSuggestionGeneratorReturn => {
  const aiService = useAIService();
  const { getHistoryByQuestion } = useQuestionnaireAI();

  const aiConfig = useAppSelector((state) => state.ai);

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
      const previousFeedback = questionId
        ? FeedbackService.getFeedbackForQuestion(questionId)
        : [];

      let contextHistory = questionId ? getHistoryByQuestion(questionId) : [];

      if (previousFeedback.length > 0) {
        const feedbackMap = new Map(
          previousFeedback.map((f) => [f.suggestionId, f])
        );

        contextHistory = contextHistory.map((item) => {
          const suggestionId = item.metadata?.originalSuggestionId;
          if (suggestionId && feedbackMap.has(suggestionId)) {
            const feedback = feedbackMap.get(suggestionId)!;
            return {
              ...item,
              metadata: {
                ...item.metadata,
                feedback: {
                  rating: feedback.rating,
                  comment: feedback.comment,
                },
              },
            };
          }
          return item;
        });
      }

      const siblingContext =
        siblingQuestionIds && allAnswers && questionDefinitions && questionId
          ? contextGatherer.gatherSiblingContext(
              questionId,
              siblingQuestionIds,
              allAnswers,
              questionDefinitions
            )
          : undefined;

      const previousEntryContext =
        allEntries &&
        currentEntryIndex !== undefined &&
        questionDefinitions &&
        currentEntryIndex > 0
          ? contextGatherer.gatherPreviousEntryContext(
              currentEntryIndex,
              allEntries,
              Object.values(questionDefinitions)
            )
          : undefined;

      const truncatedContexts = contextGatherer.applyTokenLimits({
        parentContext,
        siblingContext,
        previousEntryContext,
      });

      if (truncatedContexts.truncated) {
        console.log('Context was truncated to fit within token limits');
      }

      let pdfContentForLLM = pdfContent;

      if (structuredDocument) {
        try {
          console.log(
            '[useSuggestionGenerator] Using backend semantic chunking for content selection'
          );

          const semanticResult = await aiService.getSemanticChunks(
            questionText,
            structuredDocument.pages,
            4000
          );

          console.log(
            `[useSuggestionGenerator] Backend returned ${semanticResult.totalChunks} relevant chunks (${semanticResult.totalTokens} tokens)`
          );

          const formattedChunks = semanticResult.chunks
            .map(
              (chunk: {
                text: string;
                pageNumber: number;
                similarity: number;
                tokenEstimate: number;
              }) => {
                return `[PAGE ${chunk.pageNumber}]\n${chunk.text}`;
              }
            )
            .join('\n\n');

          pdfContentForLLM = formattedChunks;

          console.log(
            `[useSuggestionGenerator] Formatted content length: ${pdfContentForLLM.length} chars`
          );
        } catch (error) {
          console.error(
            '[useSuggestionGenerator] Backend semantic chunking failed, falling back to full text:',
            error
          );
          pdfContentForLLM = pdfContent;
        }
      } else {
        console.log(
          '[useSuggestionGenerator] No structured document available, using full PDF content'
        );
      }

      const response = await aiService.generateSuggestions({
        questionText,
        questionType,
        questionOptions,
        pdfContent: pdfContentForLLM,
        contextHistory: contextHistory.length > 0 ? contextHistory : undefined,
        parentContext: truncatedContexts.parentContext,
        siblingContext: truncatedContexts.siblingContext,
        previousEntryContext: truncatedContexts.previousEntryContext,
        provider: aiConfig.provider,
        model:
          aiConfig.provider === 'openai'
            ? aiConfig.openaiModel
            : aiConfig.provider === 'groq'
              ? aiConfig.groqModel
              : aiConfig.mistralModel,
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
    questionId,
    aiService,
    loading,
    parentContext,
    allAnswers,
    allEntries,
    currentEntryIndex,
    siblingQuestionIds,
    questionDefinitions,
    structuredDocument,
    aiConfig.provider,
    aiConfig.openaiModel,
    aiConfig.groqModel,
    aiConfig.mistralModel,
    getHistoryByQuestion,
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

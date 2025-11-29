export interface AppError extends Error {
  status?: number;
  requiresAuth?: boolean;
  resetIn?: number;
  resetAt?: string;
}

export interface Evidence {
  pageNumber: number;
  excerpt: string;
  context?: string;
  startIndex?: number;
  endIndex?: number;
}

export interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EvidenceHighlight {
  evidence: Evidence;
  suggestionId: string;
  rects: HighlightRect[];
}

export interface Suggestion {
  id: string;
  rank: number;
  text: string;
  confidence: number;
  evidence: Evidence[];
  createdAt: number;
}

export interface FeedbackData {
  suggestionId: string;
  questionId: string;
  rating: 'positive' | 'negative';
  comment?: string;
  timestamp: number;
  userId?: string;
  suggestionText?: string;
  suggestionRank?: number;
}

export interface GenerateSuggestionsRequest {
  questionText: string;
  questionType: string;
  questionOptions?: string[];
  pdfContent: string;
  pdfMetadata?: {
    filename: string;
    totalPages: number;
  };
  provider?: string;
  model?: string;
  previousFeedback?: FeedbackData[];
  contextHistory?: Array<{
    id: string;
    type: string;
    content: string;
    timestamp: number;
    metadata?: any;
  }>;
}

export interface GenerateSuggestionsResponse {
  suggestions: Suggestion[];
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const isAuthError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const err = error as AppError;
  const errorMessage = err.message.toLowerCase();

  return (
    err.status === 401 ||
    err.requiresAuth === true ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('log in')
  );
};

export const isRateLimitError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const err = error as AppError;
  const errorMessage = err.message.toLowerCase();

  return err.status === 429 || errorMessage.includes('rate limit');
};

export const isConfigError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();

  return (
    errorMessage.includes('api key') ||
    errorMessage.includes('not configured') ||
    errorMessage.includes('configuration') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('unauthorized')
  );
};

const isNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();

  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection')
  );
};

export const formatErrorMessage = (
  error: unknown,
  context: string = 'operation'
): string => {
  if (!(error instanceof Error)) {
    return `Failed to ${context}: An unexpected error occurred.`;
  }

  if (isAuthError(error)) {
    return `Failed to ${context}: Authentication required. Please log in to continue.`;
  }

  if (isRateLimitError(error)) {
    const resetMessage = getRetryMessage(error as AppError);
    return `Failed to ${context}: Rate limit exceeded.${resetMessage ? ' ' + resetMessage : ''}`;
  }

  if (isConfigError(error)) {
    return `Failed to ${context}: AI service is not properly configured. Please check your AI settings and ensure your API key is valid.`;
  }

  const lowerMessage = error.message.toLowerCase();

  if (
    lowerMessage.includes('pdf') ||
    lowerMessage.includes('extract') ||
    lowerMessage.includes('document')
  ) {
    return `Failed to ${context}: Could not process PDF content. Please ensure the PDF is valid.`;
  }

  if (
    lowerMessage.includes('parse') ||
    lowerMessage.includes('format') ||
    lowerMessage.includes('invalid')
  ) {
    return `Failed to ${context}: Could not process AI response.`;
  }

  if (isNetworkError(error)) {
    return `Failed to ${context}: Network error. Please check your connection.`;
  }

  const errorPrefix = lowerMessage.startsWith(`failed to ${context}`)
    ? ''
    : `Failed to ${context}: `;
  return errorPrefix + (error.message || 'An error occurred.');
};

const getRetryMessage = (error: AppError): string | null => {
  if (error.resetIn) {
    const minutes = Math.ceil(error.resetIn / 60);
    return `Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
  }

  if (error.resetAt) {
    return `Please try again after ${error.resetAt}.`;
  }

  return null;
};

const STORAGE_KEY = 'ai_suggestion_feedback';

export class FeedbackService {
  static saveFeedback(feedback: FeedbackData): void {
    try {
      const existingFeedback = this.getAllFeedback();

      const existingIndex = existingFeedback.findIndex(
        (f) =>
          f.suggestionId === feedback.suggestionId &&
          f.questionId === feedback.questionId
      );

      if (existingIndex >= 0) {
        existingFeedback[existingIndex] = feedback;
      } else {
        existingFeedback.push(feedback);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingFeedback));
    } catch (error) {
      console.error('Failed to save feedback:', error);
      throw new Error('Failed to save feedback to local storage');
    }
  }

  static getAllFeedback(): FeedbackData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored) as FeedbackData[];
    } catch (error) {
      console.error('Failed to retrieve feedback:', error);
      return [];
    }
  }

  static getFeedbackForQuestion(questionId: string): FeedbackData[] {
    try {
      const allFeedback = this.getAllFeedback();
      return allFeedback.filter((f) => f.questionId === questionId);
    } catch (error) {
      console.error('Failed to retrieve feedback for question:', error);
      return [];
    }
  }

  static clearFeedbackForQuestion(questionId: string): void {
    try {
      const allFeedback = this.getAllFeedback();
      const filtered = allFeedback.filter((f) => f.questionId !== questionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to clear feedback for question:', error);
    }
  }
}

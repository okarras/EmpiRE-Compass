import React, {
  useState,
  useEffect,
  ReactNode,
  useContext,
  createContext,
} from 'react';

export interface QuestionnaireAIState {
  history: QuestionnaireAIHistory[];
}

export interface QuestionnaireAIHistory {
  id: string;
  timestamp: number;
  questionId: string;
  questionText: string;
  type: 'suggestion' | 'verification' | 'answer';
  action: 'generated' | 'applied' | 'verified' | 'edited';
  content: string;
  prompt?: string;
  previousContent?: string;
  metadata?: {
    originalSuggestionId?: string;
    suggestionRank?: number;
    confidence?: number;
    evidence?: Array<{ pageNumber: number; excerpt: string }>;
    verificationStatus?: 'verified' | 'needs_improvement' | 'error';
    feedback?: {
      rating?: 'positive' | 'negative';
      comment?: string;
    };
  };
}

const initialState: QuestionnaireAIState = {
  history: [],
};

interface QuestionnaireAIContextType {
  state: QuestionnaireAIState;
  addToHistory: (
    entry: Omit<QuestionnaireAIHistory, 'id' | 'timestamp'>
  ) => string;
  updateHistoryMetadata: (
    id: string,
    metadata: Partial<QuestionnaireAIHistory['metadata']>
  ) => void;
  getHistoryByQuestion: (questionId: string) => QuestionnaireAIHistory[];
  getHistoryByType: (
    type: QuestionnaireAIHistory['type']
  ) => QuestionnaireAIHistory[];
  clearHistory: () => void;
  clearHistoryForQuestion: (questionId: string) => void;
  removeFromHistory: (id: string) => void;
  removeMultipleFromHistory: (ids: string[]) => void;
  resetState: () => void;
  loadSavedState: (savedState: QuestionnaireAIState) => void;
}

export const QuestionnaireAIContext = createContext<
  QuestionnaireAIContextType | undefined
>(undefined);

export const QuestionnaireAIProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<QuestionnaireAIState>(() => {
    // Try to load saved state from localStorage on initialization
    try {
      const saved = localStorage.getItem('questionnaire-ai-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          history: parsed.history || [],
        };
      }
    } catch (err) {
      console.error('Failed to load saved questionnaire AI history:', err);
    }
    return initialState;
  });

  const addToHistory = (
    entry: Omit<QuestionnaireAIHistory, 'id' | 'timestamp'>
  ): string => {
    const historyEntry: QuestionnaireAIHistory = {
      ...entry,
      id: `qai_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      history: [...prev.history, historyEntry],
    }));

    return historyEntry.id;
  };

  const updateHistoryMetadata = (
    id: string,
    metadata: Partial<QuestionnaireAIHistory['metadata']>
  ) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.map((item) =>
        item.id === id
          ? {
              ...item,
              metadata: {
                ...item.metadata,
                ...metadata,
              },
            }
          : item
      ),
    }));
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('questionnaire-ai-history', JSON.stringify(state));
  }, [state]);

  const getHistoryByQuestion = (questionId: string) => {
    return state.history
      .filter((entry) => entry.questionId === questionId)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const getHistoryByType = (type: QuestionnaireAIHistory['type']) => {
    return state.history
      .filter((entry) => entry.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const clearHistory = () => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  };

  const clearHistoryForQuestion = (questionId: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => item.questionId !== questionId),
    }));
  };

  const removeFromHistory = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => item.id !== id),
    }));
  };

  const removeMultipleFromHistory = (ids: string[]) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((item) => !ids.includes(item.id)),
    }));
  };

  const resetState = () => {
    setState(initialState);
    localStorage.removeItem('questionnaire-ai-history');
  };

  const loadSavedState = (savedState: QuestionnaireAIState) => {
    setState(savedState);
    localStorage.setItem(
      'questionnaire-ai-history',
      JSON.stringify(savedState)
    );
  };

  return (
    <QuestionnaireAIContext.Provider
      value={{
        state,
        addToHistory,
        updateHistoryMetadata,
        getHistoryByQuestion,
        getHistoryByType,
        clearHistory,
        clearHistoryForQuestion,
        removeFromHistory,
        removeMultipleFromHistory,
        resetState,
        loadSavedState,
      }}
    >
      {children}
    </QuestionnaireAIContext.Provider>
  );
};

export const useQuestionnaireAI = () => {
  const context = useContext(QuestionnaireAIContext);
  if (context === undefined) {
    throw new Error(
      'useQuestionnaireAI must be used within a QuestionnaireAIProvider'
    );
  }
  return context;
};

export default useQuestionnaireAI;

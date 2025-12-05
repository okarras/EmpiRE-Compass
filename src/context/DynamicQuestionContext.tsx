import React, {
  useState,
  useEffect,
  ReactNode,
  useContext,
  createContext,
} from 'react';

import type { CostBreakdown } from '../utils/costCalculator';

export interface DynamicQuestionState {
  question: string;
  sparqlQuery: string;
  sparqlTranslation: string;
  queryResults: Record<string, unknown>[];
  chartHtml: string;
  questionInterpretation: string;
  dataCollectionInterpretation: string;
  dataAnalysisInterpretation: string;
  // Stores the latest AI-generated JavaScript data processing function code
  processingFunctionCode: string;
  history: DynamicQuestionHistory[];
  // Template information
  templateId: string | null;
  templateMapping: Record<string, unknown> | null;
  targetClassId: string | null;
  // AI model costs for this question
  costs: CostBreakdown[];
}

export interface DynamicQuestionHistory {
  id: string;
  timestamp: number;
  type: 'question' | 'sparql' | 'chart' | 'analysis' | 'processing';
  action: 'generated' | 'edited' | 'ai_modified';
  content: string;
  prompt?: string; // The prompt that led to this change
  previousContent?: string; // Content before the change
}

const initialState: DynamicQuestionState = {
  question: '',
  sparqlQuery: '',
  sparqlTranslation: '',
  queryResults: [],
  chartHtml: '',
  questionInterpretation: '',
  dataCollectionInterpretation: '',
  dataAnalysisInterpretation: '',
  processingFunctionCode: '',
  history: [],
  templateId: null,
  templateMapping: null,
  targetClassId: null,
  costs: [],
};

interface DynamicQuestionContextType {
  state: DynamicQuestionState;
  updateQuestion: (question: string) => void;
  updateSparqlQuery: (query: string, prompt?: string) => void;
  updateSparqlTranslation: (translation: string, prompt?: string) => void;
  updateQueryResults: (results: Record<string, unknown>[]) => void;
  updateChartHtml: (html: string, prompt?: string) => void;
  updateQuestionInterpretation: (
    interpretation: string,
    prompt?: string
  ) => void;
  updateDataCollectionInterpretation: (
    interpretation: string,
    prompt?: string
  ) => void;
  updateDataAnalysisInterpretation: (
    interpretation: string,
    prompt?: string
  ) => void;
  updateProcessingFunctionCode: (code: string, prompt?: string) => void;
  updateTemplateId: (templateId: string) => void;
  updateTemplateMapping: (mapping: Record<string, unknown>) => void;
  updateTargetClassId: (targetClassId: string) => void;
  updateCosts: (costs: CostBreakdown[]) => void;
  addToHistory: (
    entry: Omit<DynamicQuestionHistory, 'id' | 'timestamp'>
  ) => void;
  getHistoryByType: (
    type: DynamicQuestionHistory['type']
  ) => DynamicQuestionHistory[];
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  removeMultipleFromHistory: (ids: string[]) => void;
  resetState: () => void;
  loadSavedState: (savedState: DynamicQuestionState) => void;
}

export const DynamicQuestionContext = createContext<
  DynamicQuestionContextType | undefined
>(undefined);

export const DynamicQuestionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DynamicQuestionState>(() => {
    // Try to load saved state from localStorage on initialization
    try {
      const saved = localStorage.getItem('current-dynamic-question');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure history is preserved and not overwritten by initialState
        return {
          ...initialState,
          ...parsed,
          history: parsed.history || [],
          costs: parsed.costs || [],
        };
      }
    } catch (err) {
      console.error('Failed to load saved dynamic question state:', err);
    }
    return initialState;
  });

  const addToHistory = (
    entry: Omit<DynamicQuestionHistory, 'id' | 'timestamp'>
  ) => {
    const historyEntry: DynamicQuestionHistory = {
      ...entry,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      history: [...prev.history, historyEntry],
    }));
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('current-dynamic-question', JSON.stringify(state));
  }, [state]);

  const updateQuestion = (question: string) => {
    setState((prev) => ({
      ...prev,
      question,
    }));
    addToHistory({
      type: 'question',
      action: 'edited',
      content: question,
    });
  };

  const updateSparqlQuery = (query: string, prompt?: string) => {
    const previousContent = state.sparqlQuery;
    setState((prev) => ({
      ...prev,
      sparqlQuery: query,
    }));
    addToHistory({
      type: 'sparql',
      action: prompt ? 'ai_modified' : 'edited',
      content: query,
      prompt,
      previousContent,
    });
  };

  const updateSparqlTranslation = (translation: string, prompt?: string) => {
    const previousContent = state.sparqlTranslation;
    setState((prev) => ({
      ...prev,
      sparqlTranslation: translation,
    }));
    addToHistory({
      type: 'sparql',
      action: prompt ? 'ai_modified' : 'edited',
      content: translation,
      prompt,
      previousContent,
    });
  };

  const updateQueryResults = (results: Record<string, unknown>[]) => {
    setState((prev) => ({
      ...prev,
      queryResults: results,
    }));
  };

  const updateChartHtml = (html: string, prompt?: string) => {
    const previousContent = state.chartHtml;
    setState((prev) => ({
      ...prev,
      chartHtml: html,
    }));
    addToHistory({
      type: 'chart',
      action: prompt ? 'ai_modified' : 'edited',
      content: html,
      prompt,
      previousContent,
    });
  };

  const updateQuestionInterpretation = (
    interpretation: string,
    prompt?: string
  ) => {
    const previousContent = state.questionInterpretation;
    setState((prev) => ({
      ...prev,
      questionInterpretation: interpretation,
    }));
    addToHistory({
      type: 'analysis',
      action: prompt ? 'ai_modified' : 'edited',
      content: interpretation,
      prompt,
      previousContent,
    });
  };

  const updateDataCollectionInterpretation = (
    interpretation: string,
    prompt?: string
  ) => {
    const previousContent = state.dataCollectionInterpretation;
    setState((prev) => ({
      ...prev,
      dataCollectionInterpretation: interpretation,
    }));
    addToHistory({
      type: 'analysis',
      action: prompt ? 'ai_modified' : 'edited',
      content: interpretation,
      prompt,
      previousContent,
    });
  };

  const updateDataAnalysisInterpretation = (
    interpretation: string,
    prompt?: string
  ) => {
    const previousContent = state.dataAnalysisInterpretation;
    setState((prev) => ({
      ...prev,
      dataAnalysisInterpretation: interpretation,
    }));
    addToHistory({
      type: 'analysis',
      action: prompt ? 'ai_modified' : 'edited',
      content: interpretation,
      prompt,
      previousContent,
    });
  };

  const updateProcessingFunctionCode = (code: string, prompt?: string) => {
    const previousContent = state.processingFunctionCode;
    setState((prev) => ({
      ...prev,
      processingFunctionCode: code,
    }));
    addToHistory({
      type: 'processing',
      action: prompt ? 'ai_modified' : 'edited',
      content: code,
      prompt,
      previousContent,
    });
  };

  const updateTemplateId = (templateId: string) => {
    setState((prev) => ({
      ...prev,
      templateId,
    }));
  };

  const updateTemplateMapping = (mapping: Record<string, unknown>) => {
    setState((prev) => ({
      ...prev,
      templateMapping: mapping,
    }));
  };

  const updateTargetClassId = (targetClassId: string) => {
    setState((prev) => ({
      ...prev,
      targetClassId,
    }));
  };

  const updateCosts = (costs: CostBreakdown[]) => {
    setState((prev) => ({
      ...prev,
      costs,
    }));
  };

  const getHistoryByType = (type: DynamicQuestionHistory['type']) => {
    return state.history.filter((entry) => entry.type === type);
  };

  const clearHistory = () => {
    setState((prev) => ({
      ...prev,
      history: [],
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
    // Clear the saved state from localStorage
    localStorage.removeItem('current-dynamic-question');
  };

  const loadSavedState = (savedState: DynamicQuestionState) => {
    setState(savedState);
    // Save to localStorage for persistence
    localStorage.setItem(
      'current-dynamic-question',
      JSON.stringify(savedState)
    );
  };

  return (
    <DynamicQuestionContext.Provider
      value={{
        state,
        updateQuestion,
        updateSparqlQuery,
        updateSparqlTranslation,
        updateQueryResults,
        updateChartHtml,
        updateQuestionInterpretation,
        updateDataCollectionInterpretation,
        updateDataAnalysisInterpretation,
        updateProcessingFunctionCode,
        updateTemplateId,
        updateTemplateMapping,
        updateTargetClassId,
        updateCosts,
        addToHistory,
        getHistoryByType,
        clearHistory,
        removeFromHistory,
        removeMultipleFromHistory,
        resetState,
        loadSavedState,
      }}
    >
      {children}
    </DynamicQuestionContext.Provider>
  );
};

export const useDynamicQuestion = () => {
  const context = useContext(DynamicQuestionContext);
  if (context === undefined) {
    throw new Error(
      'useDynamicQuestion must be used within a DynamicQuestionProvider'
    );
  }
  return context;
};

export default useDynamicQuestion;

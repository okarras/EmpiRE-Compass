import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Query } from '../constants/queries_chart_info';

export interface RelatedPaperInAsk {
  id: string;
  title?: string;
  abstract?: string;
  year?: number;
}

export interface PaperInfoItem {
  id: string;
  title?: string;
  abstract?: string;
  year?: number;
  date_published?: string;
  doi?: string;
  authors?: string[] | { name?: string }[];
  /** Related papers from ORKG Ask semantic search – each can be opened in ORKG Ask */
  relatedPapersInAsk?: RelatedPaperInAsk[];
  [key: string]: unknown;
}

interface AIAssistantContextType {
  isOpen: boolean;
  toggleAssistant: () => void;
  openAssistant: () => void;
  currentQuery: Query | null;
  currentData: Record<string, unknown>[] | null;
  setContext: (
    query: Query | null,
    data: Record<string, unknown>[] | null
  ) => void;
  paperInfo: PaperInfoItem | null;
  orkgResourceUri: string | null;
  setPaperInfo: (
    item: PaperInfoItem | null,
    orkgResourceUri?: string | null
  ) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  sendStructuredPrompt: (prompt: string) => void;
  pendingPrompt: string | null;
  clearPendingPrompt: () => void;
  /** LLM provider for the assistant: orkg-ask (default, cheaper) or openai */
  assistantProvider: 'orkg-ask' | 'openai';
  setAssistantProvider: (provider: 'orkg-ask' | 'openai') => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(
  undefined
);

export const AIAssistantProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<Query | null>(null);
  const [currentData, setCurrentData] = useState<
    Record<string, unknown>[] | null
  >(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [paperInfo, setPaperInfoState] = useState<PaperInfoItem | null>(null);
  const [orkgResourceUri, setOrkgResourceUri] = useState<string | null>(null);
  const [assistantProvider, setAssistantProvider] = useState<
    'orkg-ask' | 'openai'
  >('orkg-ask');

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  const openAssistant = () => {
    if (!isOpen) setIsOpen(true);
  };

  const setPaperInfo = (item: PaperInfoItem | null, uri?: string | null) => {
    setPaperInfoState(item);
    setOrkgResourceUri(item != null && uri != null ? uri : null);
    if (item != null) setIsOpen(true);
    if (item == null) setOrkgResourceUri(null);
  };

  const setContext = (
    query: Query | null,
    data: Record<string, unknown>[] | null
  ) => {
    setCurrentQuery(query);
    setCurrentData(data);
  };

  const sendStructuredPrompt = (prompt: string) => {
    setPendingPrompt(prompt);
    setIsOpen(true);
  };

  const clearPendingPrompt = () => {
    setPendingPrompt(null);
  };

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        toggleAssistant,
        openAssistant,
        currentQuery,
        currentData,
        setContext,
        paperInfo,
        orkgResourceUri,
        setPaperInfo,
        isExpanded,
        setIsExpanded,
        sendStructuredPrompt,
        pendingPrompt,
        clearPendingPrompt,
        assistantProvider,
        setAssistantProvider,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistantContext = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error(
      'useAIAssistantContext must be used within an AIAssistantProvider'
    );
  }
  return context;
};

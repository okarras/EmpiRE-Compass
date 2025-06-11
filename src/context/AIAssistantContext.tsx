import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Query } from '../constants/queries_chart_info';

interface AIAssistantContextType {
  isOpen: boolean;
  toggleAssistant: () => void;
  currentQuery: Query | null;
  currentData: Record<string, unknown>[] | null;
  setContext: (
    query: Query | null,
    data: Record<string, unknown>[] | null
  ) => void;
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

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  const setContext = (
    query: Query | null,
    data: Record<string, unknown>[] | null
  ) => {
    setCurrentQuery(query);
    setCurrentData(data);
  };

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        toggleAssistant,
        currentQuery,
        currentData,
        setContext,
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

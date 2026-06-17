import { useState, useEffect } from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  Message,
  getChatHistory,
  setChatHistory,
} from '../utils/aiAssistantCache';

interface UseAssistantMessagesProps {
  query: Query;
}

export const useAssistantMessages = ({ query }: UseAssistantMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const chatHistory = getChatHistory();
    const queryHistory = chatHistory[query.id];
    if (queryHistory) {
      setMessages(queryHistory.messages);
    } else {
      setMessages([]);
    }
  }, [query.id]);

  useEffect(() => {
    if (messages.length > 0) {
      const chatHistory = getChatHistory();
      chatHistory[query.id] = {
        messages,
        lastUpdated: Date.now(),
      };
      setChatHistory(chatHistory);
    }
  }, [messages, query.id]);

  const clearChatHistory = () => {
    const chatHistory = getChatHistory();
    delete chatHistory[query.id];
    setChatHistory(chatHistory);
    setMessages([]);
  };

  const exportChatHistory = () => {
    const chatHistory = getChatHistory();
    const queryHistory = chatHistory[query.id];
    if (!queryHistory) return;

    const exportData = {
      queryId: query.id,
      question: query.dataAnalysisInformation.question,
      messages: queryHistory.messages,
      lastUpdated: queryHistory.lastUpdated,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${query.id}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    messages,
    setMessages,
    clearChatHistory,
    exportChatHistory,
  };
};

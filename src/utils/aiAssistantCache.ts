export const CACHE_STORAGE_KEY = 'ai_assistant_initial_analysis_cache';
export const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';

export interface Message {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
  reasoning?: string;
  chartHtml?: string;
  chartConfigs?: Record<string, unknown>[];
  timestamp?: number;
}

export interface CacheEntry {
  analysis: string;
  timestamp: number;
  reasoning?: string;
}

export interface ChatHistory {
  messages: Message[];
  lastUpdated: number;
}

export const getCache = (): Record<string, CacheEntry> => {
  try {
    const cachedData = localStorage.getItem(CACHE_STORAGE_KEY);
    return cachedData
      ? (JSON.parse(cachedData) as Record<string, CacheEntry>)
      : {};
  } catch (error) {
    console.error('Error reading from cache:', error);
    return {};
  }
};

export const setCache = (cache: Record<string, CacheEntry>) => {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const getChatHistory = (): Record<string, ChatHistory> => {
  try {
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    return history ? (JSON.parse(history) as Record<string, ChatHistory>) : {};
  } catch (error) {
    console.error('Error reading chat history:', error);
    return {};
  }
};

export const setChatHistory = (history: Record<string, ChatHistory>) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error writing chat history:', error);
  }
};

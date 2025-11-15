import { useState, useEffect } from 'react';
import { Query } from '../constants/queries_chart_info';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useBackendAIService } from '../services/backendAIService';

interface UseBackendAIAssistantProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

interface Message {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
  reasoning?: string;
  chartHtml?: string;
  timestamp?: number;
}

interface CacheEntry {
  analysis: string;
  timestamp: number;
  reasoning?: string | null;
}

interface ChatHistory {
  messages: Message[];
  lastUpdated: number;
}

const CACHE_STORAGE_KEY = 'ai_assistant_initial_analysis_cache';
const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';

const getCache = (): Record<string, CacheEntry> => {
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

const setCache = (cache: Record<string, CacheEntry>) => {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

// chat history management
const getChatHistory = (): Record<string, ChatHistory> => {
  try {
    const history = localStorage.getItem(CHAT_HISTORY_KEY);
    return history ? (JSON.parse(history) as Record<string, ChatHistory>) : {};
  } catch (error) {
    console.error('Error reading chat history:', error);
    return {};
  }
};

const setChatHistory = (history: Record<string, ChatHistory>) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error writing chat history:', error);
  }
};

const useBackendAIAssistant = ({
  query,
  questionData,
}: UseBackendAIAssistantProps) => {
  const aiService = useBackendAIService();
  const { pendingPrompt, clearPendingPrompt } = useAIAssistantContext();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialAnalysis, setInitialAnalysis] = useState<string | null>(null);
  const [initialReasoning, setInitialReasoning] = useState<string | undefined>(
    undefined
  );
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastCachedAnalysis, setLastCachedAnalysis] = useState<string | null>(
    null
  );
  const [lastCachedReasoning, setLastCachedReasoning] = useState<
    string | undefined
  >(undefined);
  const [refreshingInitialAnalysis, setRefreshingInitialAnalysis] =
    useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [showChart, setShowChart] = useState(true);

  // load chat
  useEffect(() => {
    const chatHistory = getChatHistory();
    const queryHistory = chatHistory[query.id];
    if (queryHistory) {
      setMessages(queryHistory.messages);
    } else {
      setMessages([]);
    }
  }, [query.id]);

  // save chat
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

  const generateSystemContext = () => {
    const dataSummary = questionData
      .slice(0, 5)
      .map((item) => JSON.stringify(item))
      .join('\n');

    return `You are an AI assistant helping with research data analysis. 

Context:
- Research Question: ${query.dataAnalysisInformation.question}
- Data Type: ${query.title}
- Data Sample: ${dataSummary}
- Total Data Points: ${questionData.length}

Instructions:
1. Provide accurate, data-driven insights
2. Use clear, professional language
3. Format responses with HTML tags for better readability
4. Focus on the specific research question and data provided
5. Do not include markdown code blocks in your response`;
  };

  // process structured prompt
  const processStructuredPrompt = async (structuredPrompt: string) => {
    if (!structuredPrompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    setMessages((prev) => [
      ...prev,
      { content: structuredPrompt, isUser: true },
    ]);

    try {
      const response = await aiService.generateText(
        `${generateSystemContext()}
        User Question: ${structuredPrompt}

        Please provide a detailed and comprehensive answer to this structured question about the research data.
        
        Important instructions:
        1. Base your answer ONLY on the data and analysis provided above
        2. Do not make assumptions or include information not present in the data
        3. Focus on the most relevant findings from the data
        4. Use clear and direct language
        5. Format your response using HTML tags (<p>, <ul>, <li>, <h3>, <h4>) to structure your response
        6. Do not include any markdown code blocks or backticks in your response
        7. Provide specific insights and detailed explanations`,
        {
          temperature: 0.3,
          maxTokens: 2000,
        }
      );

      const { text, reasoning } = response;

      const cleanedText = text
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      setMessages((prev) => [
        ...prev,
        {
          content: cleanedText,
          isUser: false,
          reasoning,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('AI Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pendingPrompt && !loading) {
      clearPendingPrompt();
      processStructuredPrompt(pendingPrompt);
    }
  }, [pendingPrompt, loading, clearPendingPrompt]);

  useEffect(() => {
    const performInitialAnalysis = async () => {
      try {
        setLoading(true);

        const cacheKey = `query_${query.id}`;
        const responseCache: Record<string, CacheEntry> = getCache();

        const cacheEntry = responseCache[cacheKey] as CacheEntry | undefined;
        if (cacheEntry && typeof cacheEntry.analysis === 'string') {
          setInitialAnalysis(cacheEntry.analysis);
          setInitialReasoning(cacheEntry.reasoning || undefined);
          setIsFromCache(true);
          setLastCachedAnalysis(cacheEntry.analysis);
          setLastCachedReasoning(cacheEntry.reasoning || undefined);
          setLoading(false);
          return;
        }

        const { reasoning, text } = await aiService.generateText(
          `Please provide a comprehensive analysis of this research question and its data in HTML format not in markdown. Include:
          <h1>Initial Analysis</h1>

          <h2>Question Overview</h2>
          <p>[Provide a detailed overview of the research question and its significance]</p>

          <h2>Data Analysis Approach</h2>
          <p>[Explain the methodology and approach used for data analysis]</p>

          <h2>Key Findings</h2>
          <p>[List and explain the main findings from the data]</p>

          <h2>Data Insights</h2>
          <p>[Provide specific insights and patterns observed in the data]</p>

          <h2>Research Implications</h2>
          <p>[Discuss the implications and potential impact of these findings]</p>

          <h2>Methodological Considerations</h2>
          <p>[Address any limitations or considerations in the research approach]</p>

          Context: ${generateSystemContext()}`,
          {
            temperature: 0.3,
            maxTokens: 2000,
          }
        );

        const cleanedText = text
          .replace(/```html\n/g, '')
          .replace(/```\n/g, '')
          .replace(/```html/g, '')
          .replace(/```/g, '')
          .trim();

        setInitialAnalysis(cleanedText);
        setInitialReasoning(reasoning || undefined);
        setIsFromCache(false);

        const newCache = { ...responseCache };
        newCache[cacheKey] = {
          analysis: cleanedText,
          reasoning: reasoning || undefined,
          timestamp: Date.now(),
        };
        setCache(newCache);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to generate initial analysis'
        );
        console.error('Initial Analysis Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (questionData.length > 0 && !initialAnalysis && !loading) {
      performInitialAnalysis();
    }
  }, [query, questionData, initialAnalysis, loading]);

  const undoInitialAnalysis = () => {
    if (lastCachedAnalysis) {
      setInitialAnalysis(lastCachedAnalysis);
      setInitialReasoning(lastCachedReasoning);
      setIsFromCache(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    setMessages((prev) => [...prev, { content: prompt, isUser: true }]);

    try {
      const response = await aiService.generateText(
        `${generateSystemContext()}
        User Question: ${prompt}

        Please provide a detailed and comprehensive answer to this question about the research data.
        
        Important instructions:
        1. Base your answer ONLY on the data and analysis provided above
        2. Do not make assumptions or include information not present in the data
        3. Focus on the most relevant findings from the data
        4. Use clear and direct language
        5. Format your response using HTML tags (<p>, <ul>, <li>, <h3>, <h4>) to structure your response
        6. Do not include any markdown code blocks or backticks in your response
        7. Provide specific insights and detailed explanations`,
        {
          temperature: 0.3,
          maxTokens: 2000,
        }
      );

      const { text, reasoning } = response;

      const cleanedText = text
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      setMessages((prev) => [
        ...prev,
        {
          content: cleanedText,
          isUser: false,
          reasoning,
        },
      ]);

      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('AI Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshInitialAnalysis = async () => {
    if (loading) return;

    setRefreshingInitialAnalysis(true);
    setError(null);

    try {
      const cacheKey = `query_${query.id}`;
      const responseCache: Record<string, CacheEntry> = getCache();
      delete responseCache[cacheKey];
      setCache(responseCache);

      setInitialAnalysis(null);
      setInitialReasoning(undefined);
      setIsFromCache(false);
      setLastCachedAnalysis(null);
      setLastCachedReasoning(undefined);

      // Trigger new analysis
      const { reasoning, text } = await aiService.generateText(
        `Please provide a comprehensive analysis of this research question and its data in HTML format not in markdown. Include:
        <h1>Initial Analysis</h1>

        <h2>Question Overview</h2>
        <p>[Provide a detailed overview of the research question and its significance]</p>

        <h2>Data Analysis Approach</h2>
        <p>[Explain the methodology and approach used for data analysis]</p>

        <h2>Key Findings</h2>
        <p>[List and explain the main findings from the data]</p>

        <h2>Data Insights</h2>
        <p>[Provide specific insights and patterns observed in the data]</p>

        <h2>Research Implications</h2>
        <p>[Discuss the implications and potential impact of these findings]</p>

        <h2>Methodological Considerations</h2>
        <p>[Address any limitations or considerations in the research approach]</p>

        Context: ${generateSystemContext()}`,
        {
          temperature: 0.3,
          maxTokens: 2000,
        }
      );

      const cleanedText = text
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      setInitialAnalysis(cleanedText);
      setInitialReasoning(reasoning || undefined);

      const newCache = { ...responseCache };
      newCache[cacheKey] = {
        analysis: cleanedText,
        reasoning: reasoning || null,
        timestamp: Date.now(),
      };
      setCache(newCache);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh analysis'
      );
      console.error('Refresh Analysis Error:', err);
    } finally {
      setRefreshingInitialAnalysis(false);
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    const chatHistory = getChatHistory();
    delete chatHistory[query.id];
    setChatHistory(chatHistory);
  };

  const exportChatHistory = () => {
    const chatData = {
      query: query.dataAnalysisInformation.question,
      timestamp: new Date().toISOString(),
      messages: messages.map((msg) => ({
        content: msg.content,
        isUser: msg.isUser,
        timestamp: msg.timestamp || Date.now(),
      })),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${query.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canUndoInitialAnalysis = isFromCache && !!lastCachedAnalysis;

  return {
    prompt,
    setPrompt,
    messages,
    loading,
    error,
    initialAnalysis,
    initialReasoning,
    handleGenerate,
    isFromCache,
    undoInitialAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
    refreshingInitialAnalysis,
    streamingText,
    showReasoning,
    setShowReasoning,
    showChart,
    setShowChart,
    clearChatHistory,
    exportChatHistory,
  };
};

export default useBackendAIAssistant;

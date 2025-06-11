import { useState, useEffect } from 'react';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { Query } from '../constants/queries_chart_info';

interface UseAIAssistantProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

interface Message {
  content: string;
  isUser: boolean;
  isStreaming?: boolean;
}

// Cache interface
interface CacheEntry {
  analysis: string;
  timestamp: number;
}

// Cache storage key
const CACHE_STORAGE_KEY = 'ai_assistant_initial_analysis_cache';

// Cache management functions
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

const useAIAssistant = ({ query, questionData }: UseAIAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialAnalysis, setInitialAnalysis] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastCachedAnalysis, setLastCachedAnalysis] = useState<string | null>(
    null
  );
  const [refreshingInitialAnalysis, setRefreshingInitialAnalysis] =
    useState(false);
  const [streamingText, setStreamingText] = useState('');

  const openai = createOpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  });

  const generateSystemContext = () => {
    return `You are analyzing a research question in Requirements Engineering. Please provide your response in HTML format.
      Question: ${query.dataAnalysisInformation.question}
      Question Explanation: ${query.dataAnalysisInformation.questionExplanation}
      Required Data: ${query.dataAnalysisInformation.requiredDataForAnalysis}
      Data Analysis Method: ${query.dataAnalysisInformation.dataAnalysis}
      Data Interpretation: ${query.dataAnalysisInformation.dataInterpretation}

      Available Data Points: ${questionData.length}
      Data: ${JSON.stringify(questionData, null, 2)}

      Your role is to:
      1. Understand and analyze the research question and its context
      2. Interpret the available data and charts
      3. Provide insights based on the data analysis
      4. Answer specific questions about this research topic
      5. Please maintain an academic and analytical tone in your responses.
      6. Format your response using HTML tags (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <code>, <pre>, <blockquote>, etc.).
      `;
  };

  const streamResponse = async (text: string) => {
    const words = text.split(/(\s+)/);
    for (const word of words) {
      setStreamingText((prev) => prev + word);
      await new Promise((resolve) => setTimeout(resolve, 30)); // Adjust speed as needed
    }
  };

  useEffect(() => {
    const performInitialAnalysis = async () => {
      try {
        setLoading(true);

        // Check cache for initial analysis
        const cacheKey = `query_${query.id}`;
        const responseCache: Record<string, CacheEntry> = getCache();

        const cacheEntry = responseCache[cacheKey] as CacheEntry | undefined;
        if (cacheEntry && typeof cacheEntry.analysis === 'string') {
          setInitialAnalysis(cacheEntry.analysis);
          setIsFromCache(true);
          setLastCachedAnalysis(cacheEntry.analysis);
          setLoading(false);
          return;
        }

        const { text } = await generateText({
          model: openai('gpt-4.1-nano'),
          prompt: `Please provide a comprehensive analysis of this research question and its data in HTML format. Include:
          <h1>Initial Analysis</h1>

          <h2>Question Overview</h2>
          <p>[Provide a detailed overview of the research question and its significance]</p>

          <h2>Data Analysis Approach</h2>
          <p>[Explain the methodology and approach used for data analysis]</p>

          <h2>Key Findings</h2>
          <p>[List and explain the main findings from the data]</p>

          <h2>Potential Insights</h2>
          <p>[Discuss potential implications and insights derived from the findings]</p>

          <h2>Limitations and Considerations</h2>
          <p>[Discuss any limitations or considerations to keep in mind]</p>

          Context:
          ${generateSystemContext()}`,
        });

        // Store in cache
        const updatedCache = {
          ...responseCache,
          [cacheKey]: {
            analysis: text,
            timestamp: Date.now(),
          },
        };
        setCache(updatedCache);

        // Save the previous cached analysis for undo
        const prevCacheEntry = responseCache[cacheKey] as
          | CacheEntry
          | undefined;
        if (prevCacheEntry && typeof prevCacheEntry.analysis === 'string') {
          setLastCachedAnalysis(prevCacheEntry.analysis);
        }

        setInitialAnalysis(text);
        setIsFromCache(false);
      } catch (err) {
        setError('Failed to generate initial analysis');
        console.error('Initial Analysis Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!initialAnalysis && questionData.length > 0) {
      performInitialAnalysis();
    }
  }, [query, questionData]);

  // Undo function to restore last cached analysis
  const undoInitialAnalysis = () => {
    if (lastCachedAnalysis) {
      setInitialAnalysis(lastCachedAnalysis);
      setIsFromCache(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    // Add user message
    setMessages((prev) => [...prev, { content: prompt, isUser: true }]);

    // Check if user wants detailed explanation
    const wantsDetailed =
      prompt.toLowerCase().includes('detailed') ||
      prompt.toLowerCase().includes('explain') ||
      prompt.toLowerCase().includes('elaborate');

    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `${generateSystemContext()}
        User Question: ${prompt}
        Data Analysis Method: ${query.dataAnalysisInformation.dataAnalysis}
        Data Interpretation: ${query.dataAnalysisInformation.dataInterpretation}
        Data: ${JSON.stringify(query.dataProcessingFunction?.(questionData), null, 2)}
        ${
          query.dataProcessingFunction2
            ? `Data Analysis Data: ${JSON.stringify(
                query.dataProcessingFunction2?.(questionData),
                null,
                2
              )}`
            : ''
        }

        Please provide a ${wantsDetailed ? 'detailed' : 'concise'} answer to the user's question.
        Important instructions:
        1. Keep your response under 300 words and maximum 2 paragraphs
        2. Base your answer ONLY on the data and analysis provided above
        3. Do not make assumptions or include information not present in the data
        4. Focus on the most relevant findings from the data
        5. Use clear and direct language
        6. Format your response using HTML tags (<p>, <ul>, <li>) to structure your response
        7. Do not include any markdown code blocks or backticks in your response
        8. Answer based on the data and analysis provided above`,
      });

      // Clean up the response if it contains markdown code blocks
      const cleanedText = text.replace(/```html\s*|\s*```/g, '').trim();

      // Add AI message with streaming flag
      setMessages((prev) => [
        ...prev,
        { content: '', isUser: false, isStreaming: true },
      ]);

      // Stream the response
      await streamResponse(cleanedText);

      // Update the last message with the complete response
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          content: cleanedText,
          isUser: false,
        };
        return newMessages;
      });

      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('AI Generation Error:', err);
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  // Function to always generate a new initial analysis (not from cache)
  const refreshInitialAnalysis = async () => {
    try {
      setRefreshingInitialAnalysis(true);
      setIsFromCache(false);
      setError(null);
      const cacheKey = `query_${query.id}`;
      const responseCache: Record<string, CacheEntry> = getCache();
      // Save the previous cached analysis for undo
      const prevCacheEntry = responseCache[cacheKey] as CacheEntry | undefined;
      if (prevCacheEntry && typeof prevCacheEntry.analysis === 'string') {
        setLastCachedAnalysis(prevCacheEntry.analysis);
      }
      const { text } = await generateText({
        model: openai('gpt-4.1-nano'),
        prompt: `Please provide a comprehensive analysis of this research question and its data in HTML format. Include:
        <h1>Initial Analysis</h1>

        <h2>Question Overview</h2>
        <p>[Provide a detailed overview of the research question and its significance]</p>

        <h2>Data Analysis Approach</h2>
        <p>[Explain the methodology and approach used for data analysis]</p>

        <h2>Key Findings</h2>
        <p>[List and explain the main findings from the data]</p>

        <h2>Potential Insights</h2>
        <p>[Discuss potential implications and insights derived from the findings]</p>

        <h2>Limitations and Considerations</h2>
        <p>[Discuss any limitations or considerations to keep in mind]</p>

        Context:
        ${generateSystemContext()}`,
      });
      // Store in cache
      const updatedCache = {
        ...responseCache,
        [cacheKey]: {
          analysis: text,
          timestamp: Date.now(),
        },
      };
      setCache(updatedCache);
      setInitialAnalysis(text);
      setIsFromCache(false);
    } catch (err) {
      setError('Failed to refresh initial analysis');
      console.error('Refresh Initial Analysis Error:', err);
    } finally {
      setRefreshingInitialAnalysis(false);
    }
  };

  // Show Undo button if there is a lastCachedAnalysis and the current initialAnalysis is not from cache
  const canUndoInitialAnalysis = !!lastCachedAnalysis && !isFromCache;

  return {
    prompt,
    setPrompt,
    messages,
    loading,
    error,
    initialAnalysis,
    handleGenerate,
    isFromCache,
    undoInitialAnalysis,
    lastCachedAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
    refreshingInitialAnalysis,
    streamingText,
  };
};

export default useAIAssistant;

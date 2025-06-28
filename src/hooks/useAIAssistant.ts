import { useState, useEffect } from 'react';
import {
  generateText,
  wrapLanguageModel,
  extractReasoningMiddleware,
} from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { Query } from '../constants/queries_chart_info';
import { useAIAssistantContext } from '../context/AIAssistantContext';

interface UseAIAssistantProps {
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

// Cache interfaces
interface CacheEntry {
  analysis: string;
  timestamp: number;
  reasoning?: string;
}

interface ChatHistory {
  messages: Message[];
  lastUpdated: number;
}

// Cache storage keys
const CACHE_STORAGE_KEY = 'ai_assistant_initial_analysis_cache';
const CHAT_HISTORY_KEY = 'ai_assistant_chat_history';

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

// Chat history management functions
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

const useAIAssistant = ({ query, questionData }: UseAIAssistantProps) => {
  const { pendingPrompt, clearPendingPrompt } = useAIAssistantContext();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialAnalysis, setInitialAnalysis] = useState<string | null>(null);
  const [initialReasoning, setInitialReasoning] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastCachedAnalysis, setLastCachedAnalysis] = useState<string | null>(
    null
  );
  const [lastCachedReasoning, setLastCachedReasoning] = useState<string | null>(
    null
  );
  const [refreshingInitialAnalysis, setRefreshingInitialAnalysis] =
    useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [showChart, setShowChart] = useState(true);

  // Load chat history when query changes
  useEffect(() => {
    const chatHistory = getChatHistory();
    const queryHistory = chatHistory[query.id];
    if (queryHistory) {
      setMessages(queryHistory.messages);
    } else {
      setMessages([]);
    }
  }, [query.id]);

  // Save chat history when messages change
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

  const groq = createGroq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
  });

  // Create enhanced model with reasoning middleware
  const enhancedModel = wrapLanguageModel({
    model: groq.languageModel('deepseek-r1-distill-llama-70b'),
    middleware: extractReasoningMiddleware({ tagName: 'think' }),
  });

  const generateSystemContext = () => {
    /*
       ${
          query.dataProcessingFunction2
            ? `Data Analysis Data: ${JSON.stringify(
                query.dataProcessingFunction2?.(questionData),
                null,
                2
              )}`
            : ''
        }
        */
    return `You are analyzing a research question in Requirements Engineering. Please provide your response in HTML format.
      Question: ${query.dataAnalysisInformation.question}
      Question Explanation: ${query.dataAnalysisInformation.questionExplanation}
      Required Data: ${query.dataAnalysisInformation.requiredDataForAnalysis}
      Data Analysis Method: ${query.dataAnalysisInformation.dataAnalysis}
      Data Interpretation: ${query.dataAnalysisInformation.dataInterpretation}

       Data: ${JSON.stringify(query.dataProcessingFunction?.(questionData), null, 2)}
      Your role is to:
      1. Understand and analyze the research question and its context
      2. Interpret the available data and charts
      3. Provide insights based on the data analysis
      4. Answer specific questions about this research topic
      5. Please maintain an academic and analytical tone in your responses.
      6. Format your response using HTML tags (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <code>, <pre>, <blockquote>, etc.).
      `;
  };

  // Process structured prompt function
  const processStructuredPrompt = async (structuredPrompt: string) => {
    if (!structuredPrompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    // Add user message
    setMessages((prev) => [
      ...prev,
      { content: structuredPrompt, isUser: true },
    ]);

    try {
      const response = await generateText({
        model: enhancedModel,
        prompt: `${generateSystemContext()}
        User Question: ${structuredPrompt}

        Please provide a detailed and comprehensive answer to this structured question about the research data.
        
        Important instructions:
        1. Base your answer ONLY on the data and analysis provided above
        2. Do not make assumptions or include information not present in the data
        3. Focus on the most relevant findings from the data
        4. Use clear and direct language
        5. Format your response using HTML tags (<p>, <ul>, <li>, <h3>, <h4>) to structure your response
        6. Do not include any markdown code blocks or backticks in your response
        7. Provide specific insights and detailed explanations
        `,
      });

      const { text, reasoning } = response;

      // Clean up the response if it contains markdown code blocks
      const cleanedText = text
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      // Add the final message
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

  // Handle pending structured prompts
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

        // Check cache for initial analysis
        const cacheKey = `query_${query.id}`;
        const responseCache: Record<string, CacheEntry> = getCache();

        const cacheEntry = responseCache[cacheKey] as CacheEntry | undefined;
        if (cacheEntry && typeof cacheEntry.analysis === 'string') {
          setInitialAnalysis(cacheEntry.analysis);
          setInitialReasoning(cacheEntry.reasoning || null);
          setIsFromCache(true);
          setLastCachedAnalysis(cacheEntry.analysis);
          setLastCachedReasoning(cacheEntry.reasoning || null);
          setLoading(false);
          return;
        }

        const { reasoning, text } = await generateText({
          model: enhancedModel,
          prompt: `Please provide a comprehensive analysis of this research question and its data in HTML format not in markdown. Include:
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

        // process the text to remove markdown code blocks
        //trim ```html and ```
        const cleanedText = text
          .replace(/```html\n/g, '')
          .replace(/```\n/g, '')
          .replace(/```html/g, '')
          .replace(/```/g, '')
          .trim();

        // Store in cache
        const updatedCache = {
          ...responseCache,
          [cacheKey]: {
            analysis: cleanedText,
            reasoning: reasoning,
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
          setLastCachedReasoning(prevCacheEntry.reasoning || null);
        }

        setInitialAnalysis(cleanedText);
        setInitialReasoning(reasoning ?? null);
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
      setInitialReasoning(lastCachedReasoning);
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

    // Check if user wants a chart
    const wantsChart =
      prompt.toLowerCase().includes('chart') ||
      prompt.toLowerCase().includes('graph') ||
      prompt.toLowerCase().includes('visualize') ||
      prompt.toLowerCase().includes('plot');

    try {
      const response = await generateText({
        model: enhancedModel,
        prompt: `${generateSystemContext()}
        User Question: ${prompt}

        Please provide a ${wantsDetailed ? 'detailed' : 'concise'} answer to the user's question.
        ${
          wantsChart
            ? `Additionally, generate a chart using Chart.js to visualize the relevant data. Follow these specific instructions for the chart:
        1. Put ALL chart-related code (canvas, script tags, and Chart.js initialization) inside a single <div class="chart-code"> tag
        2. Choose the most appropriate chart type based on the data and what you want to show:
           - Use 'line' for trends over time
           - Use 'bar' for comparing quantities across categories
           - Use 'pie' or 'doughnut' for showing proportions
           - Use 'scatter' for showing relationships between variables
           - Use 'radar' for comparing multiple variables
        3. The chart code should be complete and self-contained
        4. Use proper indentation and formatting
        5. Make the chart responsive and use appropriate colors
        6. Include proper axis labels and title
        7. Format the chart code like this example:
        <div class="chart-code">
          <canvas id="myChart"></canvas>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
              type: //choose the most appropriate type
              data: {
                labels: ['Category 1', 'Category 2'],
                datasets: [{
                  label: 'Dataset',
                  data: [10, 20],
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Chart Title'
                  }
                }
              }
            });
          </script>
        </div>`
            : ''
        }
        
        Important instructions:
        1. Keep your response under 300 words and maximum 2 paragraphs
        2. Base your answer ONLY on the data and analysis provided above
        3. Do not make assumptions or include information not present in the data
        4. Focus on the most relevant findings from the data
        5. Use clear and direct language
        6. Format your response using HTML tags (<p>, <ul>, <li>) to structure your response
        7. Do not include any markdown code blocks or backticks in your response
        8. Answer based on the data and analysis provided above
        ${wantsChart ? '9. Choose the most appropriate chart type based on the data and what you want to show' : ''}
        ${wantsChart ? '10. The chart width should be 100%' : ''}
        `,
        // stream: true,
      });

      const { text, reasoning } = response;

      // Start streaming the response
      let streamedText = '';
      for await (const chunk of text) {
        streamedText += chunk;
        setStreamingText(streamedText);
      }

      // Clean up the response if it contains markdown code blocks
      const cleanedText = streamedText
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      // Extract chart HTML if present
      const chartHtml = wantsChart
        ? cleanedText.match(/<div class="chart-code">([\s\S]*?)<\/div>/)?.[1]
        : undefined;
      const textWithoutChart = wantsChart
        ? cleanedText
            .replace(/<div class="chart-code">[\s\S]*?<\/div>/, '')
            .trim()
        : cleanedText;

      // Escape HTML for the code block
      const escapedChartHtml = chartHtml
        ? chartHtml
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
        : '';

      // Clear streaming text and add the final message
      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          content:
            textWithoutChart +
            (chartHtml ? `<pre><code>${escapedChartHtml}</code></pre>` : ''),
          isUser: false,
          reasoning,
          chartHtml,
        },
      ]);

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
        setLastCachedReasoning(prevCacheEntry.reasoning || null);
      }
      const { reasoning, text } = await generateText({
        model: enhancedModel,
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
      // process the text to remove markdown code blocks
      const cleanedText = text
        .replace(/```html\n/g, '')
        .replace(/```\n/g, '')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

      // Store in cache
      const updatedCache = {
        ...responseCache,
        [cacheKey]: {
          analysis: cleanedText,
          reasoning,
          timestamp: Date.now(),
        },
      };
      setCache(updatedCache);
      setInitialAnalysis(cleanedText);
      setInitialReasoning(reasoning ?? null);
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

  // Chat management functions
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
    lastCachedAnalysis,
    lastCachedReasoning,
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

export default useAIAssistant;

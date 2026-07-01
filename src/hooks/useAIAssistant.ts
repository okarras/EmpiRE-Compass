import { useState, useEffect } from 'react';
import { Query } from '../constants/queries_chart_info';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useAIService } from '../services/backendAIService';
import { orkgAskService } from '../services/orkgAskService';
import { useAppSelector } from '../store/hooks';
import { cleanAiHtmlResponse } from '../utils/aiResponseCleanup';
import { useAssistantMessages } from './useAssistantMessages';
import { useInitialAnalysis } from './useInitialAnalysis';

interface UseAIAssistantProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

const useAIAssistant = ({ query, questionData }: UseAIAssistantProps) => {
  const aiService = useAIService();
  const { pendingPrompt, clearPendingPrompt, assistantProvider } =
    useAIAssistantContext();
  const {
    provider,
    openaiModel,
    groqModel,
    mistralModel,
    googleModel,
    openrouterModel,
  } = useAppSelector((state) => state.ai);

  const currentModel =
    provider === 'openai'
      ? openaiModel
      : provider === 'groq'
        ? groqModel
        : provider === 'mistral'
          ? mistralModel
          : provider === 'google'
            ? googleModel
            : openrouterModel;

  /** Generate text using the selected provider (ORKG Ask default, or store AI) */
  const generateWithProvider = async (
    fullPrompt: string,
    systemContext?: string
  ): Promise<{ text: string; reasoning?: string }> => {
    if (assistantProvider === 'orkg-ask') {
      const res = await orkgAskService.generate(fullPrompt, {
        systemContext,
      });
      return { text: res.text, reasoning: res.reasoning };
    }
    return aiService.generateText(fullPrompt, {
      provider,
      model: currentModel,
      systemContext,
      temperature: 0.3,
      maxTokens: 2000,
    });
  };

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [showChart, setShowChart] = useState(true);

  const { messages, setMessages, clearChatHistory, exportChatHistory } =
    useAssistantMessages({ query });

  const generateSystemContext = () => {
    const safeString = (value: string | string[] | undefined): string => {
      if (!value) return '';
      if (Array.isArray(value)) return value.join(' ');
      return value;
    };

    return `You are analyzing a research question in Requirements Engineering. Please provide your response in HTML format.
      Question: ${query.dataAnalysisInformation.question}
      Question Explanation: ${query.dataAnalysisInformation.questionExplanation}
      Required Data: ${safeString(query.dataAnalysisInformation.requiredDataForAnalysis)}
      Data Analysis Method: ${safeString(query.dataAnalysisInformation.dataAnalysis)}
      Data Interpretation: ${safeString(query.dataAnalysisInformation.dataInterpretation)}

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

  const {
    initialAnalysis,
    initialReasoning,
    isFromCache,
    lastCachedAnalysis,
    lastCachedReasoning,
    refreshingInitialAnalysis,
    undoInitialAnalysis,
    refreshInitialAnalysis,
    canUndoInitialAnalysis,
  } = useInitialAnalysis({
    query,
    questionData,
    generateWithProvider,
    generateSystemContext,
    setLoading,
    setError,
  });

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
      const response = await generateWithProvider(
        `${generateSystemContext()}
        User Question: ${structuredPrompt}

        Please provide a detailed and comprehensive answer to this structured question about the research data.
        
        When the user lists multiple items to include (e.g. "Include: A, B, C, D"), use an <h3> heading for each item, followed by your analysis in <p> tags. Example structure:
        <h3>First item (exact title from user)</h3>
        <p>Your analysis...</p>
        <h3>Second item</h3>
        <p>Your analysis...</p>
        
        Important instructions:
        1. Base your answer ONLY on the data and analysis provided above
        2. Do not make assumptions or include information not present in the data
        3. Focus on the most relevant findings from the data
        4. Use clear and direct language
        5. Format citations as [Author (Year). Title.](https://doi.org/...) or <a href="URL">citation</a>
        6. Do not include any markdown code blocks or backticks in your response
        7. Provide specific insights and detailed explanations
        `
      );

      const { text, reasoning } = response;
      const cleanedText = cleanAiHtmlResponse(text);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    setMessages((prev) => [...prev, { content: prompt, isUser: true }]);

    const wantsDetailed =
      prompt.toLowerCase().includes('detailed') ||
      prompt.toLowerCase().includes('explain') ||
      prompt.toLowerCase().includes('elaborate');

    const wantsChart =
      prompt.toLowerCase().includes('chart') ||
      prompt.toLowerCase().includes('graph') ||
      prompt.toLowerCase().includes('visualize') ||
      prompt.toLowerCase().includes('plot');

    try {
      const response = await generateWithProvider(
        `${generateSystemContext()}
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
        `
      );

      const { text, reasoning } = response;

      const textString =
        typeof text === 'string' ? text : text ? String(text) : '';
      const cleanedText = cleanAiHtmlResponse(textString || '');

      const chartHtml = wantsChart
        ? cleanedText.match(/<div class="chart-code">([\s\S]*?)<\/div>/)?.[1]
        : undefined;
      const textWithoutChart = wantsChart
        ? cleanedText
            .replace(/<div class="chart-code">[\s\S]*?<\/div>/, '')
            .trim()
        : cleanedText;

      const escapedChartHtml = chartHtml
        ? chartHtml
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
        : '';

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

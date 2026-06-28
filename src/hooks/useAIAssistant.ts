import { useState, useEffect } from 'react';
import {
  CHART_GENERATION_SUGGESTION_PROMPT,
  SILENT_CHART_GENERATION_PROMPT,
} from '../constants/prompts';
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
    systemContext?: string,
    responseFormat?: 'text' | 'json'
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
      responseFormat,
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

  const classifyIntent = async (userPrompt: string) => {
    try {
      const response = await generateWithProvider(
        `Analyze the following user prompt and determine the user's intent.
        Respond ONLY with a valid JSON object matching this schema:
        {
          "isChartSuggestions": boolean, // true if asking for suggestions, ideas, or alternative ways to visualize, chart, or graph the data
          "wantsChart": boolean, // true if asking to generate, draw, or show a specific chart, graph, or plot
          "wantsDetailed": boolean // true if asking for a detailed, explain, or elaborate explanation
        }

        User Prompt: "${userPrompt}"`,
        undefined,
        'json'
      );

      const textString =
        typeof response.text === 'string'
          ? response.text
          : String(response.text);
      const cleaned = textString
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse intent JSON', err);
      const lowerPrompt = userPrompt.toLowerCase();
      return {
        isChartSuggestions:
          lowerPrompt.includes('alternative ways to visualize') ||
          lowerPrompt.includes('generate alternative views') ||
          (lowerPrompt.includes('suggest') &&
            (lowerPrompt.includes('chart') ||
              lowerPrompt.includes('graph') ||
              lowerPrompt.includes('visualize') ||
              lowerPrompt.includes('plot'))),
        wantsChart:
          lowerPrompt.includes('chart') ||
          lowerPrompt.includes('graph') ||
          lowerPrompt.includes('visualize') ||
          lowerPrompt.includes('plot'),
        wantsDetailed:
          lowerPrompt.includes('detailed') ||
          lowerPrompt.includes('explain') ||
          lowerPrompt.includes('elaborate'),
      };
    }
  };

  // Process structured prompt function
  const processStructuredPrompt = async (structuredPrompt: string) => {
    if (!structuredPrompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    setMessages((prev) => [
      ...prev,
      { content: structuredPrompt, isUser: true },
    ]);

    // Use LLM to classify intent
    const intent = await classifyIntent(structuredPrompt);
    const isAlternativeViews = intent.isChartSuggestions;

    if (isAlternativeViews) {
      try {
        const response = await generateWithProvider(
          `${generateSystemContext()}
          User Question: ${structuredPrompt}
${CHART_GENERATION_SUGGESTION_PROMPT}`,
          undefined,
          'json'
        );

        const { text, reasoning } = response;
        const textString =
          typeof text === 'string' ? text : text ? String(text) : '';

        // Add the final message with JSON content
        setMessages((prev) => [
          ...prev,
          {
            content: textString.trim(),
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
      return;
    }

    const wantsChart = intent.wantsChart;

    try {
      const response = await generateWithProvider(
        `${generateSystemContext()}
        User Question: ${structuredPrompt}

        Please provide a detailed and comprehensive answer to this structured question about the research data.
        
        ${
          !isAlternativeViews
            ? `When the user lists multiple items to include (e.g. "Include: A, B, C, D"), use an <h3> heading for each item, followed by your analysis in <p> tags. Example structure:
        <h3>First item (exact title from user)</h3>
        <p>Your analysis...</p>
        <h3>Second item</h3>
        <p>Your analysis...</p>`
            : `CRITICAL INSTRUCTION:
        1. Do NOT analyze or write sections/explanations for "Alternative grouping or categorization approaches", "Statistical analysis methods", "What additional questions could be explored", or "How different perspectives might change our understanding". 
        2. Focus EXCLUSIVELY on generating the alternative graphs. Do not write paragraphs or headings for the other bullet points in the user question.
        3. For each alternative graph, output ONLY a brief title and a 1-2 sentence academic explanation of the specific data insight this graph shows. Do not write textbook explanations of chart types.`
        }
        
        ${
          wantsChart
            ? `Additionally, generate at least 2 distinct alternative visual charts using Chart.js to visualize this data from different perspectives. 

        Follow these specific instructions:
        1. Do NOT write generic explanations of what chart types are (e.g. do not write descriptions explaining what a line chart is or what a bar chart is).
        2. **Visualize Different Things**: Each chart must visualize a DIFFERENT aspect, subset, metric, or dimension of the data. Do NOT just plot the exact same data metric in two different chart shapes. For example, if Chart 1 shows the trend of a metric over time (e.g. a line chart), Chart 2 should show a categorical comparison, a distribution breakdown, or a completely different variable or subset of the data (e.g. a bar chart comparing different categories, or a pie chart showing proportions of a specific subset).
        3. Choose the most appropriate chart types dynamically based on the specific metric/dimension being visualized.
        4. For each alternative chart, provide:
           - A short 1-2 sentence analytical explanation of the specific insight this alternative view reveals based on that distinct aspect of the data.
           - The complete, self-contained HTML/Chart.js code to render the chart.
        5. Ensure that every chart has its own distinct <canvas> tag with a unique ID and its own distinct <script> tag initializing it.
        6. Make the charts fully responsive and use a cohesive, premium color scheme (e.g. shades of '#e86161', soft blues, HSL tailored colors).
        7. Format the chart code blocks clearly like this:
        <canvas id="chart1"></canvas>
        <script>
          const ctx1 = document.getElementById('chart1').getContext('2d');
          new Chart(ctx1, {
            type: 'bar',
            data: { ... },
            options: { ... }
          });
        </script>
        `
            : ''
        }

        Important instructions:
        1. Base your answer ONLY on the data and analysis provided above
        2. Do not make assumptions or include information not present in the data
        3. Focus on the most relevant findings from the data
        4. Use clear and direct language
        5. Format citations as [Author (Year). Title.](https://doi.org/...) or <a href="URL">citation</a>
        6. Do not include any markdown code blocks or backticks in your response
        7. Provide specific insights and detailed explanations
        ${wantsChart ? '8. Choose the most appropriate chart type based on the data and what you want to show' : ''}
        ${wantsChart ? '9. The chart width should be 100%' : ''}
        ${
          isAlternativeViews
            ? `10. **CRITICAL REQUIREMENT (VISUALIZE DIFFERENT VARIABLES/DIMENSIONS)**: The alternative charts must plot completely different data variables, categories, subsets, or dimensions (e.g. if Chart 1 plots empirical studies trend over time, Chart 2 MUST plot something completely different, such as a category breakdown, author distribution, or a separate metric). Do NOT just plot the exact same metric in different chart shapes.
        11. Make sure each chart has a distinct, descriptive title reflecting its distinct variable.`
            : ''
        }
        `
      );

      const { text, reasoning } = response;
      const cleanedText = cleanAiHtmlResponse(text);

      // Extract chart HTML if present (match from <canvas> to the last </script> tag)
      let chartHtml: string | undefined = undefined;
      let textWithoutChart = cleanedText;

      if (wantsChart) {
        // Try to match from <canvas> to the last </script> tag
        const chartMatch = cleanedText.match(/(<canvas[\s\S]*<\/script>)/i);
        if (chartMatch) {
          chartHtml = chartMatch[1];
          textWithoutChart = cleanedText.replace(chartHtml, '').trim();

          textWithoutChart = textWithoutChart
            .replace(/<div class="chart-code">/gi, '')
            .replace(/<\/div>/gi, '')
            .trim();

          chartHtml = chartHtml
            .replace(/<div class="chart-code">/gi, '')
            .replace(/<\/div>/gi, '')
            .trim();
        }
      }

      // Add the final message
      setMessages((prev) => [
        ...prev,
        {
          content: textWithoutChart,
          isUser: false,
          reasoning,
          chartHtml,
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

    const intent = await classifyIntent(prompt);
    const isChartSuggestions = intent.isChartSuggestions;

    if (isChartSuggestions) {
      try {
        const response = await generateWithProvider(
          `${generateSystemContext()}
          User Question: ${prompt}

          CRITICAL INSTRUCTION:
          Suggest at least 5 alternative ways to visualize this data.
          You MUST respond ONLY with a single JSON object matching the schema below.
          Do NOT include any markdown code blocks, backticks, comments, or surrounding text.
          The output must be pure, parsable JSON.

          JSON Schema:
          {
            "Suggestions": [
              {
                "chartType": "Bar chart",
                "chartDescription": "Explanation of why this fits the data."
              }
            ]
          }`,
          undefined,
          'json'
        );

        const { text, reasoning } = response;
        const textString =
          typeof text === 'string' ? text : text ? String(text) : '';

        setStreamingText('');
        setMessages((prev) => [
          ...prev,
          {
            content: textString.trim(),
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
        setStreamingText('');
      }
      return;
    }

    // Check intent for detail and charts
    const wantsDetailed = intent.wantsDetailed;
    const wantsChart = intent.wantsChart;

    try {
      const response = await generateWithProvider(
        `${generateSystemContext()}
        User Question: ${prompt}

        Please provide a ${wantsDetailed ? 'detailed' : 'concise'} answer to the user's question.
        ${
          wantsChart
            ? `Additionally, generate a chart using Chart.js to visualize the relevant data. Follow these specific instructions for the chart:
        1. Put ALL chart-related code (canvas and Chart.js initialization script) inside a single <div class="chart-code"> tag.
        2. You MUST inline all data and options directly inside the new Chart(ctx, { ... }) configuration object. Do NOT declare separate variables like const data = ... or const options = ... outside the Chart object.
        3. Choose the most appropriate chart type based on the data and what you want to show:
           - Use 'line' for trends over time
           - Use 'bar' for comparing quantities across categories
           - Use 'pie' or 'doughnut' for showing proportions
           - Use 'scatter' for showing relationships between variables
           - Use 'radar' for comparing multiple variables
           - If a Heatmap is requested or appropriate, use type: 'matrix'. Format dataset data as [{x: 1, y: 1, v: 10}] where 'v' is the value.
           - If a Box Plot is requested or appropriate, use type: 'boxplot'. Format dataset data as an array of raw numbers (e.g. data: [1, 2, 3, 4, 5]).
        3. The chart code should be complete and self-contained
        4. Use proper indentation and formatting
        5. Make the chart responsive and use appropriate colors
        6. Include proper axis labels and title
        7. Format the chart code like this example:
        <div class="chart-code">
          <canvas id="myChart"></canvas>
          <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
              type: //choose the most appropriate type (e.g. 'bar', 'matrix', 'boxplot')
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

      const cleanedText = cleanAiHtmlResponse(text);

      let chartHtml: string | undefined = undefined;
      let textWithoutChart = cleanedText;

      if (wantsChart) {
        const chartMatch = cleanedText.match(/(<canvas[\s\S]*<\/script>)/i);
        if (chartMatch) {
          chartHtml = chartMatch[1];
          textWithoutChart = cleanedText.replace(chartHtml, '').trim();

          textWithoutChart = textWithoutChart
            .replace(/<div class="chart-code">/gi, '')
            .replace(/<\/div>/gi, '')
            .trim();

          chartHtml = chartHtml
            .replace(/<div class="chart-code">/gi, '')
            .replace(/<\/div>/gi, '')
            .trim();
        }
      }

      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          content: textWithoutChart,
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

  const generateChartSilently = async (chartType: string) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    setMessages((prev) => [
      ...prev,
      { content: `Generate ${chartType}`, isUser: true },
    ]);

    const hiddenPrompt = `generate a ${chartType} chart using the dataset provided in the system context.`;

    try {
      const response = await generateWithProvider(
        `${generateSystemContext()}
        User Question: ${hiddenPrompt}
${SILENT_CHART_GENERATION_PROMPT(chartType)}`
      );

      const { text, reasoning } = response;
      const cleanedText = cleanAiHtmlResponse(text);

      let chartHtml: string | undefined = undefined;
      let textWithoutChart = cleanedText;

      const chartMatch = cleanedText.match(/(<canvas[\s\S]*<\/script>)/i);
      if (chartMatch) {
        chartHtml = chartMatch[1];
        textWithoutChart = cleanedText.replace(chartHtml, '').trim();

        textWithoutChart = textWithoutChart
          .replace(/<div class="chart-code">/gi, '')
          .replace(/<\/div>/gi, '')
          .trim();

        chartHtml = chartHtml
          .replace(/<div class="chart-code">/gi, '')
          .replace(/<\/div>/gi, '')
          .trim();
      }

      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          content: textWithoutChart,
          isUser: false,
          reasoning,
          chartHtml,
        },
      ]);
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
    generateChartSilently,
  };
};

export default useAIAssistant;

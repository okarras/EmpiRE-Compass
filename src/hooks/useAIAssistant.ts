import { useState, useEffect } from 'react';
import { DEBUG_AI } from '../config/debugConfig';
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
           - Based on the user's question and the provided data, generate a JavaScript function body that processes the data and returns a chart configuration object. Do not return HTML, <canvas>, or <script> tags. Return ONLY the JavaScript code inside a Markdown code block (\`\`\`javascript ... \`\`\`). The code must conclude by returning the configuration object.
        5. Provide each chart's JavaScript code in a SEPARATE markdown code block. The code will have access to an 'inputData' variable containing the data.
        6. Make the charts fully responsive and use a cohesive, premium color scheme (e.g. shades of '#e86161', soft blues, HSL tailored colors).
        7. Format the code blocks clearly like this:
        \`\`\`javascript
        const config = {
          type: 'bar',
          data: { ... },
          options: { ... }
        };
        return config;
        \`\`\``
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

      const chartConfigs: Record<string, unknown>[] = [];
      let textWithoutChart = cleanedText;

      if (wantsChart) {
        const codeMatches = Array.from(
          cleanedText.matchAll(/```(?:javascript|js)\n([\s\S]*?)```/gi)
        );
        if (codeMatches.length > 0) {
          codeMatches.forEach((match) => {
            try {
              const generateChartConfig = new Function('inputData', match[1]);
              const chartConfig = generateChartConfig(questionData);
              if (chartConfig) {
                if (!chartConfig.options) {
                  chartConfig.options = {};
                }
                chartConfig.options.responsive = true;
                chartConfig.options.maintainAspectRatio = false;

                // Chart.js requires a single dataset for boxplots, but LLMs often generate multiple datasets. Pivot them to prevent rendering errors.
                if (chartConfig.type === 'boxplot') {
                  const originalDatasets = chartConfig.data?.datasets || [];

                  if (originalDatasets.length > 1) {
                    const pivotedLabels: string[] = [];
                    const pivotedData: any[] = [];
                    const backgroundColors: string[] = [];
                    const borderColors: string[] = [];

                    originalDatasets.forEach((ds: any) => {
                      let rawArr = Array.isArray(ds.data[0])
                        ? ds.data[0]
                        : ds.data;
                      let numbers = rawArr
                        .map(Number)
                        .filter((n: number) => !isNaN(n));

                      if (numbers.length > 0) {
                        pivotedLabels.push(ds.label || 'Unknown Category');
                        pivotedData.push(numbers);
                        backgroundColors.push(
                          ds.backgroundColor || 'rgba(54, 162, 235, 0.5)'
                        );
                        borderColors.push(
                          ds.borderColor || 'rgba(54, 162, 235, 1)'
                        );
                      }
                    });

                    chartConfig.data.labels = pivotedLabels;
                    chartConfig.data.datasets = [
                      {
                        label: 'Data Distribution',
                        data: pivotedData,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        outlierBackgroundColor: '#000',
                      },
                    ];
                  } else if (originalDatasets.length === 1) {
                    const ds = originalDatasets[0];
                    ds.data = ds.data.map((innerArr: any) => {
                      const arr = Array.isArray(innerArr)
                        ? innerArr
                        : [innerArr];
                      return arr.map(Number).filter((n: number) => !isNaN(n));
                    });

                    if (
                      !chartConfig.data.labels ||
                      chartConfig.data.labels.length === 0
                    ) {
                      chartConfig.data.labels = ds.data.map(
                        (_: any, i: number) => `Category ${i + 1}`
                      );
                    }
                  }
                }

                // Force y-axis to start at zero to handle LLM scaling hallucinations
                if (!chartConfig.options.scales)
                  chartConfig.options.scales = {};
                if (!chartConfig.options.scales.y)
                  chartConfig.options.scales.y = {};
                chartConfig.options.scales.y.beginAtZero = true;

                if (DEBUG_AI) {
                  console.log(
                    '📊 DEBUG: Generated Chart Config Structure:',
                    chartConfig
                  );
                  chartConfig.data?.datasets?.forEach(
                    (dataset: any, index: number) => {
                      console.log(
                        `Dataset ${index} (${dataset.label}) raw data:`,
                        dataset.data
                      );
                    }
                  );
                }

                chartConfigs.push(chartConfig);
              }
            } catch (error) {
              console.error(
                'AI generated invalid JavaScript configuration:',
                error
              );
            }
          });
          textWithoutChart = cleanedText
            .replace(/```(?:javascript|js)\n[\s\S]*?```/gi, '')
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
          chartConfigs,
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
          Respond ONLY with a raw JSON object containing a 'Suggestions' array. Do not include markdown code blocks, backticks, or any conversational text.
          Example: { "Suggestions": [ { "chartType": "...", "chartDescription": "..." } ] }
          The output must be pure, parsable JSON.`,
          undefined,
          'json'
        );

        const { text, reasoning } = response;
        const textString =
          typeof text === 'string' ? text : text ? String(text) : '';

        if (!textString || textString.trim() === '') {
          throw new Error(
            'The AI Assistant failed to generate a response. Please try again.'
          );
        }

        const jsonMatch = textString.match(/\{[\s\S]*\}/);
        let isValidJson = false;

        if (jsonMatch) {
          try {
            const parsedData = JSON.parse(jsonMatch[0]);
            if (parsedData.Suggestions) {
              isValidJson = true;
            }
          } catch (e) {
            // Parsing failed
          }
        }

        if (
          !isValidJson &&
          (textString.includes('return config;') ||
            textString.match(/```(?:javascript|js)/i))
        ) {
          // Fallback to chart generation if the LLM output code instead of JSON.
          setStreamingText('');
          setLoading(false);
          setPrompt('');
          generateChartSilently('requested chart');
          return;
        }

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

    const dataSample =
      Array.isArray(questionData) && questionData.length > 0
        ? JSON.stringify(questionData[0])
        : '[]';

    try {
      const response = await generateWithProvider(
        `${generateSystemContext()}
        User Question: ${prompt}

        Please provide a ${wantsDetailed ? 'detailed' : 'concise'} answer to the user's question.
        ${
          wantsChart
            ? `Additionally, generate a chart using Chart.js to visualize the relevant data. Follow these specific instructions for the chart:
        1. Based on the user's question and the provided data, generate a JavaScript function body that processes the data and returns a chart configuration object (compatible with our charting library).
        
        IMPORTANT: The 'inputData' array contains objects with this exact structure:
        ${dataSample}
        
        Do not guess property names. Use ONLY the keys provided in the structure above.
        
        2. Do not return HTML, <canvas>, or <script> tags. Return ONLY the JavaScript code inside a Markdown code block (\`\`\`javascript ... \`\`\`). The code must conclude by returning the configuration object.
        3. Choose the most appropriate chart type based on the data and what you want to show:
           - Use 'line' for trends over time
           - Use 'bar' for comparing quantities across categories
           - Use 'pie' or 'doughnut' for showing proportions
           - Use 'scatter' for showing relationships between variables
           - Use 'radar' for comparing multiple variables
           - If a Heatmap is requested or appropriate, use type: 'matrix'. Format dataset data as [{x: 1, y: 1, v: 10}] where 'v' is the value.
           - If a Box Plot is requested or appropriate, use type: 'boxplot'. Note: If generating a 'boxplot', the 'data' property for each dataset MUST be an array of arrays containing strict NUMBERS, not strings (e.g., data: [ [2016, 2018, 2019] ]). Do not quote the numbers. You must also provide an overarching label in data.labels.
        4. The code will have access to an 'inputData' variable containing the data.
        5. Make the chart responsive and use appropriate colors
        6. Include proper axis labels and title
        7. Format the JavaScript code like this example:
        \`\`\`javascript
        const config = {
          type: 'bar',
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
        };
        return config;
        \`\`\``
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

        CRITICAL JAVASCRIPT SYNTAX RULES:
        1. If you hardcode object keys that contain spaces or special characters, you MUST wrap them in quotes (e.g., {'case study': [], 'secondary research': []}). Never write case study: [] without quotes.
        2. Prefer dynamically building objects (e.g., if (!obj[method]) obj[method] = [];) rather than hardcoding specific string keys.
        3. Ensure all code is valid, compilable JavaScript. Do not include trailing commas or syntax errors.
        4. DEFENSIVE PROGRAMMING: When grouping data into nested objects or arrays, you MUST initialize the nested properties before pushing to them.
        Use this exact safe pattern:
        \`\`\`javascript
        if (!myObject[key]) myObject[key] = {};
        if (!myObject[key][subKey]) myObject[key][subKey] = [];
        myObject[key][subKey].push(value);
        \`\`\`
        Never assume a nested array exists. Always filter out undefined, null, or empty keys before grouping.
        
        CRITICAL BOXPLOT DATA RULES:
        A boxplot requires continuous, varying numerical data to calculate quartiles.
        If you are grouping data by category (e.g., 'method'), the array for each category MUST contain varying numbers — such as the specific year of each item (e.g., data: [[2016, 2018, 2021, 2015]]).
        NEVER fill the array with identical constants (like [1, 1, 1]). If the data has no variance, the boxplot will render as an invisible flat line.

        CRITICAL HEATMAP (MATRIX) RULES:
        If the user wants a heatmap, you MUST set type: 'matrix'.
        The data array for the dataset MUST be a single, flat array of objects containing x, y, and v keys.
        x is the column category (e.g., Year), y is the row category (e.g., Method), and v is the numerical value (count/frequency).
        Example: data: [{ x: '2016', y: 'Survey', v: 15 }, { x: '2017', y: 'Experiment', v: 8 }]
        `
      );

      const { text, reasoning } = response;

      const cleanedText = cleanAiHtmlResponse(text);

      const chartConfigs: Record<string, unknown>[] = [];
      let textWithoutChart = cleanedText;

      if (wantsChart) {
        const codeMatches = Array.from(
          cleanedText.matchAll(/```(?:javascript|js)\n([\s\S]*?)```/gi)
        );
        if (codeMatches.length > 0) {
          codeMatches.forEach((match) => {
            try {
              const generateChartConfig = new Function('inputData', match[1]);
              const chartConfig = generateChartConfig(questionData);
              if (chartConfig) {
                chartConfigs.push(chartConfig);
              }
            } catch (error) {
              console.error(
                'AI generated invalid JavaScript configuration:',
                error
              );
              throw new Error(
                'The AI generated invalid chart logic. Please rephrase your question to retry.'
              );
            }
          });
          if (!textWithoutChart.startsWith('I apologize')) {
            textWithoutChart = cleanedText
              .replace(/```(?:javascript|js)\n[\s\S]*?```/gi, '')
              .trim();
          }
        }
      }

      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          content: textWithoutChart,
          isUser: false,
          reasoning,
          chartConfigs,
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

    const dataSample =
      Array.isArray(questionData) && questionData.length > 0
        ? JSON.stringify(questionData[0])
        : '[]';

    try {
      const response = await generateWithProvider(
        `${generateSystemContext()}
        User Question: ${hiddenPrompt}
        
        IMPORTANT: The 'inputData' array contains objects with this exact structure:
        ${dataSample}
        Do not guess property names. Use ONLY the keys provided in the structure above.

${SILENT_CHART_GENERATION_PROMPT(chartType)}`
      );

      const { text, reasoning } = response;
      const cleanedText = cleanAiHtmlResponse(text);

      const chartConfigs: Record<string, unknown>[] = [];
      let textWithoutChart = cleanedText;

      let rawCode = cleanedText;
      const codeMatch = cleanedText.match(/```[a-zA-Z]*\n?([\s\S]*?)```/i);

      if (codeMatch) {
        rawCode = codeMatch[1];
        textWithoutChart = cleanedText
          .replace(/```[a-zA-Z]*\n?[\s\S]*?```/i, '')
          .trim();
      } else {
        rawCode = rawCode.replace(/^(?:javascript|js)\s*\n/i, '');
        if (rawCode.includes('return')) {
          textWithoutChart = '';
        }
      }

      rawCode = rawCode.trim();

      if (rawCode && rawCode.includes('return')) {
        try {
          const generateChartConfig = new Function('inputData', rawCode);
          const chartConfig = generateChartConfig(questionData);
          if (chartConfig) {
            if (!chartConfig.options) {
              chartConfig.options = {};
            }
            chartConfig.options.responsive = true;
            chartConfig.options.maintainAspectRatio = false;

            if (chartConfig.type === 'boxplot') {
              const originalDatasets = chartConfig.data?.datasets || [];

              // Pivot multi-dataset responses from LLMs into a single dataset required by Chart.js boxplots
              if (originalDatasets.length > 1) {
                const pivotedLabels: string[] = [];
                const pivotedData: any[] = [];
                const backgroundColors: string[] = [];
                const borderColors: string[] = [];

                originalDatasets.forEach((ds: any) => {
                  let rawArr = Array.isArray(ds.data[0]) ? ds.data[0] : ds.data;
                  let numbers = rawArr
                    .map(Number)
                    .filter((n: number) => !isNaN(n));

                  if (DEBUG_AI) {
                    console.log(
                      `📊 DEBUG: First 5 values for '${ds.label || 'Category'}':`,
                      numbers.slice(0, 5)
                    );
                  }

                  // Skip empty data arrays to prevent rendering crashes
                  if (numbers.length > 0) {
                    pivotedLabels.push(ds.label || 'Unknown Category');
                    pivotedData.push(numbers);
                    backgroundColors.push(
                      ds.backgroundColor || 'rgba(54, 162, 235, 0.5)'
                    );
                    borderColors.push(
                      ds.borderColor || 'rgba(54, 162, 235, 1)'
                    );
                  }
                });

                chartConfig.data.labels = pivotedLabels;
                chartConfig.data.datasets = [
                  {
                    label: 'Data Distribution',
                    data: pivotedData,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    outlierBackgroundColor: '#000',
                  },
                ];
              } else if (originalDatasets.length === 1) {
                const ds = originalDatasets[0];
                ds.data = ds.data.map((innerArr: any) => {
                  const arr = Array.isArray(innerArr) ? innerArr : [innerArr];
                  return arr.map(Number).filter((n: number) => !isNaN(n));
                });

                if (
                  !chartConfig.data.labels ||
                  chartConfig.data.labels.length === 0
                ) {
                  chartConfig.data.labels = ds.data.map(
                    (_: any, i: number) => `Category ${i + 1}`
                  );
                }
              }
            }

            if (chartConfig.type === 'heatmap') chartConfig.type = 'matrix';

            if (chartConfig.type === 'matrix') {
              let rawData: any[] = [];

              chartConfig.data.datasets.forEach((ds: any) => {
                if (Array.isArray(ds.data)) {
                  rawData = rawData.concat(ds.data);
                }
              });

              // Aggregate overlapping values for the same (x, y) coordinate
              const aggregatedMap = new Map<string, any>();

              rawData.forEach((item: any, index: number) => {
                const x = String(item.x || `Col ${index % 10}`);
                const y = String(
                  item.y || chartConfig.data.datasets[0]?.label || 'Category'
                );
                const v = Number(item.v || 1);

                const key = `${x}___${y}`;
                if (aggregatedMap.has(key)) {
                  aggregatedMap.get(key).v += v;
                } else {
                  aggregatedMap.set(key, { x, y, v });
                }
              });

              const aggregatedData = Array.from(aggregatedMap.values());

              const uniqueX = Array.from(
                new Set(aggregatedData.map((d) => d.x))
              ).sort((a: any, b: any) =>
                isNaN(Number(a)) ? a.localeCompare(b) : Number(a) - Number(b)
              );
              const uniqueY = Array.from(
                new Set(aggregatedData.map((d) => d.y))
              ).sort((a: any, b: any) =>
                isNaN(Number(a)) ? a.localeCompare(b) : Number(a) - Number(b)
              );

              chartConfig.data.labels = uniqueX;
              chartConfig.data.datasets = [
                {
                  label: 'Heatmap Density',
                  data: aggregatedData,
                },
              ];

              const ds = chartConfig.data.datasets[0];

              if (!chartConfig.options.scales) chartConfig.options.scales = {};
              chartConfig.options.scales.x = {
                type: 'category',
                labels: uniqueX,
                offset: true,
                grid: { display: false },
              };
              chartConfig.options.scales.y = {
                type: 'category',
                labels: uniqueY,
                offset: true,
                grid: { display: false },
              };

              const maxV = Math.max(...aggregatedData.map((d: any) => d.v), 1);

              // Map intensity based on value relative to max to ensure low values remain visible
              ds.backgroundColor = (context: any) => {
                const rawValue =
                  context.dataset.data[context.dataIndex]?.v || 0;
                const alpha = maxV > 0 ? 0.15 + 0.85 * (rawValue / maxV) : 0.5;
                return `rgba(54, 162, 235, ${alpha})`;
              };

              // Prevent overlapping lines in visual rendering
              ds.borderColor = 'transparent';
              ds.borderWidth = 0;
              ds.borderRadius = 2;

              ds.width = (context: any) => {
                const chartArea = context.chart?.chartArea;
                if (!chartArea || chartArea.right === undefined) return 30;
                return (
                  (chartArea.right - chartArea.left) /
                    Math.max(1, uniqueX.length) -
                  2
                );
              };
              ds.height = (context: any) => {
                const chartArea = context.chart?.chartArea;
                if (!chartArea || chartArea.bottom === undefined) return 30;
                return (
                  (chartArea.bottom - chartArea.top) /
                    Math.max(1, uniqueY.length) -
                  2
                );
              };
            }

            if (!chartConfig.options.scales) chartConfig.options.scales = {};
            if (!chartConfig.options.scales.y)
              chartConfig.options.scales.y = {};

            // Force Y-axis to 0 to prevent hallucinated scales unless it squashes a boxplot
            if (chartConfig.type !== 'boxplot') {
              chartConfig.options.scales.y.beginAtZero = true;
            } else {
              chartConfig.options.scales.y.beginAtZero = false;
            }

            if (DEBUG_AI) {
              console.log(
                '📊 DEBUG: Generated Chart Config Structure:',
                chartConfig
              );
              chartConfig.data?.datasets?.forEach(
                (dataset: any, index: number) => {
                  console.log(
                    `Dataset ${index} (${dataset.label}) raw data:`,
                    dataset.data
                  );
                }
              );
            }

            chartConfigs.push(chartConfig);
          }
        } catch (error) {
          console.error(
            'AI generated invalid JavaScript configuration:',
            error
          );
          throw new Error(
            'The AI generated invalid chart logic. Please click the chart option again to retry.'
          );
        }
      }

      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          content: textWithoutChart,
          isUser: false,
          reasoning,
          chartConfigs,
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

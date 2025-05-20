import { useState, useEffect } from 'react';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { Query } from '../constants/queries_chart_info';

interface UseAIAssistantProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

const useAIAssistant = ({ query, questionData }: UseAIAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialAnalysis, setInitialAnalysis] = useState<string | null>(null);

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
      Data Sample: ${JSON.stringify(questionData.slice(0, 3), null, 2)}

      Your role is to:
      1. Understand and analyze the research question and its context
      2. Interpret the available data and charts
      3. Provide insights based on the data analysis
      4. Answer specific questions about this research topic
      5. Please maintain an academic and analytical tone in your responses.
      6. Format your response using HTML tags (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <code>, <pre>, <blockquote>, etc.).
      `;
  };

  useEffect(() => {
    const performInitialAnalysis = async () => {
      try {
        setLoading(true);
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
        setInitialAnalysis(text);
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `${generateSystemContext()}

Initial Analysis:
${initialAnalysis}

User Question: ${prompt}

Please provide a detailed answer in HTML format, using appropriate HTML tags (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <code>, <pre>, <blockquote>, etc.) to structure your response.`,
      });
      setResponse(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('AI Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    prompt,
    setPrompt,
    response,
    loading,
    error,
    initialAnalysis,
    handleGenerate,
  };
};

export default useAIAssistant;

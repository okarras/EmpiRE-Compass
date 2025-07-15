import React, { useState } from 'react';
import { CircularProgress, Typography, Paper } from '@mui/material';
import { HistoryItem } from './HistoryManager';
import { useAIService } from '../../services/aiService';

interface AIContentGeneratorProps {
  data: Record<string, unknown>[];
  question: string;
  onContentGenerated: (
    chartHtml: string,
    chartDescription: string,
    questionInterpretation: string,
    dataCollectionInterpretation: string,
    dataAnalysisInterpretation: string
  ) => void;
  onAddToHistory: (
    type: HistoryItem['type'],
    content: string,
    title: string
  ) => void;
  onError: (error: string) => void;
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  data,
  question,
  onContentGenerated,
  onAddToHistory,
  onError,
}) => {
  const aiService = useAIService();
  const [generating, setGenerating] = useState(false);

  const generateContent = async () => {
    setGenerating(true);
    try {
      // Generate HTML chart
      const chartPrompt = `Based on the following SPARQL query results for the research question "${question}", generate a complete HTML chart visualization.

Data: ${JSON.stringify(data, null, 2)}

Requirements:
1. Create a complete HTML document with embedded CSS and JavaScript
2. Use Chart.js (include from CDN: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>)
3. Choose the most appropriate chart type (bar, line, pie, etc.) based on the data
4. Make it responsive and visually appealing with:
   - Professional color scheme (use #e86161 as primary color, with complementary colors)
   - Clean, modern styling with proper spacing
   - Responsive design that works on different screen sizes
   - Clear typography and readable fonts
   - Proper chart padding and margins
   - Smooth animations and hover effects
5. Include proper titles, labels, and legends with good contrast
6. Add tooltips and interactivity
7. Use a container with max-width and centered layout
8. The chart must work standalone in an iframe
9. Include CSS for responsive design and professional appearance
10. CRITICAL: Set html and body background to transparent (background: transparent !important)
11. Remove any scrollbars by setting overflow: hidden on html and body
12. Make the chart container fit the iframe without creating scrollbars
13. Use padding instead of margins to avoid overflow issues
14. The chart container should have NO background color - only the chart itself should be visible
15. Ensure all containers and wrappers have transparent backgrounds
16. The chart should blend seamlessly with the parent page background

Return ONLY the complete HTML code that can be rendered directly in a browser.`;

      const chartResult = await aiService.generateText(chartPrompt, {
        temperature: 0.2,
        maxTokens: 2000,
      });

      let chartHtml = chartResult.text;
      // Ensure Chart.js CDN is present
      if (!chartHtml.includes('cdn.jsdelivr.net/npm/chart.js')) {
        chartHtml = chartHtml.replace(
          '<head>',
          '<head>\n<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
        );
      }

      // Ensure transparent background and no scrollbars
      if (chartHtml.includes('<html')) {
        chartHtml = chartHtml.replace(
          '<html',
          '<html style="background: transparent !important; overflow: hidden;"'
        );
      }
      if (chartHtml.includes('<body')) {
        chartHtml = chartHtml.replace(
          '<body',
          '<body style="background: transparent !important; overflow: hidden; margin: 0; padding: 0;"'
        );
      }

      // Remove any background colors from containers and ensure transparency
      chartHtml = chartHtml.replace(
        /background-color:\s*[^;]+;?/gi,
        'background-color: transparent !important;'
      );
      chartHtml = chartHtml.replace(
        /background:\s*[^;]+;?/gi,
        'background: transparent !important;'
      );

      // Ensure chart container has no background
      chartHtml = chartHtml.replace(
        /<div[^>]*style="[^"]*"[^>]*>/gi,
        (match) => {
          return match.replace(
            /background[^;]*;?/gi,
            'background: transparent !important;'
          );
        }
      );
      onAddToHistory('chart_html', chartHtml, `Chart HTML: ${question}`);

      // Generate chart description
      const descriptionPrompt = `Based on the following data from a SPARQL query about "${question}", provide a detailed chart analysis in HTML format.

Data: ${JSON.stringify(data, null, 2)}

Requirements:
1. Return properly formatted HTML content (not a complete HTML document, just the content)
2. Use semantic HTML tags like <h3>, <p>, <ul>, <li>, <strong>, <em>
3. Include:
   - Clear description of what the chart shows
   - Key patterns and trends visible in the data
   - Notable insights or findings
   - Statistical observations (if applicable)
   - How this relates to Requirements Engineering research
4. Make it well-structured and easy to read
5. Use professional academic language
6. the Description should be only one paragraph, no subheadings

Return ONLY the HTML content (no <html>, <head>, or <body> tags).`;

      const descriptionResult = await aiService.generateText(
        descriptionPrompt,
        {
          temperature: 0.3,
          maxTokens: 1000,
        }
      );

      const chartDescription = descriptionResult.text;
      onAddToHistory(
        'chart_description',
        chartDescription,
        `Chart Analysis: ${question}`
      );

      // Generate Question Information interpretation
      const questionInterpretationPrompt = `Based on the research question "${question}" and the following data, provide a concise explanation for the "Explanation of the Competency Question" section.

Data: ${JSON.stringify(data, null, 2)}

Requirements:
1. Return a simple, clear explanation (not HTML)
2. Focus on:
   - What this research question is about
   - Why it's important in Requirements Engineering
   - How it relates to empirical research
3. Keep it to 2-3 sentences maximum
4. Use professional but accessible language
5. Don't use HTML tags, just plain text

Return ONLY the explanation text.`;

      const questionInterpretationResult = await aiService.generateText(
        questionInterpretationPrompt,
        {
          temperature: 0.3,
          maxTokens: 200,
        }
      );

      const questionInterpretation = questionInterpretationResult.text;
      onAddToHistory(
        'question_interpretation',
        questionInterpretation,
        `Question Interpretation: ${question}`
      );

      // Generate Data Collection interpretation
      const dataCollectionInterpretationPrompt = `Based on the research question "${question}" and the following data, provide a concise explanation for the "Required Data for Analysis" section.

Data: ${JSON.stringify(data, null, 2)}

Requirements:
1. Return a simple, clear explanation (not HTML)
2. Focus on:
   - What kind of data is needed to answer this question
   - What the SPARQL query extracts
   - How the data supports the research objectives
3. Keep it to 2-3 sentences maximum
4. Use professional but accessible language
5. Don't use HTML tags, just plain text

Return ONLY the explanation text.`;

      const dataCollectionInterpretationResult = await aiService.generateText(
        dataCollectionInterpretationPrompt,
        {
          temperature: 0.3,
          maxTokens: 200,
        }
      );

      const dataCollectionInterpretation =
        dataCollectionInterpretationResult.text;
      onAddToHistory(
        'data_collection_interpretation',
        dataCollectionInterpretation,
        `Data Collection Interpretation: ${question}`
      );

      // Generate Data Analysis interpretation
      const dataAnalysisInterpretationPrompt = `Based on the research question "${question}" and the following data, provide a concise explanation for the "Data Analysis" section.

Data: ${JSON.stringify(data, null, 2)}

Requirements:
1. Return a simple, clear explanation (not HTML)
2. Focus on:
   - How the data is analyzed to answer the question
   - What patterns or trends are being examined
   - What insights the analysis provides
3. Keep it to 2-3 sentences maximum
4. Use professional but accessible language
5. Don't use HTML tags, just plain text

Return ONLY the explanation text.`;

      const dataAnalysisInterpretationResult = await aiService.generateText(
        dataAnalysisInterpretationPrompt,
        {
          temperature: 0.3,
          maxTokens: 200,
        }
      );

      const dataAnalysisInterpretation = dataAnalysisInterpretationResult.text;
      onAddToHistory(
        'data_analysis_interpretation',
        dataAnalysisInterpretation,
        `Data Analysis Interpretation: ${question}`
      );

      // Clean up code blocks from generated content
      const chartHtmlWithoutCodeBlocks = chartHtml.replace(
        /```html\n|```/g,
        ''
      );
      const questionInterpretationWithoutCodeBlocks =
        questionInterpretation.replace(/```html\n|```/g, '');
      const dataCollectionInterpretationWithoutCodeBlocks =
        dataCollectionInterpretation.replace(/```html\n|```/g, '');
      const dataAnalysisInterpretationWithoutCodeBlocks =
        dataAnalysisInterpretation.replace(/```html\n|```/g, '');

      // Call the callback with generated content
      onContentGenerated(
        chartHtmlWithoutCodeBlocks,
        chartDescription,
        questionInterpretationWithoutCodeBlocks,
        dataCollectionInterpretationWithoutCodeBlocks,
        dataAnalysisInterpretationWithoutCodeBlocks
      );
    } catch (error) {
      console.error('Error generating AI content:', error);
      onError('Failed to generate AI content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate content when data changes
  React.useEffect(() => {
    if (data.length > 0 && question) {
      generateContent();
    }
  }, [data, question]);

  // Check if AI is configured
  if (!aiService.isConfigured()) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: 'rgba(232, 97, 97, 0.05)',
          border: '1px solid rgba(232, 97, 97, 0.1)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          AI Configuration Required
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Please configure your AI settings before generating content. You can
          choose between OpenAI and Groq providers.
        </Typography>
      </Paper>
    );
  }

  if (generating) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#e86161', mb: 2 }} />
        <Typography color="text.secondary">
          Generating AI charts and analysis...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a moment as we create HTML charts and detailed
          interpretations for each section.
        </Typography>
      </Paper>
    );
  }

  return null;
};

export default AIContentGenerator;

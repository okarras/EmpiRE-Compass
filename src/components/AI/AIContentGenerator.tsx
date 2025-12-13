import React, { useState, useCallback } from 'react';
import { CircularProgress, Typography, Paper } from '@mui/material';
import { useAIService } from '../../services/backendAIService';
import type { CostBreakdown } from '../../utils/costCalculator';

interface AIContentGeneratorProps {
  data: Record<string, unknown>[];
  question: string;
  onContentGenerated: (
    chartHtml: string,
    chartDescription: string,
    questionInterpretation: string,
    dataCollectionInterpretation: string,
    dataAnalysisInterpretation: string,
    costs?: CostBreakdown[]
  ) => void;
  onError: (error: string) => void;
}

interface AIContentGeneratorProps {
  data: Record<string, unknown>[];
  question: string;
  onContentGenerated: (
    chartHtmlContent: string,
    chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string,
    costs?: CostBreakdown[]
  ) => void;
  onError: (error: string) => void;
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  data,
  question,
  onContentGenerated,
  onError,
}) => {
  const aiService = useAIService();
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Helper function to prepare data summary for AI processing
  const prepareDataSummary = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) return 'No data available';

    const columns = Object.keys(data[0] || {});
    const summary: Record<
      string,
      {
        type: string;
        count: number;
        min?: number;
        max?: number;
        unique_values: number;
        sample_values?: unknown[];
      }
    > = {};

    // For each column, provide a summary
    columns.forEach((col) => {
      const values = data
        .map((row) => row[col])
        .filter((val) => val !== null && val !== undefined);
      const uniqueValues = [...new Set(values)];

      if (typeof values[0] === 'number') {
        const nums = values as number[];
        summary[col] = {
          type: 'numeric',
          count: values.length,
          min: Math.min(...nums),
          max: Math.max(...nums),
          unique_values: uniqueValues.length,
        };
      } else {
        summary[col] = {
          type: 'categorical',
          count: values.length,
          unique_values: uniqueValues.length,
          sample_values: uniqueValues.slice(0, 10), // Show first 10 unique values
        };
      }
    });

    return JSON.stringify(summary, null, 2);
  };

  const generateContent = useCallback(async () => {
    if (hasGenerated) {
      return; // Prevent multiple generations
    }

    setGenerating(true);
    setHasGenerated(true);
    try {
      // Prepare data summary for efficient AI processing
      const dataSummary = prepareDataSummary(data);

      // Count unique papers if paper field exists
      const hasPaperField = data.length > 0 && 'paper' in (data[0] || {});
      const uniquePaperCount = hasPaperField
        ? new Set(data.map((row) => row.paper).filter(Boolean)).size
        : data.length;
      const totalRowCount = data.length;

      // Generate HTML chart
      const chartPrompt = `Based on the following SPARQL query results for the research question "${question}", generate a complete HTML chart visualization.

Data Structure:
- Total rows in dataset: ${totalRowCount}
${hasPaperField ? `- Unique papers: ${uniquePaperCount}` : ''}
- Columns: ${Object.keys(data[0] || {}).join(', ')}
- Full dataset (all ${totalRowCount} rows): ${JSON.stringify(data, null, 2)}

Data Summary: ${dataSummary}

CRITICAL DATA INTERPRETATION RULES:
${
  hasPaperField
    ? `- IMPORTANT: This dataset contains ${totalRowCount} rows but only ${uniquePaperCount} UNIQUE PAPERS
- When counting papers, you MUST count UNIQUE papers, not total rows
- Multiple rows may represent the same paper with different attributes (e.g., different methods, years)
- Use JavaScript to count unique papers: const uniquePapers = new Set(chartData.map(d => d.paper)).size
- The chart should reflect the actual count of UNIQUE PAPERS, not the total number of rows
- If showing counts, ensure they represent unique papers, not row counts`
    : '- Count items based on the actual data structure and what makes sense for the question'
}

IMPORTANT DATA PROCESSING INSTRUCTIONS:
- The data will be provided as a JavaScript variable named 'chartData' in the HTML
- DO NOT include the actual data in your generated code - just reference the 'chartData' variable
- The 'chartData' variable will contain the complete dataset as an array of objects
- Process the 'chartData' variable to create appropriate chart datasets
- For time-series data with methods/categories, create grouped or stacked bar charts
- Use all data points from the 'chartData' variable without limiting or sampling
- CRITICAL: When counting papers or entities, count UNIQUE values, not total rows
- Ensure the chart accurately represents the data counts and doesn't inflate numbers

CRITICAL CONSISTENCY REQUIREMENT:
- The chart MUST accurately represent the data counts shown above
${hasPaperField ? `- If counting papers, the chart must show ${uniquePaperCount} (unique papers), NOT ${totalRowCount} (total rows)` : `- The chart must accurately reflect the count of ${totalRowCount} items`}
- Ensure chart labels, titles, and values match the actual data counts
- The chart should be consistent with what the data analysis text will describe

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
6. Add comprehensive interactivity:
   - Hover tooltips showing detailed data
   - Click events for data points
   - Zoom and pan capabilities where appropriate
   - Responsive interactions
   - Smooth animations and transitions
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
    17. Set chart height to at least 500px for better visibility and readability
    18. Enable Chart.js interactions: responsive, maintainAspectRatio, and interaction options
    19. CRITICAL: You must generate COMPLETE HTML from <!DOCTYPE html> to </html>
    20. CRITICAL: Include ALL the data processing logic in the JavaScript
    21. CRITICAL: Do not truncate or abbreviate - generate the full, working HTML document
    22. For large datasets, process and aggregate the data efficiently within the JavaScript
    23. Use appropriate chart types (bar for time series, stacked bar for categories over time)
    24. Ensure the chart handles all data points appropriately

         Return ONLY the complete HTML code that can be rendered directly in a browser. The HTML must be complete and functional.

EXAMPLE of how to use the chartData variable in your JavaScript:
\`\`\`javascript
// The chartData variable will be automatically available
${
  hasPaperField
    ? `// IMPORTANT: Count UNIQUE papers, not total rows
const uniquePapers = new Set(chartData.map(d => d.paper)).size;
// Use uniquePapers (${uniquePaperCount}) for counts, not chartData.length (${totalRowCount})`
    : `// Process the data to create Chart.js datasets`
}
const processedData = {
  labels: [...], // Extract from chartData
  datasets: [...] // Process chartData into chart datasets
  ${hasPaperField ? `// Ensure counts reflect unique papers: ${uniquePaperCount}, not total rows: ${totalRowCount}` : ''}
};

const chart = new Chart(ctx, {
  type: 'bar', // or other appropriate type
  data: processedData,
  options: { ... }
});
\`\`\`

CRITICAL REMINDER:
${
  hasPaperField
    ? `- The dataset has ${totalRowCount} rows but only ${uniquePaperCount} UNIQUE PAPERS
- Your chart MUST show counts based on UNIQUE PAPERS (${uniquePaperCount}), not total rows
- Chart title, labels, and values must reflect the correct count: ${uniquePaperCount} papers
- Do NOT use chartData.length for counting papers - use unique paper count instead`
    : `- Ensure your chart accurately represents ${totalRowCount} items`
}

Generate the complete HTML now:`;

      const chartResult = await aiService.generateText(chartPrompt, {
        temperature: 0.1, // Lower temperature for more consistent generation
        maxTokens: 4000, // Sufficient tokens for HTML structure without data
      });

      let chartHtml = chartResult.text;
      const costs: CostBreakdown[] = [];

      // Track cost for chart generation
      if (chartResult.cost) {
        costs.push({
          ...chartResult.cost,
          section: 'Chart Generation',
        });
      }

      // Inject the actual data into the HTML
      const dataScript = `
    <script>
        // Data provided by the application
        const chartData = ${JSON.stringify(data, null, 2)};

        // Helper function to process data for charts
        window.processChartData = function(data) {
            return data; // Default: return data as-is, can be overridden by generated code
        };
    </script>`;

      // Remove any existing chartData declarations to avoid conflicts
      chartHtml = chartHtml.replace(
        /const\s+chartData\s*=\s*\[[\s\S]*?\];/g,
        ''
      );
      chartHtml = chartHtml.replace(/var\s+chartData\s*=\s*\[[\s\S]*?\];/g, '');
      chartHtml = chartHtml.replace(/let\s+chartData\s*=\s*\[[\s\S]*?\];/g, '');

      // Insert data script after Chart.js CDN but before any other scripts
      if (chartHtml.includes('</head>')) {
        chartHtml = chartHtml.replace('</head>', `${dataScript}\n</head>`);
      } else if (chartHtml.includes('<body>')) {
        chartHtml = chartHtml.replace('<body>', `<body>${dataScript}`);
      } else {
        // Fallback: add before </body>
        chartHtml = chartHtml.replace('</body>', `${dataScript}\n</body>`);
      }

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

      // Generate chart description
      const descriptionPrompt = `Based on the following data from a SPARQL query about "${question}", provide a detailed chart analysis in HTML format.

Data Structure:
- Total rows in dataset: ${totalRowCount}
${hasPaperField ? `- Unique papers: ${uniquePaperCount}` : ''}
- Columns: ${Object.keys(data[0] || {}).join(', ')}
- Full dataset: ${JSON.stringify(data, null, 2)}

Data Summary: ${dataSummary}

CRITICAL DATA INTERPRETATION RULES:
${
  hasPaperField
    ? `- IMPORTANT: This dataset contains ${totalRowCount} rows but only ${uniquePaperCount} UNIQUE PAPERS
- When mentioning counts, refer to UNIQUE PAPERS (${uniquePaperCount}), not total rows
- Ensure your description matches what the chart actually shows`
    : '- Count items based on the actual data structure'
}

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

      // Track cost for description generation
      if (descriptionResult.cost) {
        costs.push({
          ...descriptionResult.cost,
          section: 'Chart Description',
        });
      }

      // Generate Question Information interpretation
      const questionInterpretationPrompt = `Based on the research question "${question}" and the following data, provide a concise explanation for the "Explanation of the Competency Question" section.

Data Summary: ${dataSummary}

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

      // Track cost for question interpretation
      if (questionInterpretationResult.cost) {
        costs.push({
          ...questionInterpretationResult.cost,
          section: 'Question Interpretation',
        });
      }

      // Generate Data Collection interpretation
      const dataCollectionInterpretationPrompt = `Based on the research question "${question}" and the following data, provide a concise explanation for the "Required Data for Analysis" section.

        Data Summary: ${dataSummary}

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

      // Track cost for data collection interpretation
      if (dataCollectionInterpretationResult.cost) {
        costs.push({
          ...dataCollectionInterpretationResult.cost,
          section: 'Data Collection Interpretation',
        });
      }

      // Generate Data Analysis interpretation
      const dataAnalysisInterpretationPrompt = `Based on the research question "${question}" and the following data, provide a concise explanation for the "Data Analysis" section.

Data Structure:
- Total rows in dataset: ${totalRowCount}
${hasPaperField ? `- Unique papers: ${uniquePaperCount}` : ''}
- Columns: ${Object.keys(data[0] || {}).join(', ')}
- Full dataset: ${JSON.stringify(data, null, 2)}

Data Summary: ${dataSummary}

CRITICAL DATA INTERPRETATION RULES:
${
  hasPaperField
    ? `- IMPORTANT: This dataset contains ${totalRowCount} rows but only ${uniquePaperCount} UNIQUE PAPERS
- When mentioning counts in your analysis, you MUST refer to UNIQUE PAPERS (${uniquePaperCount}), not total rows (${totalRowCount})
- Multiple rows may represent the same paper with different attributes
- Be precise: if you mention "one paper" or "X papers", ensure it matches the actual unique paper count
- Do NOT confuse row count with paper count`
    : '- Count items based on the actual data structure and what makes sense for the question'
}

Requirements:
1. Return a simple, clear explanation (not HTML)
2. Focus on:
   - How the data is analyzed to answer the question
   - What patterns or trends are being examined
   - What insights the analysis provides
   - ACCURATE counts: Use the correct count (${hasPaperField ? `${uniquePaperCount} unique papers` : `${totalRowCount} items`}) in your explanation
3. Keep it to 2-3 sentences maximum
4. Use professional but accessible language
5. Don't use HTML tags, just plain text
6. CRITICAL: Ensure any numbers or counts mentioned match the actual data (${hasPaperField ? `${uniquePaperCount} unique papers` : `${totalRowCount} items`})

Return ONLY the explanation text.`;

      const dataAnalysisInterpretationResult = await aiService.generateText(
        dataAnalysisInterpretationPrompt,
        {
          temperature: 0.3,
          maxTokens: 200,
        }
      );

      const dataAnalysisInterpretation = dataAnalysisInterpretationResult.text;

      // Track cost for data analysis interpretation
      if (dataAnalysisInterpretationResult.cost) {
        costs.push({
          ...dataAnalysisInterpretationResult.cost,
          section: 'Data Analysis Interpretation',
        });
      }

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

      // Call the callback with generated content and costs
      onContentGenerated(
        chartHtmlWithoutCodeBlocks,
        chartDescription,
        questionInterpretationWithoutCodeBlocks,
        dataCollectionInterpretationWithoutCodeBlocks,
        dataAnalysisInterpretationWithoutCodeBlocks,
        costs.length > 0 ? costs : undefined
      );
    } catch (error) {
      console.error('Error generating AI content:', error);
      onError('Failed to generate AI content. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [data, question, aiService, hasGenerated]); // Add hasGenerated to prevent multiple generations

  // Auto-generate content when component mounts with data
  React.useEffect(() => {
    if (data.length > 0 && question && !hasGenerated) {
      generateContent();
    }
  }, []); // Empty dependency array - only run once on mount

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

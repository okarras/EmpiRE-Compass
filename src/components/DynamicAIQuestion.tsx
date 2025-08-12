import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Divider,
  Typography,
  Paper,
  Button,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { History, ExpandMore, Code } from '@mui/icons-material';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformationView from './QuestionInformationView';
import SectionSelector from './SectionSelector';
import TextSkeleton from './AI/TextSkeleton';
import HTMLRenderer from './AI/HTMLRenderer';
import AIContentGenerator from './AI/AIContentGenerator';
import SPARQLQuerySection from './AI/SPARQLQuerySection';
import LLMContextHistoryDialog from './AI/LLMContextHistoryDialog';
import { HistoryManager, HistoryItem } from './AI/HistoryManager';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useAIService } from '../services/aiService';
import AIConfigurationButton from './AI/AIConfigurationButton';

import { useDynamicQuestion } from '../context/DynamicQuestionContext';
import DynamicQuestionManager from './AI/DynamicQuestionManager';
import promptTemplate from '../prompts/GENERATE_SPARQL.txt?raw';
import QuestionDataGridView from './QuestionDataGridView';

// Dynamic query interface to match the structure of Query
interface DynamicQuery {
  title: string;
  id: number;
  uid: string;
  dataAnalysisInformation: {
    question: string;
    questionExplanation: string;
    requiredDataForAnalysis: string;
    dataAnalysis: string;
    dataInterpretation: string;
  };
  chartSettings?: {
    series: Array<{ dataKey: string; label: string }>;
    colors?: string[];
    yAxis: Array<{ label: string; dataKey: string }>;
    seriesHeadingTemplate?: string;
    noHeadingInSeries?: boolean;
    height: number;
    sx: Record<string, unknown>;
  };
  chartType?: 'bar' | 'pie';
  dataProcessingFunction?: (
    data: Record<string, unknown>[]
  ) => Record<string, unknown>[];
}

// Added: Type alias for AI-provided processing function
type DataProcessingFn = (
  data: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>
) => Record<string, unknown>[];

const DynamicAIQuestion: React.FC = () => {
  const aiService = useAIService();
  const {
    state,
    updateQuestion,
    updateSparqlQuery,
    updateQueryResults,
    updateChartHtml,
    updateQuestionInterpretation,
    updateDataCollectionInterpretation,
    updateDataAnalysisInterpretation,
    updateProcessingFunctionCode,
  } = useDynamicQuestion();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicQuery, setDynamicQuery] = useState<DynamicQuery | null>(null);

  // Added: state to hold optional AI-provided processing function
  const [aiProcessingFn, setAiProcessingFn] = useState<DataProcessingFn | null>(
    null
  );
  // Added: state to hold the raw JS code for display
  const [aiProcessingCode, setAiProcessingCode] = useState<string | null>(null);

  // History management - no longer needed since DynamicQuestionContext handles history

  const { setContext } = useAIAssistantContext();

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (dynamicQuery && !loading && !error && state.queryResults.length > 0) {
      setContext(dynamicQuery, state.queryResults);
    }
  }, [dynamicQuery, state.queryResults, loading, error, setContext]);

  // Parse SPARQL and JavaScript blocks from Markdown output
  const extractFromMarkdown = (
    markdown: string
  ): {
    sparqlBlocks: Array<{ id: string; query: string }>;
    javascript: string | null;
  } => {
    const sparqlBlockRegex = /```sparql\n([\s\S]*?)\n```/gi;
    const jsRegex = /```(?:javascript|js)\n([\s\S]*?)\n```/i;

    const sparqlBlocks: Array<{ id: string; query: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = sparqlBlockRegex.exec(markdown)) !== null) {
      const full = match[1].trim();
      const lines = full.split(/\n/);
      let id = 'main';
      let startIndex = 0;
      if (lines[0].trim().startsWith('#')) {
        const idMatch = lines[0].match(/#\s*id\s*:\s*([A-Za-z0-9_-]+)/i);
        if (idMatch) {
          id = idMatch[1];
          startIndex = 1;
        }
      }
      const query = lines.slice(startIndex).join('\n').trim();
      if (query) {
        sparqlBlocks.push({ id, query });
      }
    }

    const jsMatch = markdown.match(jsRegex);

    return {
      sparqlBlocks,
      javascript: jsMatch && jsMatch[1] ? jsMatch[1].trim() : null,
    };
  };

  // Compile a processing function from JS code block with better error handling
  const compileProcessingFunction = (
    jsCode: string
  ): DataProcessingFn | null => {
    try {
      const normalized = jsCode.replace(/export\s+default\s+/g, '');
      const factory = new Function(
        `"use strict";\n${normalized}\nreturn typeof processData === 'function' ? processData : null;`
      );
      const fn = factory();
      if (typeof fn === 'function') {
        // Wrap the function to add error handling
        return ((
          data:
            | Record<string, unknown>[]
            | Record<string, Record<string, unknown>[]>
        ) => {
          try {
            // Additional safety check for null/undefined data
            if (data === null || data === undefined) {
              console.warn(
                'AI processing function received null/undefined data, returning empty array'
              );
              return [];
            }
            return fn(data);
          } catch (error) {
            console.error('Error in AI processing function:', error);
            console.error('Function code:', jsCode);
            console.error('Input data:', data);
            // Return empty array on error to prevent crashes
            return [];
          }
        }) as DataProcessingFn;
      }
      return null;
    } catch (error) {
      console.error('Error compiling processing function:', error);
      console.error('JS code:', jsCode);
      return null;
    }
  };

  // Helper function to transform method/category data by year
  const transformMethodDataByYear = useCallback(
    (data: Record<string, unknown>[]): Record<string, unknown>[] => {
      const yearGroups = new Map<string, Map<string, number>>();

      // Find the method/type field and count field
      const firstItem = data[0] as Record<string, unknown>;
      const methodField =
        Object.keys(firstItem).find(
          (key) =>
            key.toLowerCase().includes('method') ||
            key.toLowerCase().includes('type') ||
            key.toLowerCase().includes('label')
        ) || 'method_type_label';

      const countField =
        Object.keys(firstItem).find(
          (key) =>
            key.toLowerCase().includes('count') ||
            typeof firstItem[key] === 'number'
        ) || 'method_count';

      // Group data by year and method type
      data.forEach((item) => {
        const year = String(
          (item as Record<string, unknown>)['year'] || 'Unknown'
        );
        const methodType = String(
          (item as Record<string, unknown>)[methodField] || 'Unknown'
        );
        const count = parseInt(
          String((item as Record<string, unknown>)[countField] || '0')
        );

        if (!yearGroups.has(year)) {
          yearGroups.set(year, new Map());
        }

        const yearData = yearGroups.get(year)!;
        yearData.set(methodType, (yearData.get(methodType) || 0) + count);
      });

      // Transform to chart-friendly format
      return Array.from(yearGroups.entries())
        .map(([year, methods]) => {
          const result: Record<string, unknown> = {
            year: parseInt(year) || year,
          };

          // Add each method type as a separate column
          methods.forEach((count, methodType) => {
            // Clean up method type name for chart display
            const cleanMethodType = methodType
              .replace(/[^a-zA-Z0-9\s]/g, '')
              .replace(/\s+/g, '_')
              .toLowerCase();
            result[cleanMethodType] = count;
          });

          return result;
        })
        .sort((a, b) => {
          const yearA =
            typeof (a as Record<string, unknown>)['year'] === 'number'
              ? ((a as Record<string, unknown>)['year'] as number)
              : parseInt(String((a as Record<string, unknown>)['year']));
          const yearB =
            typeof (b as Record<string, unknown>)['year'] === 'number'
              ? ((b as Record<string, unknown>)['year'] as number)
              : parseInt(String((b as Record<string, unknown>)['year']));
          return (yearA || 0) - (yearB || 0);
        });
    },
    []
  );

  // Enhanced data processing function for dynamic queries (fallback)
  const processDynamicData = useCallback(
    (data: Record<string, unknown>[]): Record<string, unknown>[] => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('processDynamicData received invalid data:', data);
        return [];
      }

      // Detect data structure and apply appropriate processing
      const firstItem = data[0] as Record<string, unknown>;
      const keys = Object.keys(firstItem);

      // Check if this looks like method/category data with counts
      const hasMethodType = keys.some(
        (key) =>
          key.toLowerCase().includes('method') ||
          key.toLowerCase().includes('type') ||
          key.toLowerCase().includes('label')
      );
      const hasCount = keys.some(
        (key) =>
          key.toLowerCase().includes('count') ||
          typeof firstItem[key] === 'number'
      );
      const hasYear = keys.includes('year');

      // If this is method/category data by year, transform it appropriately
      if (hasYear && hasMethodType && hasCount) {
        return transformMethodDataByYear(data);
      }

      // Get all unique numeric keys from the data
      const allKeys = new Set<string>();
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (
            key !== 'year' &&
            key !== 'paper' &&
            typeof item[key] === 'number'
          ) {
            allKeys.add(key);
          }
        });
      });

      // If we have year data, group by year
      if (data.some((item) => (item as Record<string, unknown>)['year'])) {
        const yearGroups = new Map<string, Record<string, unknown>[]>();

        data.forEach((item) => {
          const year = String(
            (item as Record<string, unknown>)['year'] || 'Unknown'
          );
          if (!yearGroups.has(year)) {
            yearGroups.set(year, []);
          }
          yearGroups.get(year)!.push(item);
        });

        return Array.from(yearGroups.entries())
          .map(([year, items]) => {
            const result: Record<string, unknown> = {
              year: parseInt(year) || year,
            };

            allKeys.forEach((key) => {
              const values = items
                .map((item) => (item as Record<string, unknown>)[key])
                .filter((val) => typeof val === 'number') as number[];
              if (values.length > 0) {
                const sum = values.reduce((sum, val) => sum + val, 0);
                result[key] = sum;
                result[`normalized_${key}`] =
                  values.length > 0
                    ? Number(((sum / items.length) * 100).toFixed(2))
                    : 0;
              }
            });

            return result;
          })
          .sort((a, b) => {
            const yearA =
              typeof (a as Record<string, unknown>)['year'] === 'number'
                ? ((a as Record<string, unknown>)['year'] as number)
                : parseInt(String((a as Record<string, unknown>)['year']));
            const yearB =
              typeof (b as Record<string, unknown>)['year'] === 'number'
                ? ((b as Record<string, unknown>)['year'] as number)
                : parseInt(String((b as Record<string, unknown>)['year']));
            return (yearA || 0) - (yearB || 0);
          });
      }

      // If no year data, just return the data as is
      return data;
    },
    [transformMethodDataByYear]
  );

  // Recreate dynamic query when state is loaded from storage
  useEffect(() => {
    if (state.queryResults.length > 0 && state.question && !dynamicQuery) {
      const newDynamicQuery: DynamicQuery = {
        title: `Dynamic Query: ${state.question}`,
        id: Date.now(),
        uid: 'dynamic-query',
        dataAnalysisInformation: {
          question: state.question,
          questionExplanation:
            state.questionInterpretation ||
            `This is a dynamically generated query based on the user's question: "${state.question}". The query was generated using AI and executed against the ORKG database.`,
          requiredDataForAnalysis:
            state.dataCollectionInterpretation ||
            `The query requires data from the ORKG database to answer: "${state.question}". The SPARQL query extracts relevant information based on the research question.`,
          dataAnalysis:
            state.dataAnalysisInterpretation ||
            `The data is analyzed to provide insights related to: "${state.question}". The results show patterns and trends in the Requirements Engineering research domain.`,
          dataInterpretation: `The results should be interpreted in the context of Requirements Engineering research, specifically addressing: "${state.question}".`,
        },
        chartSettings: {
          series: Object.keys(state.queryResults[0] || {})
            .filter(
              (key) =>
                key !== 'year' &&
                key !== 'paper' &&
                typeof state.queryResults[0]?.[key] === 'number'
            )
            .map((key) => ({
              dataKey: key,
              label: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            })),
          colors: ['#e86161', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
          yAxis: [
            {
              label: 'Count',
              dataKey: 'value',
            },
          ],
          height: 400,
          sx: { width: '100%' },
        },
        chartType: 'bar',
        // Don't include processing function to avoid Redux serialization issues
        // dataProcessingFunction: processDynamicData,
      };

      setDynamicQuery(newDynamicQuery);
    }
  }, [
    state.queryResults,
    state.question,
    state.questionInterpretation,
    state.dataCollectionInterpretation,
    state.dataAnalysisInterpretation,
    dynamicQuery,
    processDynamicData,
  ]);

  // Execute SPARQL queries and return raw data without processing
  const executeQueriesRaw = async (
    blocks: Array<{ id: string; query: string }>
  ): Promise<Record<string, unknown>[]> => {
    if (!blocks || blocks.length === 0) return [];

    if (blocks.length === 1) {
      return await fetchSPARQLData(blocks[0].query);
    }

    // Multiple queries: fetch sequentially, build datasets map
    const datasets: Record<string, Record<string, unknown>[]> = {};
    for (const b of blocks) {
      const rows = await fetchSPARQLData(b.query);
      datasets[b.id] = rows;
    }

    // For multiple queries, we need to let the AI processing function handle combination
    // For now, return the first dataset or empty array
    const firstKey = Object.keys(datasets)[0];
    return firstKey ? datasets[firstKey] : [];
  };

  // Generate data processing function based on actual data structure
  const generateDataProcessingFunction = async (
    rawData: Record<string, unknown>[],
    question: string
  ): Promise<DataProcessingFn | null> => {
    try {
      // Safety check for raw data
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.warn(
          'generateDataProcessingFunction received invalid data:',
          rawData
        );
        return null;
      }

      // Create a sample of the data structure for the LLM
      const dataSample = rawData.slice(0, 5); // First 5 rows as sample
      const dataStructure = {
        totalRows: rawData.length,
        columns: Object.keys(rawData[0] || {}),
        sampleData: dataSample,
        dataTypes: Object.fromEntries(
          Object.keys(rawData[0] || {}).map((key) => [
            key,
            typeof rawData[0]?.[key],
          ])
        ),
      };

      const processingPrompt = `You are a data processing expert. Given the following research question and raw data structure from a SPARQL query, generate a JavaScript function to transform the data for visualization.

**Research Question:** ${question}

**Raw Data Structure:**
- Total rows: ${dataStructure.totalRows}
- Columns: ${dataStructure.columns.join(', ')}
- Data types: ${JSON.stringify(dataStructure.dataTypes, null, 2)}

**Sample Data (first 5 rows):**
${JSON.stringify(dataSample, null, 2)}

**Requirements:**
1. Create a function named \`processData\` that takes the raw data array as input
2. ALWAYS check if the input data is null, undefined, or not an array and handle gracefully
3. Transform the data into a format suitable for charting (typically grouped by year if available)
4. Return an array of objects where each object represents a data point for visualization
5. Clean up column names to be chart-friendly (no spaces, lowercase with underscores)
6. Convert string numbers to actual numbers where appropriate
7. Handle missing or null values gracefully

**Output only the JavaScript code block:**

\`\`\`javascript
function processData(rows) {
  // ALWAYS check for null/undefined input first
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  
  // Your transformation logic here
  return transformedData;
}
\`\`\``;

      const result = await aiService.generateText(processingPrompt, {
        temperature: 0.2,
        maxTokens: 1500,
      });

      const { javascript } = extractFromMarkdown(result.text);

      if (javascript) {
        setAiProcessingCode(javascript);
        // Save to shared state and history, labeled as AI-generated
        updateProcessingFunctionCode(javascript, processingPrompt);
        return compileProcessingFunction(javascript);
      }

      return null;
    } catch (error) {
      console.error('Error generating data processing function:', error);
      return null;
    }
  };

  // Create dynamic query object for charts and AI assistant
  const createDynamicQueryObject = (
    transformedData: Record<string, unknown>[]
  ) => {
    const newDynamicQuery: DynamicQuery = {
      title: `Dynamic Query: ${state.question}`,
      id: Date.now(),
      uid: 'dynamic-query',
      dataAnalysisInformation: {
        question: state.question,
        questionExplanation:
          state.questionInterpretation ||
          `This is a dynamically generated query based on the user's question: "${state.question}". The query was generated using AI and executed against the ORKG database.`,
        requiredDataForAnalysis:
          state.dataCollectionInterpretation ||
          `The query requires data from the ORKG database to answer: "${state.question}". The SPARQL query extracts relevant information based on the research question.`,
        dataAnalysis:
          state.dataAnalysisInterpretation ||
          `The data is analyzed to provide insights related to: "${state.question}". The results show patterns and trends in the Requirements Engineering research domain.`,
        dataInterpretation: `The results should be interpreted in the context of Requirements Engineering research, specifically addressing: "${state.question}".`,
      },
      chartSettings: {
        series: Object.keys(transformedData[0] || {})
          .filter(
            (key) =>
              key !== 'year' &&
              key !== 'paper' &&
              typeof (transformedData[0] as Record<string, unknown>)?.[key] ===
                'number'
          )
          .map((key) => ({
            dataKey: key,
            label: key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase()),
          })),
        colors: ['#e86161', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
        yAxis: [
          {
            label: 'Count',
            dataKey: 'value',
          },
        ],
        height: 400,
        sx: { width: '100%' },
      },
      chartType: 'bar',
      // Don't include processing function in the query object to avoid Redux serialization issues
      // dataProcessingFunction: processingFn || processDynamicData,
    };

    setDynamicQuery(newDynamicQuery);
  };

  // Execute single or multiple SPARQL queries and return transformed data (legacy method for edited queries)
  const executeQueries = async (
    blocks: Array<{ id: string; query: string }>,
    processingFn?: DataProcessingFn | null
  ): Promise<Record<string, unknown>[]> => {
    if (!blocks || blocks.length === 0) return [];

    if (blocks.length === 1) {
      const rows = await fetchSPARQLData(blocks[0].query);
      if (processingFn) {
        try {
          return processingFn(rows);
        } catch (e) {
          console.warn(
            'Processing function failed, falling back to default:',
            e
          );
          return processDynamicData(rows);
        }
      }
      return processDynamicData(rows);
    }

    // Multiple queries: fetch sequentially, build datasets map
    const datasets: Record<string, Record<string, unknown>[]> = {};
    for (const b of blocks) {
      const rows = await fetchSPARQLData(b.query);
      datasets[b.id] = rows;
    }

    if (processingFn) {
      try {
        return processingFn(datasets);
      } catch (e) {
        console.error(
          'AI provided multiple queries but processing function failed. Please provide a JS block to combine datasets.',
          e
        );
        return [];
      }
    }

    // No processing function provided for multiple datasets
    setError(
      'Multiple SPARQL queries were generated but no data processing function was provided to combine them.'
    );
    return [];
  };

  const handleRunQuery = async (
    queryOrBlocks: string | Array<{ id: string; query: string }>,
    processingFn?: DataProcessingFn | null
  ) => {
    setLoading(true);
    setError(null);
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');

    try {
      const blocks = Array.isArray(queryOrBlocks)
        ? queryOrBlocks
        : [{ id: 'main', query: queryOrBlocks }];

      const transformed = await executeQueries(blocks, processingFn);

      if (!transformed || transformed.length === 0) {
        setError(
          'Query executed successfully but returned no results after processing. Try modifying your query or research question.'
        );
        updateQueryResults([]);
        return;
      }

      updateQueryResults(transformed);

      // Create dynamic query object for charts and AI assistant
      const newDynamicQuery: DynamicQuery = {
        title: `Dynamic Query: ${state.question}`,
        id: Date.now(),
        uid: 'dynamic-query',
        dataAnalysisInformation: {
          question: state.question,
          questionExplanation:
            state.questionInterpretation ||
            `This is a dynamically generated query based on the user's question: "${state.question}". The query was generated using AI and executed against the ORKG database.`,
          requiredDataForAnalysis:
            state.dataCollectionInterpretation ||
            `The query requires data from the ORKG database to answer: "${state.question}". The SPARQL query extracts relevant information based on the research question.`,
          dataAnalysis:
            state.dataAnalysisInterpretation ||
            `The data is analyzed to provide insights related to: "${state.question}". The results show patterns and trends in the Requirements Engineering research domain.`,
          dataInterpretation: `The results should be interpreted in the context of Requirements Engineering research, specifically addressing: "${state.question}".`,
        },
        chartSettings: {
          series: Object.keys(transformed[0] || {})
            .filter(
              (key) =>
                key !== 'year' &&
                key !== 'paper' &&
                typeof (transformed[0] as Record<string, unknown>)?.[key] ===
                  'number'
            )
            .map((key) => ({
              dataKey: key,
              label: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            })),
          colors: ['#e86161', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
          yAxis: [
            {
              label: 'Count',
              dataKey: 'value',
            },
          ],
          height: 400,
          sx: { width: '100%' },
        },
        chartType: 'bar',
        dataProcessingFunction: processingFn || processDynamicData,
      };

      setDynamicQuery(newDynamicQuery);
    } catch (err: unknown) {
      console.error('An error occurred during query execution:', err);
      let errorMessage =
        'An unexpected error occurred while running the query.';

      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('Not Found')) {
          errorMessage =
            'The SPARQL endpoint is not available. Please try again later.';
        } else if (
          err.message.includes('timeout') ||
          err.message.includes('Timeout')
        ) {
          errorMessage =
            'The query took too long to execute. Try simplifying your query.';
        } else if (
          err.message.includes('syntax') ||
          err.message.includes('Syntax')
        ) {
          errorMessage =
            'The SPARQL query has syntax errors. Please check and fix the query.';
        } else if (
          err.message.includes('network') ||
          err.message.includes('Network')
        ) {
          errorMessage =
            'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      updateQueryResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndRun = async () => {
    if (!state.question.trim()) {
      setError('Please enter a question.');
      return;
    }

    if (!aiService.isConfigured()) {
      setError(
        'Please configure your AI settings before generating SPARQL queries.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    // Immediately clear any previous outputs so UI doesn't show stale content
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');

    updateSparqlQuery('');
    updateQueryResults([]);
    setDynamicQuery(null);
    setAiProcessingFn(null);
    setAiProcessingCode(null);
    updateProcessingFunctionCode('', 'Reset before new generation');

    try {
      // Step 1: Generate SPARQL query only (no JavaScript processing function)
      const sparqlPrompt = promptTemplate.replace(
        '[Research Question]',
        state.question
      );

      const sparqlResult = await aiService.generateText(sparqlPrompt, {
        temperature: 0.1,
        maxTokens: 2000,
      });

      const sparqlText = sparqlResult.text;
      const { sparqlBlocks } = extractFromMarkdown(sparqlText);

      if (!sparqlBlocks || sparqlBlocks.length === 0) {
        throw new Error(
          'The AI did not return a SPARQL code block. Please try rephrasing your question.'
        );
      }

      // Prepare a combined display string for the editor
      const combinedQueryForEditor = sparqlBlocks
        .map((b) => `# id: ${b.id}\n${b.query}`)
        .join('\n\n');
      // Mark as AI-generated by passing the prompt
      updateSparqlQuery(combinedQueryForEditor, sparqlPrompt);

      // Step 2: Execute SPARQL query to get raw data
      const rawData = await executeQueriesRaw(sparqlBlocks);

      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        setError(
          'Query executed successfully but returned no results. Try modifying your research question.'
        );
        updateQueryResults([]);
        return;
      }

      console.log('Raw data from SPARQL:', rawData.slice(0, 3)); // Log first 3 rows for debugging

      // Step 3: Generate data processing function based on actual data structure
      const processingFn = await generateDataProcessingFunction(
        rawData,
        state.question
      );

      // Step 4: Apply processing function to transform data
      let transformedData: Record<string, unknown>[] = [];
      try {
        if (processingFn) {
          console.log('Applying AI-generated processing function to raw data');
          transformedData = processingFn(rawData);
          setAiProcessingFn(processingFn);
        } else {
          console.log(
            'No AI processing function generated, using default processing'
          );
          transformedData = processDynamicData(rawData);
        }

        // Validate transformed data
        if (!transformedData || !Array.isArray(transformedData)) {
          console.warn(
            'Processing function returned invalid data, falling back to default'
          );
          transformedData = processDynamicData(rawData);
        }
      } catch (e) {
        console.warn('Processing function failed, falling back to default:', e);
        transformedData = processDynamicData(rawData);
      }

      console.log('Transformed data:', transformedData.slice(0, 3)); // Log first 3 rows for debugging

      updateQueryResults(transformedData);
      createDynamicQueryObject(transformedData);
    } catch (err: unknown) {
      console.error('An error occurred during generation:', err);
      let errorMessage =
        'An unexpected error occurred during generation. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEditedQuery = () => {
    if (!state.sparqlQuery.trim()) {
      setError('The query is empty.');
      return;
    }

    // Immediately clear any previous outputs so UI doesn't show stale content
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');
    updateQueryResults([]);
    setAiProcessingFn(null);
    setAiProcessingCode(null);
    updateProcessingFunctionCode('', 'Reset before running edited query');

    // Detect whether the edited content contains multiple SPARQL blocks
    const { sparqlBlocks } = extractFromMarkdown(
      '```sparql\n' + state.sparqlQuery + '\n```'
    );
    const blocks =
      sparqlBlocks.length > 0
        ? sparqlBlocks
        : [{ id: 'main', query: state.sparqlQuery }];

    handleRunQuery(blocks, aiProcessingFn);
  };

  const handleContentGenerated = (
    chartHtmlContent: string,
    _chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string
  ) => {
    // Mark as AI-generated by passing the prompt identifier
    updateChartHtml(chartHtmlContent, 'AI generated chart HTML');
    updateQuestionInterpretation(
      questionInterpretationContent,
      'AI generated question interpretation'
    );
    updateDataCollectionInterpretation(
      dataCollectionInterpretationContent,
      'AI generated data collection interpretation'
    );
    updateDataAnalysisInterpretation(
      dataAnalysisInterpretationContent,
      'AI generated data analysis interpretation'
    );

    if (dynamicQuery) {
      setDynamicQuery({
        ...dynamicQuery,
        dataAnalysisInformation: {
          ...dynamicQuery.dataAnalysisInformation,
          questionExplanation: questionInterpretationContent,
          requiredDataForAnalysis: dataCollectionInterpretationContent,
          dataAnalysis: dataAnalysisInterpretationContent,
        },
      });
    }
  };

  const handleApplyHistoryItem = (item: HistoryItem) => {
    switch (item.type) {
      case 'query':
        updateQuestion(item.content);
        break;
      case 'sparql':
        updateSparqlQuery(item.content);
        break;
      case 'chart_html':
        updateChartHtml(item.content);
        break;
      case 'question_interpretation':
        updateQuestionInterpretation(item.content);
        break;
      case 'data_collection_interpretation':
        updateDataCollectionInterpretation(item.content);
        break;
      case 'data_analysis_interpretation':
        updateDataAnalysisInterpretation(item.content);
        break;
      case 'data_interpretation':
        updateQuestionInterpretation(item.content);
        break;
    }
  };

  const [historyType, setHistoryType] = useState<HistoryItem['type'] | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [llmContextHistoryOpen, setLlmContextHistoryOpen] = useState(false);

  const handleOpenHistory = (type: HistoryItem['type']) => {
    setHistoryType(type);
    setHistoryOpen(true);
  };
  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setHistoryType(null);
  };

  const handleOpenLlmContextHistory = () => {
    setLlmContextHistoryOpen(true);
  };

  const handleCloseLlmContextHistory = () => {
    setLlmContextHistoryOpen(false);
  };

  const renderErrorState = (errorMessage: string) => (
    <Box
      sx={{
        p: 4,
        mt: 4,
        textAlign: 'center',
        backgroundColor: 'rgba(232, 97, 97, 0.05)',
        border: '1px solid rgba(232, 97, 97, 0.1)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        An Error Occurred
      </Typography>
      <Typography color="text.secondary">{errorMessage}</Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AIConfigurationButton />
        <Typography variant="body2" color="text.secondary">
          Configure AI settings to use OpenAI or Groq models
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Manage LLM Context History">
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={handleOpenLlmContextHistory}
              size="small"
              sx={{
                borderColor: '#e86161',
                color: '#e86161',
                '&:hover': {
                  borderColor: '#d45151',
                  backgroundColor: 'rgba(232, 97, 97, 0.04)',
                },
              }}
            >
              LLM Context History
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <DynamicQuestionManager />

      <SPARQLQuerySection
        question={state.question}
        sparqlQuery={state.sparqlQuery}
        loading={loading}
        queryResults={state.queryResults}
        queryError={error}
        onQuestionChange={updateQuestion}
        onSparqlChange={updateSparqlQuery}
        onGenerateAndRun={handleGenerateAndRun}
        onRunEditedQuery={handleRunEditedQuery}
        onOpenHistory={handleOpenHistory}
      />

      {/* AI-Generated Data Processing Function Display */}
      {aiProcessingCode && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.12)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code sx={{ color: '#4CAF50' }} />
                <Typography variant="h6" sx={{ color: '#4CAF50' }}>
                  AI-Generated Data Processing Function
                </Typography>
                <Chip
                  label="JavaScript"
                  size="small"
                  sx={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This function was automatically generated by AI to transform the
                SPARQL query results into the format needed for visualization
                and analysis.
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  p: 2,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {aiProcessingCode}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      {loading && !state.sparqlQuery && <TextSkeleton lines={12} />}
      {error && renderErrorState(error)}

      {state.queryResults.length > 0 &&
        state.question &&
        !state.chartHtml &&
        !state.questionInterpretation &&
        !state.dataCollectionInterpretation &&
        !state.dataAnalysisInterpretation && (
          <AIContentGenerator
            data={state.queryResults}
            question={state.question}
            onContentGenerated={handleContentGenerated}
            onError={setError}
          />
        )}

      {dynamicQuery && state.queryResults.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <SectionSelector
            sectionType="information"
            sectionTitle="Question Information"
            query={dynamicQuery}
          />
          <QuestionInformationView query={dynamicQuery} isInteractive={true} />

          {state.chartHtml && (
            <>
              <Divider sx={{ my: 3 }} />
              <HTMLRenderer
                html={state.chartHtml}
                title="AI-Generated Chart"
                type="chart"
                useIframe={true}
                onContentChange={updateChartHtml}
              />
            </>
          )}
        </Paper>
      )}

      {state.queryResults.length > 0 && (
        <QuestionDataGridView questionData={state.queryResults} />
      )}

      <HistoryManager
        onApplyHistoryItem={handleApplyHistoryItem}
        open={historyOpen}
        type={historyType}
        onClose={handleCloseHistory}
      />

      <LLMContextHistoryDialog
        open={llmContextHistoryOpen}
        onClose={handleCloseLlmContextHistory}
      />
    </Box>
  );
};

export default DynamicAIQuestion;

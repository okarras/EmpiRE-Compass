import React, { useState, useEffect } from 'react';
import {
  Box,
  Divider,
  Typography,
  Paper,
  Button,
  Tooltip,
} from '@mui/material';
import { History } from '@mui/icons-material';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformationView from './QuestionInformationView';
import SectionSelector from './SectionSelector';
import TextSkeleton from './AI/TextSkeleton';
import HTMLRenderer from './AI/HTMLRenderer';
import AIContentGenerator from './AI/AIContentGenerator';
import SPARQLQuerySection from './AI/SPARQLQuerySection';
import LLMContextHistoryDialog from './AI/LLMContextHistoryDialog';
import {
  HistoryManager,
  HistoryItem,
  useHistoryManager,
} from './AI/HistoryManager';
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
  } = useDynamicQuestion();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicQuery, setDynamicQuery] = useState<DynamicQuery | null>(null);

  // History management
  const { addToHistory } = useHistoryManager();

  const { setContext } = useAIAssistantContext();

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (dynamicQuery && !loading && !error && state.queryResults.length > 0) {
      setContext(dynamicQuery, state.queryResults);
    }
  }, [dynamicQuery, state.queryResults, loading, error, setContext]);

  // Recreate dynamic query when state is loaded from storage
  useEffect(() => {
    console.log('State loaded:', {
      hasResults: state.queryResults.length > 0,
      hasQuestion: !!state.question,
      hasChart: !!state.chartHtml,
      hasInterpretations: !!(
        state.questionInterpretation ||
        state.dataCollectionInterpretation ||
        state.dataAnalysisInterpretation
      ),
      dynamicQuery: !!dynamicQuery,
    });

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
        dataProcessingFunction: processDynamicData,
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
  ]);

  const extractSparqlFromMarkdown = (markdown: string): string => {
    const sparqlRegex = /```sparql\n([\s\S]*?)\n```/;
    const match = markdown.match(sparqlRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    const genericCodeBlock = /```\n([\s\S]*?)\n```/;
    const genericMatch = markdown.match(genericCodeBlock);
    if (genericMatch && genericMatch[1]) {
      return genericMatch[1].trim();
    }
    return markdown.trim();
  };

  // Simple data processing function for dynamic queries
  const processDynamicData = (
    data: Record<string, unknown>[]
  ): Record<string, unknown>[] => {
    if (!data || data.length === 0) return [];

    // Get all unique keys from the data
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
    if (data.some((item) => item.year)) {
      const yearGroups = new Map<string, Record<string, unknown>[]>();

      data.forEach((item) => {
        const year = String(item.year || 'Unknown');
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
              .map((item) => item[key])
              .filter((val) => typeof val === 'number') as number[];
            if (values.length > 0) {
              result[key] = values.reduce((sum, val) => sum + val, 0);
              result[`normalized_${key}`] =
                values.length > 0
                  ? Number(
                      (
                        (values.reduce((sum, val) => sum + val, 0) /
                          items.length) *
                        100
                      ).toFixed(2)
                    )
                  : 0;
            }
          });

          return result;
        })
        .sort((a, b) => {
          const yearA =
            typeof a.year === 'number' ? a.year : parseInt(String(a.year));
          const yearB =
            typeof b.year === 'number' ? b.year : parseInt(String(b.year));
          return yearA - yearB;
        });
    }

    // If no year data, just return the data as is
    return data;
  };

  const handleRunQuery = async (queryToRun: string) => {
    setLoading(true);
    setError(null);
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');

    try {
      const data = await fetchSPARQLData(queryToRun);

      // Check if we got results
      if (!data || data.length === 0) {
        setError(
          'Query executed successfully but returned no results. Try modifying your query or research question.'
        );
        updateQueryResults([]);
        return;
      }

      updateQueryResults(data);

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
          series: Object.keys(data[0] || {})
            .filter(
              (key) =>
                key !== 'year' &&
                key !== 'paper' &&
                typeof data[0]?.[key] === 'number'
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
        dataProcessingFunction: processDynamicData,
      };

      setDynamicQuery(newDynamicQuery);
    } catch (err: unknown) {
      console.error('An error occurred during query execution:', err);
      let errorMessage =
        'An unexpected error occurred while running the query.';

      if (err instanceof Error) {
        // Provide more specific error messages
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
    updateSparqlQuery('');
    updateQueryResults([]);
    setDynamicQuery(null);

    try {
      const fullPrompt = promptTemplate.replace(
        '[Research Question]',
        state.question
      );

      const result = await aiService.generateText(fullPrompt, {
        temperature: 0.1,
        maxTokens: 2000,
      });

      const generatedText = result.text;
      const sparqlQuery = extractSparqlFromMarkdown(generatedText);

      if (
        !sparqlQuery.trim() ||
        !sparqlQuery.toLowerCase().includes('select')
      ) {
        throw new Error(
          'The AI did not return a valid SPARQL query. Please try rephrasing your question.'
        );
      }

      updateSparqlQuery(sparqlQuery);

      // Add to history
      addToHistory(
        'query',
        state.question,
        `Research Question: ${state.question}`
      );
      addToHistory(
        'sparql',
        sparqlQuery,
        `SPARQL Query for: ${state.question}`
      );

      // Automatically run the generated query
      await handleRunQuery(sparqlQuery);
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

    // Add edited query to history
    addToHistory(
      'sparql',
      state.sparqlQuery,
      `Edited SPARQL Query: ${state.question}`
    );

    handleRunQuery(state.sparqlQuery);
  };

  const handleContentGenerated = (
    chartHtmlContent: string,
    _chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string
  ) => {
    updateChartHtml(chartHtmlContent);
    updateQuestionInterpretation(questionInterpretationContent);
    updateDataCollectionInterpretation(dataCollectionInterpretationContent);
    updateDataAnalysisInterpretation(dataAnalysisInterpretationContent);

    // Update the dynamic query with new AI-generated content
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
        // Legacy support - apply to question interpretation
        updateQuestionInterpretation(item.content);
        break;
    }
  };

  // History dialog state
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
      {/* AI Configuration and Dynamic Question Manager */}
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

      {/* Dynamic Question Manager */}
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

      {/* Loading and Error States */}
      {loading && !state.sparqlQuery && <TextSkeleton lines={12} />}
      {error && renderErrorState(error)}

      {/* AI Content Generation - only if no saved content exists */}
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
            onAddToHistory={addToHistory}
            onError={setError}
          />
        )}

      {/* Results Section */}
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
          {/* Question Information Section */}
          <SectionSelector
            sectionType="information"
            sectionTitle="Question Information"
            query={dynamicQuery}
          />
          <QuestionInformationView query={dynamicQuery} isInteractive={true} />

          {/* AI-Generated Chart (HTML/JS, iframe) */}
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
      {/* GRID VIEW */}
      {state.queryResults.length > 0 && (
        <QuestionDataGridView questionData={state.queryResults} />
      )}

      {/* History Manager Dialog */}
      <HistoryManager
        onApplyHistoryItem={handleApplyHistoryItem}
        open={historyOpen}
        type={historyType}
        onClose={handleCloseHistory}
      />

      {/* LLM Context History Dialog */}
      <LLMContextHistoryDialog
        open={llmContextHistoryOpen}
        onClose={handleCloseLlmContextHistory}
        onApplyHistoryItem={handleApplyHistoryItem}
      />
    </Box>
  );
};

export default DynamicAIQuestion;

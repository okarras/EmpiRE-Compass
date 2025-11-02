import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import fetchSPARQLData from '../helpers/fetch_query';
import LLMContextHistoryDialog from './AI/LLMContextHistoryDialog';
import { HistoryManager, HistoryItem } from './AI/HistoryManager';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useAIService } from '../services/aiService';
import { useDynamicQuestion } from '../context/DynamicQuestionContext';
import QueryExecutionSection from './AI/QueryExecutionSection';
import DataProcessingCodeSection from './AI/DataProcessingCodeSection';
import ResultsDisplaySection from './AI/ResultsDisplaySection';
import { useTemplateLoader } from '../hooks/useTemplateLoader';
import { useQueryGeneration } from '../hooks/useQueryGeneration';
import { useDataProcessing } from '../hooks/useDataProcessing';
import { parseSparqlBlocks } from '../utils/queryParser';
import { processDynamicData } from '../utils/dataTransform';
import { buildDynamicQuery, DynamicQuery } from '../utils/dynamicQueryBuilder';
import { useLocation } from 'react-router-dom';

const DynamicAIQuestion = () => {
  const aiService = useAIService();
  const {
    state,
    updateQuestion,
    updateSparqlQuery,
    updateSparqlTranslation,
    updateQueryResults,
    updateChartHtml,
    updateQuestionInterpretation,
    updateDataCollectionInterpretation,
    updateDataAnalysisInterpretation,
    updateProcessingFunctionCode,
    updateTemplateId,
    updateTemplateMapping,
    updateTargetClassId,
  } = useDynamicQuestion();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const [templateId, setTemplateId] = useState<string>(
    location.search.split('template=')[1] || 'R186491'
  );
  const [dynamicQuery, setDynamicQuery] = useState<DynamicQuery | null>(null);
  const [maxIterations] = useState<number>(3);

  const { setContext } = useAIAssistantContext();

  // Use custom hooks
  const { handleTemplateChange, loadSavedTemplate } = useTemplateLoader({
    updateTemplateId,
    updateTemplateMapping,
    updateTargetClassId,
    currentTargetClassId: state.targetClassId,
  });

  const {
    generateQueryWithRefinement,
    executeQueriesRaw,
    currentIteration,
    iterationFeedback,
    iterationHistory,
  } = useQueryGeneration({
    templateMapping: state.templateMapping ?? undefined,
    templateId: state.templateId ?? undefined,
    targetClassId: state.targetClassId ?? undefined,
    updateSparqlQuery,
  });

  const {
    processingFn,
    processingCode,
    generateProcessingFunction,
    updateProcessingCode,
    hydrateProcessingFunction,
  } = useDataProcessing({
    updateProcessingFunctionCode,
    templateId: state.templateId ?? undefined,
  });

  useEffect(() => {
    setTemplateId(location.search.split('template=')[1] || 'R186491');
  }, [location.search]);

  // Initialize template ID in context
  useEffect(() => {
    if (templateId && state.templateId !== templateId) {
      void handleTemplateChange(templateId);
      if (templateId === 'R186491' && state.targetClassId !== 'C27001') {
        updateTargetClassId('C27001');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, state.templateId]);

  // Load saved template from localStorage on mount
  useEffect(() => {
    void loadSavedTemplate(state.templateId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (dynamicQuery && !loading && !error && state.queryResults.length > 0) {
      setContext(dynamicQuery, state.queryResults);
    }
  }, [dynamicQuery, state.queryResults, loading, error, setContext]);

  // Hydrate processing function from persisted state
  useEffect(() => {
    hydrateProcessingFunction(state.processingFunctionCode ?? '');
  }, [state.processingFunctionCode, hydrateProcessingFunction]);

  // Recreate dynamic query when state is loaded from storage
  useEffect(() => {
    if (state.queryResults.length > 0 && state.question && !dynamicQuery) {
      const newDynamicQuery = buildDynamicQuery({
        question: state.question,
        transformedData: state.queryResults,
        questionInterpretation: state.questionInterpretation,
        dataCollectionInterpretation: state.dataCollectionInterpretation,
        dataAnalysisInterpretation: state.dataAnalysisInterpretation,
      });
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

  // Execute SPARQL queries with processing
  const executeQueries = async (
    queryString: string,
    useProcessingFn = true
  ): Promise<Record<string, unknown>[]> => {
    const blocks = parseSparqlBlocks(queryString);
    const rawData = await fetchSPARQLData(blocks[0].query);

    if (useProcessingFn && processingFn) {
      try {
        return processingFn(rawData);
      } catch (e) {
        console.warn('Processing function failed, falling back to default:', e);
        return processDynamicData(rawData);
      }
    }
    return processDynamicData(rawData);
  };

  const handleRunQuery = async (queryString: string) => {
    setLoading(true);
    setError(null);
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');

    try {
      const transformed = await executeQueries(queryString);

      if (!transformed || transformed.length === 0) {
        setError(
          'Query executed successfully but returned no results after processing. Try modifying your query or research question.'
        );
        updateQueryResults([]);
        return;
      }

      updateQueryResults(transformed);

      // Auto-update processing function if needed
      if (state.question && state.question.trim() && transformed.length > 0) {
        try {
          await generateProcessingFunction(
            transformed,
            state.question,
            true // Skip if exists
          );
        } catch (err) {
          console.warn('Failed to auto-update processing function:', err);
        }
      }

      const newDynamicQuery = buildDynamicQuery({
        question: state.question,
        transformedData: transformed,
        questionInterpretation: state.questionInterpretation,
        dataCollectionInterpretation: state.dataCollectionInterpretation,
        dataAnalysisInterpretation: state.dataAnalysisInterpretation,
      });

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

    // Clear previous outputs
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');
    updateSparqlQuery('');
    updateSparqlTranslation('');
    updateQueryResults([]);
    setDynamicQuery(null);
    updateProcessingFunctionCode('', 'Reset before new generation');

    try {
      // Generate query with iterative refinement
      const { rawData } = await generateQueryWithRefinement(
        state.question,
        maxIterations
      );

      if (!rawData || rawData.length === 0) {
        setError(
          'Query executed successfully but returned no results after multiple refinement attempts. Try modifying your research question.'
        );
        updateQueryResults([]);
        return;
      }

      // Generate data processing function
      const newProcessingFn = await generateProcessingFunction(
        rawData,
        state.question,
        false
      );

      // Transform data
      let transformedData: Record<string, unknown>[] = [];
      try {
        if (newProcessingFn) {
          transformedData = newProcessingFn(rawData);
        } else {
          transformedData = processDynamicData(rawData);
        }

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

      updateQueryResults(transformedData);

      const newDynamicQuery = buildDynamicQuery({
        question: state.question,
        transformedData,
        questionInterpretation: state.questionInterpretation,
        dataCollectionInterpretation: state.dataCollectionInterpretation,
        dataAnalysisInterpretation: state.dataAnalysisInterpretation,
      });

      setDynamicQuery(newDynamicQuery);
    } catch (err: unknown) {
      console.error('An error occurred during generation:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during generation. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEditedQuery = async () => {
    if (!state.sparqlQuery.trim()) {
      setError('The query is empty.');
      return;
    }

    // Clear previous outputs
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');
    updateQueryResults([]);

    // Auto-regenerate processing function when SPARQL is edited
    if (state.question && state.question.trim()) {
      try {
        setLoading(true);
        const blocks = parseSparqlBlocks(state.sparqlQuery);
        const rawData = await executeQueriesRaw(blocks);
        if (rawData && rawData.length > 0) {
          await generateProcessingFunction(
            rawData,
            state.question,
            true // Skip if exists
          );
        }
        setLoading(false);
      } catch (err) {
        console.warn('Failed to regenerate processing function:', err);
        setLoading(false);
      }
    }

    handleRunQuery(state.sparqlQuery);
  };

  const handleContentGenerated = (
    chartHtmlContent: string,
    _chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string
  ) => {
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

  const handleOpenProcessingHistory = () => {
    setHistoryType('data_analysis_interpretation');
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

  const handleProcessingCodeChange = async (code: string) => {
    const compiled = updateProcessingCode(code);

    // Auto-update results when processing function changes
    if (compiled && state.queryResults.length > 0) {
      try {
        if (state.sparqlQuery && state.sparqlQuery.trim()) {
          const blocks = parseSparqlBlocks(state.sparqlQuery);
          const rawData = await executeQueriesRaw(blocks);
          if (rawData && rawData.length > 0) {
            const reprocessedData = compiled(rawData);
            if (reprocessedData && reprocessedData.length > 0) {
              updateQueryResults(reprocessedData);
              const newDynamicQuery = buildDynamicQuery({
                question: state.question,
                transformedData: reprocessedData,
                questionInterpretation: state.questionInterpretation,
                dataCollectionInterpretation:
                  state.dataCollectionInterpretation,
                dataAnalysisInterpretation: state.dataAnalysisInterpretation,
              });
              setDynamicQuery(newDynamicQuery);
            }
          }
        }
      } catch (err) {
        console.warn(
          'Failed to auto-update results after processing function change:',
          err
        );
      }
    }
  };

  const handleRegenerateProcessingCode = async () => {
    if (!state.question || !state.queryResults.length) {
      setError('No question or data available to regenerate processing code.');
      return;
    }

    try {
      setLoading(true);
      await generateProcessingFunction(
        state.queryResults,
        state.question,
        false // Force regeneration
      );
    } catch (err) {
      console.error('Failed to regenerate processing code:', err);
      setError('Failed to regenerate processing code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <QueryExecutionSection
        question={state.question}
        sparqlQuery={state.sparqlQuery}
        sparqlTranslation={state.sparqlTranslation}
        loading={loading}
        queryResults={state.queryResults}
        queryError={error}
        onQuestionChange={updateQuestion}
        onSparqlChange={updateSparqlQuery}
        onSparqlTranslationChange={updateSparqlTranslation}
        onGenerateAndRun={handleGenerateAndRun}
        onRunEditedQuery={handleRunEditedQuery}
        onOpenHistory={handleOpenHistory}
        onOpenLlmContextHistory={handleOpenLlmContextHistory}
        currentTemplateId={state.templateId}
        onTemplateIdChange={handleTemplateChange}
        iterationFeedback={currentIteration > 0 ? iterationFeedback : undefined}
        currentIteration={currentIteration}
        maxIterations={maxIterations}
        iterationHistory={iterationHistory}
      />

      <DataProcessingCodeSection
        processingCode={processingCode}
        loading={loading}
        onCodeChange={handleProcessingCodeChange}
        onRegenerateCode={handleRegenerateProcessingCode}
        onOpenHistory={handleOpenProcessingHistory}
      />

      <ResultsDisplaySection
        loading={loading}
        error={error}
        question={state.question}
        sparqlQuery={state.sparqlQuery}
        queryResults={state.queryResults}
        chartHtml={state.chartHtml}
        questionInterpretation={state.questionInterpretation}
        dataCollectionInterpretation={state.dataCollectionInterpretation}
        dataAnalysisInterpretation={state.dataAnalysisInterpretation}
        dynamicQuery={dynamicQuery}
        onContentGenerated={handleContentGenerated}
        onError={setError}
        onChartHtmlChange={updateChartHtml}
      />

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

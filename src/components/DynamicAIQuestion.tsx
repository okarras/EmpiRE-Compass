import { useState, useEffect } from 'react';
import { Box, Button, Snackbar, Alert } from '@mui/material';
import { Save, Undo } from '@mui/icons-material';
import fetchSPARQLData from '../helpers/fetch_query';
import LLMContextHistoryDialog from './AI/LLMContextHistoryDialog';
import { HistoryManager, HistoryItem } from './AI/HistoryManager';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useAIService } from '../services/backendAIService';
import { useDynamicQuestion } from '../context/DynamicQuestionContext';
import QueryExecutionSection from './AI/QueryExecutionSection';
import DataProcessingCodeSection from './AI/DataProcessingCodeSection';
import ResultsDisplaySection from './AI/ResultsDisplaySection';
import DynamicQuestionExamples from './AI/DynamicQuestionExamples';
import SaveDynamicQuestionDialog from './AI/SaveDynamicQuestionDialog';
import { useTemplateLoader } from '../hooks/useTemplateLoader';
import { useQueryGeneration } from '../hooks/useQueryGeneration';
import { useDataProcessing } from '../hooks/useDataProcessing';
import { parseSparqlBlocks } from '../utils/queryParser';
import { processDynamicData } from '../utils/dataTransform';
import { buildDynamicQuery, DynamicQuery } from '../utils/dynamicQueryBuilder';
import { useLocation } from 'react-router-dom';
import { PredicatesMapping } from '../components/Graph/types';
import type { CostBreakdown } from '../utils/costCalculator';
import type { DynamicQuestion } from '../firestore/CRUDDynamicQuestions';
import { useAuthData } from '../auth/useAuthData';
import CRUDDynamicQuestions from '../firestore/CRUDDynamicQuestions';

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
    updateCosts,
  } = useDynamicQuestion();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const [templateId, setTemplateId] = useState<string>(
    location.pathname.split('/')[1] || 'R186491'
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
    resetIterationHistory,
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
    setTemplateId(location.pathname.split('/')[1] || 'R186491');
  }, [location.pathname]);

  // Initialize template ID in context
  useEffect(() => {
    const hasMappingData =
      state.templateMapping && Object.keys(state.templateMapping).length > 0;

    if (templateId && state.templateId !== templateId) {
      void handleTemplateChange(templateId);
      // Set default target class IDs for known templates
      //TODO: this section should be done dynamically this is a temporary solution
      if (templateId === 'R186491' && state.targetClassId !== 'C27001') {
        updateTargetClassId('C27001');
      } else if (
        templateId === 'R1544125' &&
        state.targetClassId !== 'C121001'
      ) {
        updateTargetClassId('C121001');
      }
    } else if (
      templateId &&
      state.templateId === templateId &&
      !hasMappingData
    ) {
      // Template ID matches but mapping is missing - load it
      void handleTemplateChange(templateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, state.templateId, state.templateMapping]);

  // Load saved template from localStorage on mount
  useEffect(() => {
    void loadSavedTemplate(state.templateId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (
      dynamicQuery &&
      !loading &&
      !error &&
      state.queryResults &&
      Array.isArray(state.queryResults) &&
      state.queryResults.length > 0
    ) {
      setContext(dynamicQuery, state.queryResults);
    }
  }, [dynamicQuery, state.queryResults, loading, error, setContext]);

  // Hydrate processing function from persisted state
  useEffect(() => {
    hydrateProcessingFunction(state.processingFunctionCode ?? '');
  }, [state.processingFunctionCode, hydrateProcessingFunction]);

  // Recreate dynamic query when state is loaded from storage
  useEffect(() => {
    if (
      state.queryResults &&
      Array.isArray(state.queryResults) &&
      state.queryResults.length > 0 &&
      state.question &&
      !dynamicQuery
    ) {
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

      if (
        !transformed ||
        !Array.isArray(transformed) ||
        transformed.length === 0
      ) {
        setError(
          'Query executed successfully but returned no results after processing. Try modifying your query or research question.'
        );
        updateQueryResults([]);
        return;
      }

      updateQueryResults(transformed);

      // Auto-update processing function if needed
      if (
        state.question &&
        state.question.trim() &&
        Array.isArray(transformed) &&
        transformed.length > 0
      ) {
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
    updateCosts([]); // Reset costs for new generation

    try {
      // Generate query with iterative refinement
      const { rawData, costs: queryCosts } = await generateQueryWithRefinement(
        state.question,
        maxIterations
      );

      // Set query generation costs
      if (queryCosts && Array.isArray(queryCosts) && queryCosts.length > 0) {
        updateCosts(queryCosts);
      }

      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
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

      // Note: Processing function cost will be tracked separately if needed
      // For now, we track costs from query generation iterations

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

  const handleRunEditedQuery = async (queryToRun?: string) => {
    // Use the provided query or fall back to state
    const query = queryToRun || state.sparqlQuery;

    if (!query || !query.trim()) {
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
        const blocks = parseSparqlBlocks(query);
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

    handleRunQuery(query);
  };

  const handleContentGenerated = (
    chartHtmlContent: string,
    _chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string,
    contentCosts?: CostBreakdown[]
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

    // Add content generation costs to the total costs
    if (
      contentCosts &&
      Array.isArray(contentCosts) &&
      contentCosts.length > 0
    ) {
      const currentCosts = Array.isArray(state.costs) ? state.costs : [];
      updateCosts([...currentCosts, ...contentCosts]);
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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savingExample, setSavingExample] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [examplesRefreshTrigger, setExamplesRefreshTrigger] = useState(0);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [previousState, setPreviousState] = useState<{
    question: string;
    sparqlQuery: string;
    sparqlTranslation: string;
    queryResults: Record<string, unknown>[];
    chartHtml: string;
    questionInterpretation: string;
    dataCollectionInterpretation: string;
    dataAnalysisInterpretation: string;
    processingFunctionCode: string;
    costs: any[];
  } | null>(null);

  // Check if user is admin
  const { user } = useAuthData();
  const isAdmin = user?.is_admin === true;

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
    if (
      compiled &&
      state.queryResults &&
      Array.isArray(state.queryResults) &&
      state.queryResults.length > 0
    ) {
      try {
        if (state.sparqlQuery && state.sparqlQuery.trim()) {
          const blocks = parseSparqlBlocks(state.sparqlQuery);
          const rawData = await executeQueriesRaw(blocks);
          if (rawData && Array.isArray(rawData) && rawData.length > 0) {
            const reprocessedData = compiled(rawData);
            if (
              reprocessedData &&
              Array.isArray(reprocessedData) &&
              reprocessedData.length > 0
            ) {
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
    if (
      !state.question ||
      !state.queryResults ||
      !Array.isArray(state.queryResults) ||
      state.queryResults.length === 0
    ) {
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

  const handleLoadExample = (example: DynamicQuestion) => {
    const exampleState = example.state;

    // Reset iteration history when loading a new example
    resetIterationHistory();

    // Load all state from the example
    if (exampleState.question) {
      updateQuestion(exampleState.question);
    }
    if (exampleState.sparqlQuery) {
      updateSparqlQuery(exampleState.sparqlQuery);
    }
    if (exampleState.sparqlTranslation) {
      updateSparqlTranslation(exampleState.sparqlTranslation);
    }
    if (exampleState.queryResults) {
      // Ensure queryResults are properly serialized (deep clone to avoid reference issues)
      const serializedResults = JSON.parse(
        JSON.stringify(exampleState.queryResults)
      );
      updateQueryResults(serializedResults);
    }
    if (exampleState.chartHtml) {
      updateChartHtml(exampleState.chartHtml);
    }
    if (exampleState.questionInterpretation) {
      updateQuestionInterpretation(exampleState.questionInterpretation);
    }
    if (exampleState.dataCollectionInterpretation) {
      updateDataCollectionInterpretation(
        exampleState.dataCollectionInterpretation
      );
    }
    if (exampleState.dataAnalysisInterpretation) {
      updateDataAnalysisInterpretation(exampleState.dataAnalysisInterpretation);
    }
    if (exampleState.processingFunctionCode) {
      updateProcessingFunctionCode(exampleState.processingFunctionCode);
    }
    if (exampleState.templateId) {
      updateTemplateId(exampleState.templateId);
      void handleTemplateChange(exampleState.templateId);
    }
    if (exampleState.templateMapping) {
      updateTemplateMapping(exampleState.templateMapping);
    }
    if (exampleState.targetClassId) {
      updateTargetClassId(exampleState.targetClassId);
    }

    // Rebuild dynamic query if we have results
    if (
      exampleState.queryResults &&
      Array.isArray(exampleState.queryResults) &&
      exampleState.queryResults.length > 0
    ) {
      const newDynamicQuery = buildDynamicQuery({
        question: exampleState.question || '',
        transformedData: exampleState.queryResults,
        questionInterpretation: exampleState.questionInterpretation || '',
        dataCollectionInterpretation:
          exampleState.dataCollectionInterpretation || '',
        dataAnalysisInterpretation:
          exampleState.dataAnalysisInterpretation || '',
      });
      setDynamicQuery(newDynamicQuery);
    }
  };

  const handleClearAll = () => {
    // Save current state for undo
    setPreviousState({
      question: state.question || '',
      sparqlQuery: state.sparqlQuery || '',
      sparqlTranslation: state.sparqlTranslation || '',
      queryResults: state.queryResults || [],
      chartHtml: state.chartHtml || '',
      questionInterpretation: state.questionInterpretation || '',
      dataCollectionInterpretation: state.dataCollectionInterpretation || '',
      dataAnalysisInterpretation: state.dataAnalysisInterpretation || '',
      processingFunctionCode: state.processingFunctionCode || '',
      costs: state.costs || [],
    });

    // Reset iteration history
    resetIterationHistory();

    // Clear all state fields
    updateQuestion('');
    updateSparqlQuery('');
    updateSparqlTranslation('');
    updateQueryResults([]);
    updateChartHtml('');
    updateQuestionInterpretation('');
    updateDataCollectionInterpretation('');
    updateDataAnalysisInterpretation('');
    updateProcessingFunctionCode('', 'Cleared all fields');
    updateCosts([]);
    setDynamicQuery(null);
    setError(null);
    setShowUndoSnackbar(true);
  };

  const handleUndo = () => {
    if (!previousState) return;

    // Restore previous state
    updateQuestion(previousState.question);
    updateSparqlQuery(previousState.sparqlQuery);
    updateSparqlTranslation(previousState.sparqlTranslation);
    updateQueryResults(previousState.queryResults);
    updateChartHtml(previousState.chartHtml);
    updateQuestionInterpretation(previousState.questionInterpretation);
    updateDataCollectionInterpretation(
      previousState.dataCollectionInterpretation
    );
    updateDataAnalysisInterpretation(previousState.dataAnalysisInterpretation);
    updateProcessingFunctionCode(
      previousState.processingFunctionCode,
      'Restored from undo'
    );
    updateCosts(previousState.costs);

    // Clear undo state
    setPreviousState(null);
    setShowUndoSnackbar(false);
  };

  const handleSaveExample = async (name: string) => {
    // Validate that we have at least a question
    if (!state.question || !state.question.trim()) {
      throw new Error('Please enter a question before saving as an example');
    }

    setSavingExample(true);
    setSaveError(null);

    try {
      // Create the dynamic question object from current state
      const questionId = `question_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const dynamicQuestion: DynamicQuestion = {
        id: questionId,
        name: name,
        timestamp: Date.now(),
        state: {
          question: state.question,
          sparqlQuery: state.sparqlQuery || '',
          sparqlTranslation: state.sparqlTranslation || '',
          queryResults: state.queryResults || [],
          chartHtml: state.chartHtml || '',
          questionInterpretation: state.questionInterpretation || '',
          dataCollectionInterpretation:
            state.dataCollectionInterpretation || '',
          dataAnalysisInterpretation: state.dataAnalysisInterpretation || '',
          processingFunctionCode: state.processingFunctionCode || '',
          templateId: state.templateId || undefined,
          // templateMapping: state.templateMapping || undefined,
          // targetClassId: state.targetClassId || undefined,
        },
      };

      await CRUDDynamicQuestions.saveDynamicQuestion(
        dynamicQuestion,
        questionId
      );
      setSaveSuccess(true);
      // Refresh examples list to show the new example
      setExamplesRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error saving dynamic question example:', err);
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save example question'
      );
      throw err; // Re-throw so dialog can handle it
    } finally {
      setSavingExample(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <DynamicQuestionExamples
            onSelectExample={handleLoadExample}
            refreshTrigger={examplesRefreshTrigger}
            templateId={templateId}
            isAdmin={isAdmin}
            onEditExample={(example) => {
              handleLoadExample(example);
              setSaveDialogOpen(true);
            }}
          />
        </Box>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={!state.question || !state.question.trim()}
            sx={{
              borderColor: '#e86161',
              color: '#e86161',
              '&:hover': {
                borderColor: '#d45555',
                backgroundColor: 'rgba(232, 97, 97, 0.04)',
              },
              '&:disabled': {
                borderColor: 'rgba(0, 0, 0, 0.26)',
                color: 'rgba(0, 0, 0, 0.26)',
              },
              whiteSpace: 'nowrap',
              minWidth: 'auto',
            }}
            title={
              !state.question || !state.question.trim()
                ? 'Enter a question to save as an example'
                : 'Save current question as an example for other users'
            }
          >
            Save as Example
          </Button>
        )}
      </Box>
      <QueryExecutionSection
        question={state.question}
        sparqlQuery={state.sparqlQuery}
        sparqlTranslation={state.sparqlTranslation}
        loading={loading}
        queryResults={state.queryResults}
        queryError={error}
        onQuestionChange={updateQuestion}
        onSparqlChange={updateSparqlQuery}
        onGenerateAndRun={handleGenerateAndRun}
        onRunEditedQuery={handleRunEditedQuery}
        onOpenHistory={handleOpenHistory}
        onOpenLlmContextHistory={handleOpenLlmContextHistory}
        onClearAll={handleClearAll}
        currentTemplateId={state.templateId}
        onTemplateIdChange={handleTemplateChange}
        iterationFeedback={currentIteration > 0 ? iterationFeedback : undefined}
        currentIteration={currentIteration}
        maxIterations={maxIterations}
        iterationHistory={iterationHistory}
        templateMapping={state.templateMapping as PredicatesMapping | undefined}
        targetClassId={state.targetClassId}
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
        costs={state.costs}
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

      <SaveDynamicQuestionDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveExample}
        defaultName={state.question ? state.question.substring(0, 50) : ''}
        loading={savingExample}
      />

      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSaveSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Example question saved successfully!
        </Alert>
      </Snackbar>

      {saveError && (
        <Snackbar
          open={!!saveError}
          autoHideDuration={6000}
          onClose={() => setSaveError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSaveError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {saveError}
          </Alert>
        </Snackbar>
      )}

      {/* Undo Clear Snackbar */}
      <Snackbar
        open={showUndoSnackbar}
        autoHideDuration={8000}
        onClose={() => {
          setShowUndoSnackbar(false);
          setPreviousState(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Undo />}
              onClick={handleUndo}
              sx={{ fontWeight: 600 }}
            >
              Undo
            </Button>
          }
        >
          All fields cleared
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DynamicAIQuestion;

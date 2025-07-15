import React, { useState, useEffect } from 'react';
import { Box, Divider, Typography, Paper, Button } from '@mui/material';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformationView from './QuestionInformationView';
import SectionSelector from './SectionSelector';
import TextSkeleton from './AI/TextSkeleton';
import HTMLRenderer from './AI/HTMLRenderer';
import AIContentGenerator from './AI/AIContentGenerator';
import SPARQLQuerySection from './AI/SPARQLQuerySection';
import {
  HistoryManager,
  HistoryItem,
  useHistoryManager,
} from './AI/HistoryManager';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import { useAIService } from '../services/aiService';
import AIConfigurationButton from './AI/AIConfigurationButton';
import promptTemplate from '../prompts/GENERATE_SPARQL.txt?raw';

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
  const [question, setQuestion] = useState<string>('');
  const [generatedSparql, setGeneratedSparql] = useState<string>('');
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicQuery, setDynamicQuery] = useState<DynamicQuery | null>(null);

  // AI-generated content states
  const [chartHtml, setChartHtml] = useState<string>('');
  const [questionInterpretation, setQuestionInterpretation] =
    useState<string>('');
  const [dataCollectionInterpretation, setDataCollectionInterpretation] =
    useState<string>('');
  const [dataAnalysisInterpretation, setDataAnalysisInterpretation] =
    useState<string>('');

  // History management
  const { addToHistory } = useHistoryManager();

  const { setContext } = useAIAssistantContext();

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (dynamicQuery && !loading && !error && queryResults.length > 0) {
      setContext(dynamicQuery, queryResults);
    }
  }, [dynamicQuery, queryResults, loading, error, setContext]);

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
    setChartHtml('');
    setQuestionInterpretation('');
    setDataCollectionInterpretation('');
    setDataAnalysisInterpretation('');

    try {
      const data = await fetchSPARQLData(queryToRun);
      setQueryResults(data);

      // Create dynamic query object for charts and AI assistant
      const newDynamicQuery: DynamicQuery = {
        title: `Dynamic Query: ${question}`,
        id: Date.now(),
        uid: 'dynamic-query',
        dataAnalysisInformation: {
          question: question,
          questionExplanation:
            questionInterpretation ||
            `This is a dynamically generated query based on the user's question: "${question}". The query was generated using AI and executed against the ORKG database.`,
          requiredDataForAnalysis:
            dataCollectionInterpretation ||
            `The query requires data from the ORKG database to answer: "${question}". The SPARQL query extracts relevant information based on the research question.`,
          dataAnalysis:
            dataAnalysisInterpretation ||
            `The data is analyzed to provide insights related to: "${question}". The results show patterns and trends in the Requirements Engineering research domain.`,
          dataInterpretation: `The results should be interpreted in the context of Requirements Engineering research, specifically addressing: "${question}".`,
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
        errorMessage = err.message;
      }
      setError(errorMessage);
      setQueryResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndRun = async () => {
    if (!question.trim()) {
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
    setGeneratedSparql('');
    setQueryResults([]);
    setDynamicQuery(null);

    try {
      const fullPrompt = promptTemplate.replace(
        '[Research Question]',
        question
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

      setGeneratedSparql(sparqlQuery);

      // Add to history
      addToHistory('query', question, `Research Question: ${question}`);
      addToHistory('sparql', sparqlQuery, `SPARQL Query for: ${question}`);

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
    if (!generatedSparql.trim()) {
      setError('The query is empty.');
      return;
    }

    // Add edited query to history
    addToHistory('sparql', generatedSparql, `Edited SPARQL Query: ${question}`);

    handleRunQuery(generatedSparql);
  };

  const handleContentGenerated = (
    chartHtmlContent: string,
    chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string
  ) => {
    console.log('chartHtmlContent', chartHtmlContent);
    setChartHtml(chartHtmlContent);
    setQuestionInterpretation(questionInterpretationContent);
    setDataCollectionInterpretation(dataCollectionInterpretationContent);
    setDataAnalysisInterpretation(dataAnalysisInterpretationContent);

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
        setQuestion(item.content);
        break;
      case 'sparql':
        setGeneratedSparql(item.content);
        break;
      case 'chart_html':
        setChartHtml(item.content);
        break;
      case 'question_interpretation':
        setQuestionInterpretation(item.content);
        break;
      case 'data_collection_interpretation':
        setDataCollectionInterpretation(item.content);
        break;
      case 'data_analysis_interpretation':
        setDataAnalysisInterpretation(item.content);
        break;
      case 'data_interpretation':
        // Legacy support - apply to question interpretation
        setQuestionInterpretation(item.content);
        break;
    }
  };

  // History dialog state
  const [historyType, setHistoryType] = useState<HistoryItem['type'] | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const handleOpenHistory = (type: HistoryItem['type']) => {
    setHistoryType(type);
    setHistoryOpen(true);
  };
  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setHistoryType(null);
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
      {/* AI Configuration and SPARQL Query Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AIConfigurationButton />
        <Typography variant="body2" color="text.secondary">
          Configure AI settings to use OpenAI or Groq models
        </Typography>
      </Box>

      <SPARQLQuerySection
        question={question}
        sparqlQuery={generatedSparql}
        loading={loading}
        onQuestionChange={setQuestion}
        onSparqlChange={setGeneratedSparql}
        onGenerateAndRun={handleGenerateAndRun}
        onRunEditedQuery={handleRunEditedQuery}
        onOpenHistory={handleOpenHistory}
      />

      {/* Loading and Error States */}
      {loading && !generatedSparql && <TextSkeleton lines={12} />}
      {error && renderErrorState(error)}

      {/* AI Content Generation */}
      {queryResults.length > 0 && question && (
        <AIContentGenerator
          data={queryResults}
          question={question}
          onContentGenerated={handleContentGenerated}
          onAddToHistory={addToHistory}
          onError={setError}
        />
      )}

      {/* Results Section */}
      {dynamicQuery && queryResults.length > 0 && (
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
          <QuestionInformationView query={dynamicQuery} />

          {/* AI-Generated Chart (HTML/JS, iframe) */}
          {chartHtml && (
            <>
              <Divider sx={{ my: 3 }} />
              <HTMLRenderer
                html={chartHtml}
                title="AI-Generated Chart"
                type="chart"
                useIframe={true}
                onHistoryClick={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Chart HTML History
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenHistory('chart_html')}
                      sx={{
                        borderColor: '#e86161',
                        color: '#e86161',
                        '&:hover': {
                          borderColor: '#d45151',
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      History
                    </Button>
                  </Box>
                }
              />
            </>
          )}
        </Paper>
      )}

      {/* History Manager Dialog */}
      <HistoryManager
        onApplyHistoryItem={handleApplyHistoryItem}
        open={historyOpen}
        type={historyType}
        onClose={handleCloseHistory}
      />
    </Box>
  );
};

export default DynamicAIQuestion;

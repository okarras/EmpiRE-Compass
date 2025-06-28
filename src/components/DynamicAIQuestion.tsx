import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionDataGridView from './QuestionDataGridView';
import TextSkeleton from './AI/TextSkeleton';
import promptTemplate from '../prompts/GENERATE_SPARQL.txt?raw';

const DynamicAIQuestion: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [generatedSparql, setGeneratedSparql] = useState<string>('');
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

  const handleRunQuery = async (queryToRun: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSPARQLData(queryToRun);
      setQueryResults(data);
    } catch (err: unknown) {
      console.error('An error occurred during query execution:', err);
      let errorMessage =
        'An unexpected error occurred while running the query.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setQueryResults([]); // Clear previous results on error
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndRun = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedSparql('');
    setQueryResults([]);

    try {
      const fullPrompt = promptTemplate.replace(
        '[Research Question]',
        question
      );
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const generatedText = response.text();
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
    handleRunQuery(generatedSparql);
  };

  const renderErrorState = (errorMessage: string) => (
    <Paper
      elevation={0}
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
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Your Research Question"
            placeholder="e.g., How many papers were published each year?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                '&:hover > fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused > fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'primary.main',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleGenerateAndRun}
              disabled={loading}
              startIcon={
                loading && !generatedSparql ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading && !generatedSparql
                ? 'Generating...'
                : 'Generate and Run Query'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading && !generatedSparql && <TextSkeleton lines={12} />}
      {error && renderErrorState(error)}
      {generatedSparql && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography variant="h5" gutterBottom>
            SPARQL Query
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            variant="outlined"
            value={generatedSparql}
            onChange={(e) => setGeneratedSparql(e.target.value)}
            disabled={loading}
            sx={{
              mt: 2,
              mb: 2,
              fontFamily: 'monospace',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                '& textarea': {
                  fontFamily: 'monospace',
                },
              },
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleRunEditedQuery}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} color="inherit" /> : null
              }
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading ? 'Running...' : 'Run Edited Query'}
            </Button>
          </Box>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" gutterBottom>
            Query Results
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: 'primary.main' }} />
            </Box>
          ) : queryResults.length > 0 ? (
            <QuestionDataGridView questionData={queryResults} />
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              The query returned no results.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default DynamicAIQuestion;

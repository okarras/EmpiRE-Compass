import React from 'react';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import { History } from '@mui/icons-material';
import AIConfigurationButton from './AIConfigurationButton';
import DynamicQuestionManager from './DynamicQuestionManager';
import SPARQLQuerySection from './SPARQLQuerySection';
import { HistoryItem } from './HistoryManager';

interface QueryExecutionSectionProps {
  question: string;
  sparqlQuery: string;
  sparqlTranslation: string;
  loading: boolean;
  queryResults: Record<string, unknown>[];
  queryError: string | null;
  onQuestionChange: (question: string) => void;
  onSparqlChange: (sparql: string) => void;
  onSparqlTranslationChange: (translation: string) => void;
  onGenerateAndRun: () => void;
  onRunEditedQuery: () => void;
  onOpenHistory: (type: HistoryItem['type']) => void;
  onOpenLlmContextHistory: () => void;
}

const QueryExecutionSection: React.FC<QueryExecutionSectionProps> = ({
  question,
  sparqlQuery,
  sparqlTranslation,
  loading,
  queryResults,
  queryError,
  onQuestionChange,
  onSparqlChange,
  onSparqlTranslationChange,
  onGenerateAndRun,
  onRunEditedQuery,
  onOpenHistory,
  onOpenLlmContextHistory,
}) => {
  return (
    <>
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
              onClick={onOpenLlmContextHistory}
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
        question={question}
        sparqlQuery={sparqlQuery}
        sparqlTranslation={sparqlTranslation}
        loading={loading}
        queryResults={queryResults}
        queryError={queryError}
        onQuestionChange={onQuestionChange}
        onSparqlChange={onSparqlChange}
        onSparqlTranslationChange={onSparqlTranslationChange}
        onGenerateAndRun={onGenerateAndRun}
        onRunEditedQuery={onRunEditedQuery}
        onOpenHistory={onOpenHistory}
      />
    </>
  );
};

export default QueryExecutionSection;

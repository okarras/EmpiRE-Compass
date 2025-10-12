import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import { History, AutoFixHigh } from '@mui/icons-material';
import AIConfigurationButton from './AIConfigurationButton';
import DynamicQuestionManager from './DynamicQuestionManager';
import SPARQLQuerySection from './SPARQLQuerySection';
import ResourceIdInputButton from './ResourceIdInputButton';
import { HistoryItem } from './HistoryManager';

interface QueryExecutionSectionProps {
  question: string;
  sparqlQuery: string;
  loading: boolean;
  queryResults: Record<string, unknown>[];
  queryError: string | null;
  onQuestionChange: (question: string) => void;
  onSparqlChange: (sparql: string) => void;
  onGenerateAndRun: () => void;
  onRunEditedQuery: () => void;
  onOpenHistory: (type: HistoryItem['type']) => void;
  onOpenLlmContextHistory: () => void;
  currentTemplateId?: string | null;
  onTemplateIdChange?: (templateId: string) => void;
  iterationFeedback?: string;
  currentIteration?: number;
  maxIterations?: number;
}

const QueryExecutionSection: React.FC<QueryExecutionSectionProps> = ({
  question,
  sparqlQuery,
  loading,
  queryResults,
  queryError,
  onQuestionChange,
  onSparqlChange,
  onGenerateAndRun,
  onRunEditedQuery,
  onOpenHistory,
  onOpenLlmContextHistory,
  currentTemplateId,
  onTemplateIdChange,
  iterationFeedback,
  currentIteration,
  maxIterations,
}) => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AIConfigurationButton />
        {onTemplateIdChange && (
          <ResourceIdInputButton
            currentTemplateId={currentTemplateId || null}
            onTemplateIdChange={onTemplateIdChange}
          />
        )}
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

      {/* Iteration Feedback Alert */}
      {iterationFeedback && currentIteration && maxIterations && (
        <Alert
          severity="info"
          icon={<AutoFixHigh />}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(232, 97, 97, 0.08)',
            borderLeft: '4px solid #e86161',
            '& .MuiAlert-icon': {
              color: '#e86161',
            },
          }}
        >
          <Box>
            <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
              AI Query Refinement in Progress
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {iterationFeedback}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(currentIteration / maxIterations) * 100}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(232, 97, 97, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#e86161',
                    borderRadius: 4,
                  },
                }}
              />
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{ minWidth: 60, textAlign: 'right' }}
              >
                {currentIteration}/{maxIterations}
              </Typography>
            </Box>
          </Box>
        </Alert>
      )}

      <SPARQLQuerySection
        question={question}
        sparqlQuery={sparqlQuery}
        loading={loading}
        queryResults={queryResults}
        queryError={queryError}
        onQuestionChange={onQuestionChange}
        onSparqlChange={onSparqlChange}
        onGenerateAndRun={onGenerateAndRun}
        onRunEditedQuery={onRunEditedQuery}
        onOpenHistory={onOpenHistory}
      />
    </>
  );
};

export default QueryExecutionSection;

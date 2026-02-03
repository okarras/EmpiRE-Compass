import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  History,
  AutoFixHigh,
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Visibility,
  VisibilityOff,
  Clear,
  Save,
  Groups3 as Groups3Icon,
} from '@mui/icons-material';
import AIConfigurationButton from './AIConfigurationButton';
import DynamicQuestionManager from './DynamicQuestionManager';
import SPARQLQuerySection from './SPARQLQuerySection';
import ResourceIdInputButton from './ResourceIdInputButton';
import { HistoryItem } from './HistoryManager';
import { IterationDetail } from '../../hooks/useQueryGeneration';
import { PredicatesMapping } from '../Graph/types';

interface QueryExecutionSectionProps {
  question: string;
  sparqlQuery: string;
  sparqlTranslation: string;
  loading: boolean;
  queryResults: Record<string, unknown>[];
  queryError: string | null;
  onQuestionChange: (question: string) => void;
  onSparqlChange: (sparql: string) => void;
  onGenerateAndRun: () => void;
  onRunEditedQuery: (query?: string) => void;
  onOpenHistory: (type: HistoryItem['type']) => void;
  onOpenLlmContextHistory: () => void;
  onClearAll?: () => void;
  currentTemplateId?: string | null;
  onTemplateIdChange?: (templateId: string) => void | Promise<void>;
  iterationFeedback?: string;
  currentIteration?: number;
  maxIterations?: number;
  iterationHistory?: IterationDetail[];
  templateMapping?: PredicatesMapping;
  targetClassId?: string | null;
  onSave?: () => void;
  onShare?: () => void;
  isAdmin?: boolean;
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
  onGenerateAndRun,
  onRunEditedQuery,
  onOpenHistory,
  onOpenLlmContextHistory,
  onClearAll,
  currentTemplateId,
  onTemplateIdChange,
  iterationFeedback,
  currentIteration,
  maxIterations,
  iterationHistory = [],
  templateMapping,
  targetClassId,
  onSave,
  onShare,
  isAdmin,
}) => {
  const [expandedIteration, setExpandedIteration] = useState<number | false>(
    false
  );
  const [showIterationHistory, setShowIterationHistory] = useState(true);

  const handleIterationExpand =
    (iteration: number) =>
    (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedIteration(isExpanded ? iteration : false);
    };

  const handleToggleIterationHistory = () => {
    setShowIterationHistory(!showIterationHistory);
  };

  const getIterationIcon = (detail: IterationDetail) => {
    if (detail.executionError) {
      return <ErrorIcon sx={{ color: '#d32f2f' }} />;
    } else if (detail.resultCount === 0) {
      return <Warning sx={{ color: '#ed6c02' }} />;
    } else {
      return <CheckCircle sx={{ color: '#2e7d32' }} />;
    }
  };

  const getIterationStatus = (detail: IterationDetail) => {
    if (detail.executionError) {
      return { label: 'Error', color: 'error' as const };
    } else if (detail.resultCount === 0) {
      return { label: 'No Results', color: 'warning' as const };
    } else {
      return {
        label: `${detail.resultCount} Results`,
        color: 'success' as const,
      };
    }
  };
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
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
          {onShare && (
            <Button
              variant="contained"
              startIcon={<Groups3Icon />}
              onClick={onShare}
              size="small"
              disabled={!question || !question.trim()}
              sx={{
                backgroundColor: '#e86161',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 8px 0 rgba(232, 97, 97, 0.39)',
                '&:hover': {
                  backgroundColor: '#d45151',
                  boxShadow: '0 4px 12px 0 rgba(232, 97, 97, 0.23)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)',
                  boxShadow: 'none',
                },
                whiteSpace: 'nowrap',
              }}
            >
              Publish in Community
            </Button>
          )}
          {isAdmin && onSave && (
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={onSave}
              size="small"
              disabled={!question || !question.trim()}
              sx={{
                borderColor: '#e86161',
                color: '#e86161',
                textTransform: 'none',
                fontWeight: 600,
                borderWidth: '1px',
                '&:hover': {
                  borderColor: '#d45555',
                  backgroundColor: 'rgba(232, 97, 97, 0.04)',
                  borderWidth: '1px',
                },
                '&:disabled': {
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)',
                  borderWidth: '1px',
                },
                whiteSpace: 'nowrap',
              }}
            >
              Save Example
            </Button>
          )}
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
                  borderColor: '#e86161',
                  backgroundColor: 'rgba(232, 97, 97, 0.04)',
                },
              }}
            >
              LLM Context History
            </Button>
          </Tooltip>
          {onClearAll && (
            <Tooltip title="Clear all fields">
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={onClearAll}
                size="small"
                sx={{
                  ml: 1,
                  borderColor: '#e86161',
                  color: '#e86161',
                  '&:hover': {
                    borderColor: '#e86161',
                    color: '#e86161',
                    backgroundColor: 'rgba(232, 97, 97, 0.04)',
                  },
                }}
              >
                Clear All
              </Button>
            </Tooltip>
          )}
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
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                whiteSpace: 'pre-wrap',
                fontFamily: iterationFeedback?.includes('SPARQL query:')
                  ? 'monospace'
                  : 'inherit',
                fontSize: iterationFeedback?.includes('SPARQL query:')
                  ? '0.85rem'
                  : 'inherit',
              }}
            >
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

      {/* Iteration History - Expandable Details */}
      {iterationHistory.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Iteration History & LLM Analysis
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip
                title={showIterationHistory ? 'Hide History' : 'Show History'}
              >
                <IconButton
                  onClick={handleToggleIterationHistory}
                  size="small"
                  sx={{
                    color: '#e86161',
                    '&:hover': {
                      backgroundColor: 'rgba(232, 97, 97, 0.08)',
                    },
                  }}
                >
                  {showIterationHistory ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {showIterationHistory &&
            iterationHistory.map((detail) => (
              <Accordion
                key={detail.iteration}
                expanded={expandedIteration === detail.iteration}
                onChange={handleIterationExpand(detail.iteration)}
                sx={{
                  mb: 1,
                  border: '1px solid rgba(232, 97, 97, 0.2)',
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    backgroundColor: 'rgba(232, 97, 97, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(232, 97, 97, 0.08)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                      pr: 2,
                    }}
                  >
                    {getIterationIcon(detail)}
                    <Typography variant="body1" fontWeight="bold">
                      Iteration {detail.iteration}
                    </Typography>
                    <Chip
                      label={getIterationStatus(detail).label}
                      color={getIterationStatus(detail).color}
                      size="small"
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 'auto' }}
                    >
                      {detail.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ p: 2 }}>
                    {/* Prompt Sent to LLM */}
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ mb: 1, color: '#e86161' }}
                      >
                        📤 Prompt Sent to LLM:
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                          borderRadius: 1,
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '300px',
                          overflowY: 'auto',
                        }}
                      >
                        {detail.prompt}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* LLM Response */}
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ mb: 1, color: '#e86161' }}
                      >
                        📥 LLM Response:
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                          borderRadius: 1,
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '300px',
                          overflowY: 'auto',
                        }}
                      >
                        {detail.llmResponse}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Generated Query */}
                    {detail.generatedQuery && (
                      <>
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            sx={{ mb: 1, color: '#e86161' }}
                          >
                            🔍 Generated SPARQL Query:
                          </Typography>
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: 'rgba(0, 0, 0, 0.03)',
                              borderRadius: 1,
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '300px',
                              overflowY: 'auto',
                            }}
                          >
                            {detail.generatedQuery}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />
                      </>
                    )}

                    {/* Execution Error */}
                    {detail.executionError && (
                      <>
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            sx={{ mb: 1, color: '#d32f2f' }}
                          >
                            ❌ Execution Error from ORKG:
                          </Typography>
                          <Alert
                            severity="error"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {detail.executionError}
                          </Alert>
                        </Box>

                        <Divider sx={{ my: 2 }} />
                      </>
                    )}

                    {/* Feedback */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ mb: 1, color: '#e86161' }}
                      >
                        💬 Evaluation Feedback:
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: detail.executionError
                            ? 'rgba(211, 47, 47, 0.05)'
                            : 'rgba(46, 125, 50, 0.05)',
                          borderRadius: 1,
                          border: `1px solid ${detail.executionError ? 'rgba(211, 47, 47, 0.2)' : 'rgba(46, 125, 50, 0.2)'}`,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {detail.feedback}
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
        </Box>
      )}

      <SPARQLQuerySection
        question={question}
        sparqlQuery={sparqlQuery}
        sparqlTranslation={sparqlTranslation}
        loading={loading}
        queryResults={queryResults}
        queryError={queryError}
        onQuestionChange={onQuestionChange}
        onSparqlChange={onSparqlChange}
        onGenerateAndRun={onGenerateAndRun}
        onRunEditedQuery={onRunEditedQuery}
        onOpenHistory={onOpenHistory}
        templateMapping={templateMapping}
        templateId={currentTemplateId}
        targetClassId={targetClassId}
      />
    </>
  );
};

export default QueryExecutionSection;

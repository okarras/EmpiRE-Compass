/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Grid,
  Divider,
} from '@mui/material';
import { AutoFixHigh, Info } from '@mui/icons-material';

import { useHistoryManager } from './HistoryManager';
import { useAIService } from '../../services/backendAIService';
import { useDynamicQuestion } from '../../context/DynamicQuestionContext';
import { PREFIXES } from '../../api/SPARQL_QUERIES';
import { PredicatesMapping } from '../Graph/types';
import { getTemplate } from '../../api/get_template_data';
import AiEvaluationWidget from './AiEvaluationWidget';
import { updateTemplate, apiRequest } from '../../services/backendApi';
import { useAuthData } from '../../auth/useAuthData';
import TemplateHierarchyPanel from './TemplateHierarchyPanel';
import { extractOrkgPredicateIds } from '../../utils/sparqlPredicateIds';
import {
  extractClassIds,
  extractResourceIds,
  getPredicateUsageSamples,
  ensurePrefixes,
  resolveClassMetadata,
  KG_EMPIRE_DEFAULT_HTML,
  PredicateDetail,
} from '../../utils/sparqlQueryHelpers';
import {
  DEFAULT_TEMPLATE_ID,
  NLP4RE_TEMPLATE_ID,
  saveTemplateIntroText,
  useTemplateIntroText,
} from '../../utils/sparqlTemplateSync';
import { useSparqlEditorState } from '../../hooks/useSparqlEditorState';
import { usePredicateAlignment } from '../../hooks/usePredicateAlignment';
import SparqlHistoryDialog, { getSparqlHistory } from './SparqlHistoryDialog';
import SparqlEditorPanel from './SparqlEditorPanel';

interface SPARQLQuerySectionProps {
  question: string;
  sparqlQuery: string;
  sparqlTranslation: string;
  loading: boolean;
  queryResults?: Record<string, unknown>[];
  queryError?: string | null;
  onQuestionChange: (question: string) => void;
  onSparqlChange: (sparql: string) => void;
  onGenerateAndRun: () => void;
  onRunEditedQuery: (query?: string) => void;
  onOpenHistory: (type: 'query' | 'sparql') => void;
  templateMapping?: PredicatesMapping;
  templateId?: string | null;
  targetClassId?: string | null;
}

interface ClassDetail {
  id: string;
  label: string;
  viaPredicates: string[];
  subtemplateId?: string;
  subtemplateLabel?: string;
}

interface ResourceDetail {
  id: string;
  label?: string;
  description?: string;
  type: 'active' | 'template' | 'inline';
  introducedBy?: string;
}

const SPARQLQuerySection: React.FC<SPARQLQuerySectionProps> = ({
  question,
  sparqlQuery,
  sparqlTranslation,
  loading,
  queryResults = [],
  queryError,
  onQuestionChange,
  onSparqlChange,
  onGenerateAndRun,
  onRunEditedQuery,
  onOpenHistory,
  templateMapping: propTemplateMapping,
  templateId: propTemplateId,
  targetClassId: propTargetClassId,
}) => {
  const { renderHistoryButton } = useHistoryManager();
  const aiService = useAIService();
  const { state, getHistoryByType, updateCosts } = useDynamicQuestion();

  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [explanationDialogOpen, setExplanationDialogOpen] = useState(false);
  const [resourceMetadata, setResourceMetadata] = useState<
    Map<string, { label: string; description?: string }>
  >(new Map());
  const [loadingResources, setLoadingResources] = useState<Set<string>>(
    new Set()
  );
  const [predicateMetadata, setPredicateMetadata] = useState<
    Map<string, { label: string; description?: string }>
  >(new Map());
  const [loadingPredicates, setLoadingPredicates] = useState<Set<string>>(
    new Set()
  );

  const [introEditOpen, setIntroEditOpen] = useState(false);
  const [introEditText, setIntroEditText] = useState('');
  const [introSaving, setIntroSaving] = useState(false);
  const [introSaveError, setIntroSaveError] = useState<string | null>(null);

  const { user } = useAuthData();
  const { introCustomText, setIntroCustomText } = useTemplateIntroText(
    propTemplateId ?? state.templateId ?? undefined
  );

  const templateMapping = (propTemplateMapping ??
    state.templateMapping ??
    undefined) as PredicatesMapping | undefined;
  const templateId = propTemplateId ?? state.templateId ?? undefined;
  const targetClassId = propTargetClassId ?? state.targetClassId ?? undefined;

  const clearError = () => setError(null);
  const {
    isEditing,
    editContent,
    setEditContent,
    handleEdit,
    handleSave,
    handleCancel,
  } = useSparqlEditorState(sparqlQuery, onSparqlChange, clearError);

  const { aligningQuestion, handleAlignQuestionWithSchema } =
    usePredicateAlignment({
      question,
      templateMapping,
      templateId,
      targetClassId,
      onQuestionChange,
      setError,
    });

  const sparqlHistoryItems = getSparqlHistory(
    getHistoryByType('sparql'),
    sparqlQuery
  );

  const templateInsights = useMemo(() => {
    const hasTemplateContext =
      !!templateMapping && Object.keys(templateMapping).length > 0;

    if (!sparqlQuery) {
      return {
        predicateDetails: [] as PredicateDetail[],
        classDetails: [] as ClassDetail[],
        resourceDetails: [] as ResourceDetail[],
        hasTemplateContext,
      };
    }

    const predicateIds = Array.from(extractOrkgPredicateIds(sparqlQuery));
    const predicateDetails: PredicateDetail[] = predicateIds.map(
      (predicateId) => {
        const normalizedId = predicateId.toUpperCase();
        const idWithoutP = normalizedId.startsWith('P')
          ? normalizedId.substring(1)
          : normalizedId;
        const idWithP = normalizedId.startsWith('P')
          ? normalizedId
          : `P${normalizedId}`;

        const mapping =
          templateMapping?.[normalizedId] ||
          templateMapping?.[idWithoutP] ||
          templateMapping?.[idWithP] ||
          templateMapping?.[predicateId.toLowerCase()] ||
          templateMapping?.[predicateId];

        const fetchedMeta =
          predicateMetadata.get(normalizedId) ||
          predicateMetadata.get(idWithP) ||
          predicateMetadata.get(idWithoutP);

        const nestedProperties = mapping?.subtemplate_properties
          ? Object.entries(mapping.subtemplate_properties)
              .slice(0, 6)
              .map(([childId, childMapping]) => ({
                id: childId,
                label:
                  childMapping.predicate_label ?? childMapping.label ?? childId,
                classLabel: childMapping.class_label ?? childMapping.label,
              }))
          : [];

        return {
          id: predicateId,
          label:
            mapping?.predicate_label ??
            mapping?.label ??
            fetchedMeta?.label ??
            `Predicate ${predicateId}`,
          description:
            mapping?.description ||
            fetchedMeta?.description ||
            mapping?.predicate_label ||
            mapping?.label ||
            `Predicate ${predicateId} from ORKG`,
          cardinality: mapping?.cardinality ?? 'unknown',
          predicateLabel:
            mapping?.predicate_label ?? mapping?.label ?? fetchedMeta?.label,
          classId: mapping?.class_id,
          classLabel: mapping?.class_label ?? mapping?.label,
          subtemplateId: mapping?.subtemplate_id,
          subtemplateLabel: mapping?.subtemplate_label,
          nestedProperties,
          usageSamples: getPredicateUsageSamples(sparqlQuery, predicateId),
        };
      }
    );

    const orderedClassIds: string[] = [];
    const seenClasses = new Set<string>();
    const pushClass = (value?: string | null) => {
      if (!value) return;
      const normalized = value.toUpperCase();
      if (seenClasses.has(normalized)) return;
      seenClasses.add(normalized);
      orderedClassIds.push(normalized);
    };

    pushClass(targetClassId);
    extractClassIds(sparqlQuery).forEach((classId) => pushClass(classId));

    const classDetails: ClassDetail[] = orderedClassIds.map((classId) => {
      const metadata = resolveClassMetadata(classId, templateMapping);
      return {
        id: classId,
        label: metadata?.label ?? `Class ${classId}`,
        viaPredicates: metadata?.viaPredicates ?? [],
        subtemplateId: metadata?.subtemplateId,
        subtemplateLabel: metadata?.subtemplateLabel,
      };
    });

    const inlineResources = extractResourceIds(sparqlQuery);
    const resourceMap = new Map<string, ResourceDetail>();
    const activeTemplateId = templateId?.toUpperCase();

    if (activeTemplateId) {
      resourceMap.set(activeTemplateId, {
        id: activeTemplateId,
        label: 'Active template',
        type: 'active',
      });
    }

    predicateDetails.forEach((detail) => {
      if (detail.subtemplateId) {
        const resourceId = detail.subtemplateId.toUpperCase();
        if (!resourceMap.has(resourceId)) {
          resourceMap.set(resourceId, {
            id: resourceId,
            label: detail.subtemplateLabel,
            type: 'template',
            introducedBy: detail.id,
          });
        }
      }
    });

    inlineResources.forEach((resourceId) => {
      const normalized = resourceId.toUpperCase();
      if (!resourceMap.has(normalized)) {
        resourceMap.set(normalized, {
          id: normalized,
          type: 'inline',
        });
      }
    });

    const enhancedResourceDetails = Array.from(resourceMap.values()).map(
      (resource) => {
        const metadata = resourceMetadata.get(resource.id);
        return {
          ...resource,
          label: resource.label || metadata?.label,
          description: metadata?.description,
        };
      }
    );

    return {
      predicateDetails,
      classDetails,
      resourceDetails: enhancedResourceDetails,
      hasTemplateContext,
    };
  }, [
    sparqlQuery,
    templateMapping,
    targetClassId,
    templateId,
    resourceMetadata,
    predicateMetadata,
  ]);

  const renderIntroductoryText = () => {
    const activeTemplateId = (templateId || '').toUpperCase();
    const schemaUrl = `/${activeTemplateId || DEFAULT_TEMPLATE_ID}/schema`;

    if (activeTemplateId === NLP4RE_TEMPLATE_ID) {
      return (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: 'rgba(232, 97, 97, 0.04)',
            borderLeft: '4px solid #e86161',
          }}
        >
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            You can ask factual, comparative, and exploratory questions about
            empirical research practice in <strong>NLP4RE</strong>, grounded in
            the underlying{' '}
            <a href={schemaUrl} target="_blank" rel="noopener noreferrer">
              schema
            </a>
            .
          </Typography>
          <Typography variant="body2">
            Main topics you can query include: <strong>RE task</strong> (which
            RE task a study addresses), <strong>NLP task</strong> (task type,
            input/output formats, labels and extraction elements),{' '}
            <strong>NLP dataset</strong> (size, source type, domain, abstraction
            level, language, license, URLs), <strong>annotation process</strong>{' '}
            (annotators, guidelines, assignment strategy, agreement metrics),{' '}
            <strong>implemented approach</strong> (algorithms, runtime
            requirements, documentation, license, release details), and{' '}
            <strong>evaluation</strong> (metrics, validation procedures, and
            baselines).
          </Typography>
        </Alert>
      );
    }

    const activeSchemaUrl = `/${activeTemplateId || DEFAULT_TEMPLATE_ID}/schema`;
    const rawHtml = (introCustomText || KG_EMPIRE_DEFAULT_HTML).replace(
      '{schemaUrl}',
      activeSchemaUrl
    );

    const isAdmin = user?.is_admin === true;

    if (introEditOpen && isAdmin) {
      return (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={introEditText}
            onChange={(e) => {
              setIntroEditText(e.target.value);
              setIntroSaveError(null);
            }}
            disabled={introSaving}
            autoFocus
            variant="outlined"
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused > fieldset': { borderColor: '#e86161' },
              },
            }}
          />
          {introSaveError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {introSaveError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={() => {
                setIntroEditOpen(false);
                setIntroSaveError(null);
              }}
              disabled={introSaving}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={introSaving || !introEditText.trim()}
              startIcon={
                introSaving ? (
                  <CircularProgress size={14} color="inherit" />
                ) : null
              }
              onClick={async () => {
                setIntroSaving(true);
                setIntroSaveError(null);
                try {
                  await saveTemplateIntroText(
                    activeTemplateId || DEFAULT_TEMPLATE_ID,
                    introEditText,
                    user?.id || '',
                    user?.email || ''
                  );
                  setIntroCustomText(introEditText.trim());
                  setIntroEditOpen(false);
                } catch (err) {
                  setIntroSaveError(
                    err instanceof Error
                      ? err.message
                      : 'Failed to save. Please try again.'
                  );
                } finally {
                  setIntroSaving(false);
                }
              }}
              sx={{
                backgroundColor: '#e86161',
                '&:hover': { backgroundColor: '#d45151' },
              }}
            >
              {introSaving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{ mb: 2, cursor: isAdmin ? 'text' : 'default' }}
        onClick={() => {
          if (!isAdmin) return;
          setIntroEditText(introCustomText || KG_EMPIRE_DEFAULT_HTML);
          setIntroEditOpen(true);
        }}
      >
        <Alert
          severity="info"
          sx={{
            backgroundColor: 'rgba(232, 97, 97, 0.04)',
            borderLeft: '4px solid #e86161',
            cursor: isAdmin ? 'text' : 'default',
            ...(isAdmin && {
              '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.08)' },
              transition: 'background-color 0.2s',
            }),
          }}
        >
          <Box
            dangerouslySetInnerHTML={{ __html: rawHtml }}
            sx={{
              '& p': { margin: 0, mb: 0.5, '&:last-child': { mb: 0 } },
              '& strong': { fontWeight: 600 },
              '& a': {
                color: 'inherit',
                pointerEvents: isAdmin ? 'none' : 'auto',
              },
            }}
          />
          {isAdmin && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block', opacity: 0.6 }}
            >
              Click to edit
            </Typography>
          )}
        </Alert>
      </Box>
    );
  };

  React.useEffect(() => {
    const fetchPredicateMetadata = async () => {
      if (!sparqlQuery || !templateInsights.predicateDetails.length) return;

      const missingPredicates = templateInsights.predicateDetails
        .filter((p) => {
          const normalizedId = p.id.toUpperCase();
          const idWithoutP = normalizedId.startsWith('P')
            ? normalizedId.substring(1)
            : normalizedId;
          const idWithP = normalizedId.startsWith('P')
            ? normalizedId
            : `P${normalizedId}`;

          const hasMapping =
            templateMapping?.[normalizedId] ||
            templateMapping?.[idWithoutP] ||
            templateMapping?.[idWithP] ||
            templateMapping?.[p.id.toLowerCase()] ||
            templateMapping?.[p.id];

          return (
            !hasMapping &&
            !predicateMetadata.has(normalizedId) &&
            !predicateMetadata.has(idWithP) &&
            !predicateMetadata.has(idWithoutP)
          );
        })
        .map((p) => p.id.toUpperCase());

      if (missingPredicates.length === 0) return;

      const newMetadata = new Map(predicateMetadata);
      const loadingSet = new Set(loadingPredicates);

      for (const predicateId of missingPredicates) {
        if (loadingSet.has(predicateId)) continue;
        loadingSet.add(predicateId);
        setLoadingPredicates(new Set(loadingSet));

        try {
          const query = `
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?label ?description WHERE {
  orkgp:${predicateId} rdfs:label ?label .
  OPTIONAL { orkgp:${predicateId} rdfs:comment ?description . }
}
LIMIT 1`;

          const response = await fetch('https://orkg.org/triplestore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/sparql-results+json',
            },
            body: new URLSearchParams({ query }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.results?.bindings?.length > 0) {
              const binding = data.results.bindings[0];
              newMetadata.set(predicateId, {
                label: binding.label?.value || `Predicate ${predicateId}`,
                description: binding.description?.value,
              });
            } else {
              try {
                const propResponse = await fetch(
                  `https://orkg.org/api/properties/${predicateId}`,
                  {
                    headers: { Accept: 'application/json' },
                  }
                );
                if (propResponse.ok) {
                  const propData = await propResponse.json();
                  newMetadata.set(predicateId, {
                    label: propData.label || `Predicate ${predicateId}`,
                    description: propData.description,
                  });
                }
              } catch {
                // Ignore API fetch errors
              }
            }
          }
        } catch (err) {
          console.warn(
            `Failed to fetch metadata for predicate ${predicateId}:`,
            err
          );
        } finally {
          loadingSet.delete(predicateId);
          setLoadingPredicates(new Set(loadingSet));
        }
      }

      if (newMetadata.size > predicateMetadata.size) {
        setPredicateMetadata(newMetadata);
      }
    };

    if (sparqlQuery && templateInsights.predicateDetails.length > 0) {
      fetchPredicateMetadata();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparqlQuery, templateInsights.predicateDetails.length, templateMapping]);

  React.useEffect(() => {
    const fetchMissingMetadata = async () => {
      const resourceIds = templateInsights.resourceDetails
        .filter((r) => !r.label && r.id.startsWith('R'))
        .map((r) => r.id);

      if (resourceIds.length === 0) return;

      const newMetadata = new Map(resourceMetadata);
      const loadingSet = new Set(loadingResources);

      for (const resourceId of resourceIds) {
        if (loadingSet.has(resourceId) || newMetadata.has(resourceId)) continue;
        loadingSet.add(resourceId);
        setLoadingResources(new Set(loadingSet));

        try {
          const template = await getTemplate(resourceId);
          newMetadata.set(resourceId, {
            label: template.label,
            description: template.description,
          });
        } catch (err) {
          console.warn(`Failed to fetch metadata for ${resourceId}:`, err);
          newMetadata.set(resourceId, {
            label: `Resource ${resourceId}`,
          });
        } finally {
          loadingSet.delete(resourceId);
          setLoadingResources(new Set(loadingSet));
        }
      }

      if (newMetadata.size > resourceMetadata.size) {
        setResourceMetadata(newMetadata);
      }
    };

    if (sparqlQuery && templateInsights.resourceDetails.length > 0) {
      fetchMissingMetadata();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparqlQuery, templateInsights.resourceDetails.length]);

  const handleOpenInORKG = () => {
    const queryWithPrefixes = ensurePrefixes(sparqlQuery, PREFIXES);
    const url = `https://orkg.org/sparql#${encodeURIComponent(queryWithPrefixes)}`;
    window.open(url, '_blank');
  };

  const handleAIModify = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for the AI.');
      return;
    }

    if (!aiService.isConfigured()) {
      setError('Please configure your AI settings first.');
      return;
    }

    setIsAIModifying(true);
    setError(null);

    try {
      const history = getHistoryByType('sparql');
      const recentHistory = history.slice(-5);

      const contextPrompt = `You are modifying a SPARQL query for a dynamic research question analysis. 

Current Research Question: "${state.question}"

Current Data: ${JSON.stringify(state.queryResults, null, 2)}

Current SPARQL Query:
${sparqlQuery}

Recent History:
${recentHistory
  .map(
    //TODO: fix this
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    (entry: { action: any; timestamp: string | number | Date; prompt: any }) =>
      `${entry.action} (${new Date(entry.timestamp).toLocaleString()}): ${entry.prompt || 'Manual edit'}`
  )
  .join('\n')}

User Request: ${aiPrompt}

Please modify the SPARQL query according to the user's request. Consider the context and history provided.

Requirements:
- Return only the SPARQL query, no explanations
- Ensure the query is valid SPARQL syntax
- Maintain the same data structure and prefixes

Modified SPARQL Query:`;

      const result = await aiService.generateText(contextPrompt, {
        temperature: 0.3,
        maxTokens: 2000,
      });

      let modifiedQuery = result.text.trim();

      modifiedQuery = modifiedQuery
        .replace(/```sparql\s*/gi, '')
        .replace(/```\s*$/gm, '')
        .replace(/^```.*$/gm, '')
        .trim();

      onSparqlChange(modifiedQuery);

      if (result.cost) {
        const costWithSection = {
          ...result.cost,
          section: 'AI Modification - SPARQL Query',
        };
        updateCosts([...state.costs, costWithSection]);
      }

      setShowAIDialog(false);
      setAiPrompt('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to modify query with AI'
      );
    } finally {
      setIsAIModifying(false);
    }
  };

  return (
    <>
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
          {renderIntroductoryText()}
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-expect-error */}
          {renderHistoryButton('query', 'Question History', onOpenHistory)}
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Your Research Question"
            placeholder="e.g., How many papers were published each year?"
            value={question}
            onKeyDown={(e) => {
              if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                onGenerateAndRun();
              }
            }}
            onChange={(e) => onQuestionChange(e.target.value)}
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
          <TemplateHierarchyPanel
            templateMapping={templateMapping}
            sparqlQuery={sparqlQuery}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Tooltip title="Rewrite your question using the template vocabulary and nested paths shown above.">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAlignQuestionWithSchema}
                  disabled={
                    loading ||
                    aligningQuestion ||
                    !templateMapping ||
                    Object.keys(templateMapping).length === 0
                  }
                  startIcon={
                    aligningQuestion ? (
                      <CircularProgress size={16} />
                    ) : (
                      <AutoFixHigh />
                    )
                  }
                  sx={{ textTransform: 'none' }}
                >
                  Align question with schema
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              onClick={onGenerateAndRun}
              disabled={loading}
              startIcon={
                loading && !sparqlQuery ? (
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
              {loading && !sparqlQuery
                ? 'Generating...'
                : 'Generate and Run Query'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={explanationDialogOpen}
        onClose={() => setExplanationDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info sx={{ color: '#e86161' }} />
            <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 600 }}>
              Query Explanation
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {sparqlQuery && (
            <>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {templateInsights.predicateDetails.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Chip
                          label={templateInsights.predicateDetails.length}
                          size="small"
                          sx={{
                            backgroundColor: '#e86161',
                            color: 'white',
                            fontWeight: 600,
                            height: '20px',
                            fontSize: '0.7rem',
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                        >
                          Predicates
                        </Typography>
                      </Stack>
                      <Stack spacing={0.75}>
                        {templateInsights.predicateDetails.map((predicate) => (
                          <Box
                            key={predicate.id}
                            sx={{
                              p: 0.75,
                              borderRadius: 1,
                              backgroundColor: 'rgba(248, 249, 250, 0.6)',
                              border: '1px solid rgba(232, 97, 97, 0.1)',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Chip
                                component="a"
                                href={`https://orkg.org/properties/${predicate.id.startsWith('P') ? predicate.id : `P${predicate.id}`}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                label={`orkgp:${predicate.id}`}
                                size="small"
                                clickable
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                }}
                                sx={{
                                  backgroundColor: '#e86161',
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: '20px',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    backgroundColor: '#d45151',
                                    textDecoration: 'none',
                                  },
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                {predicate.label}
                                {loadingPredicates.has(
                                  predicate.id.toUpperCase()
                                ) && <CircularProgress size={10} />}
                              </Typography>
                            </Stack>
                            {predicate.description &&
                              predicate.description !==
                                `Predicate ${predicate.id} from ORKG` && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {predicate.description}
                                </Typography>
                              )}
                            {(predicate.classLabel ||
                              predicate.subtemplateLabel) && (
                              <Stack
                                direction="row"
                                spacing={0.75}
                                flexWrap="wrap"
                                mt={0.5}
                              >
                                {predicate.classLabel && predicate.classId && (
                                  <Chip
                                    label={`Class: ${predicate.classLabel}${predicate.classId ? ` (${predicate.classId})` : ''}`}
                                    component="a"
                                    href={`https://orkg.org/classes/${predicate.classId.startsWith('C') ? predicate.classId : `C${predicate.classId}`}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    clickable
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                    }}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: '18px',
                                      mt: 0.25,
                                    }}
                                  />
                                )}
                                {predicate.subtemplateLabel && (
                                  <Chip
                                    component="a"
                                    href={`https://orkg.org/templates/${predicate.subtemplateId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    clickable
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                    }}
                                    label={`Template: ${predicate.subtemplateLabel}${predicate.subtemplateId ? ` (${predicate.subtemplateId})` : ''}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: '18px',
                                      mt: 0.25,
                                    }}
                                  />
                                )}
                              </Stack>
                            )}
                            {predicate.nestedProperties.length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.7rem',
                                  mt: 0.5,
                                  display: 'block',
                                }}
                              >
                                Nested:{' '}
                                {predicate.nestedProperties
                                  .slice(0, 3)
                                  .map((n) => n.label)
                                  .join(', ')}
                                {predicate.nestedProperties.length > 3 && '...'}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}

                {(templateInsights.classDetails.length > 0 ||
                  templateInsights.resourceDetails.length > 0) && (
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Chip
                          label={
                            templateInsights.classDetails.length +
                            templateInsights.resourceDetails.length
                          }
                          size="small"
                          sx={{
                            backgroundColor: '#e86161',
                            color: 'white',
                            fontWeight: 600,
                            height: '20px',
                            fontSize: '0.7rem',
                          }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                        >
                          Classes & Resources
                        </Typography>
                      </Stack>
                      <Stack spacing={0.75}>
                        {templateInsights.classDetails.map((cls) => (
                          <Box
                            key={cls.id}
                            sx={{
                              p: 0.75,
                              borderRadius: 1,
                              backgroundColor: 'rgba(248, 249, 250, 0.6)',
                              border: '1px dashed rgba(232, 97, 97, 0.15)',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Chip
                                component="a"
                                href={
                                  cls.id.startsWith('R')
                                    ? `https://orkg.org/resources/${cls.id}`
                                    : `https://orkg.org/classes/${cls.id.startsWith('C') ? cls.id : `C${cls.id}`}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                label={`orkgc:${cls.id}`}
                                size="small"
                                variant="outlined"
                                clickable
                                sx={{
                                  fontSize: '0.7rem',
                                  height: '20px',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    backgroundColor: 'rgba(232, 97, 97, 0.1)',
                                    textDecoration: 'none',
                                  },
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                              >
                                {cls.label}
                              </Typography>
                            </Stack>
                            {cls.viaPredicates.length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.7rem',
                                  mt: 0.5,
                                  display: 'block',
                                }}
                              >
                                via{' '}
                                {cls.viaPredicates
                                  .map((pid) => `orkgp:${pid}`)
                                  .join(' → ')}
                              </Typography>
                            )}
                            {cls.subtemplateLabel && (
                              <Chip
                                label={`Template: ${cls.subtemplateLabel}${cls.subtemplateId ? ` (${cls.subtemplateId})` : ''}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: '18px',
                                  mt: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        ))}
                        {templateInsights.resourceDetails.map((resource) => (
                          <Box
                            key={resource.id}
                            sx={{
                              p: 0.75,
                              borderRadius: 1,
                              backgroundColor: 'rgba(248, 249, 250, 0.6)',
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              flexWrap="wrap"
                            >
                              <Chip
                                component="a"
                                href={`https://orkg.org/resources/${resource.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                label={resource.id}
                                size="small"
                                clickable
                                sx={{
                                  backgroundColor:
                                    resource.type === 'active'
                                      ? '#e86161'
                                      : resource.type === 'template'
                                        ? '#4CAF50'
                                        : '#757575',
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: '20px',
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                              >
                                {resource.label ||
                                  (loadingResources.has(resource.id)
                                    ? 'Loading...'
                                    : 'Loading metadata...')}
                              </Typography>
                              {loadingResources.has(resource.id) && (
                                <CircularProgress size={12} sx={{ ml: 1 }} />
                              )}
                            </Stack>
                            {resource.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.7rem',
                                  mt: 0.5,
                                  display: 'block',
                                }}
                              >
                                {resource.description}
                              </Typography>
                            )}
                            {resource.introducedBy && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.7rem',
                                  mt: 0.5,
                                  display: 'block',
                                }}
                              >
                                Introduced by orkgp:{resource.introducedBy}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {sparqlTranslation && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      backgroundColor: 'rgba(248, 249, 250, 0.6)',
                      border: '1px solid rgba(232, 97, 97, 0.15)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}
                    >
                      Natural Language Summary:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: 'italic', lineHeight: 1.6 }}
                    >
                      {sparqlTranslation}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExplanationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <SparqlEditorPanel
        sparqlQuery={sparqlQuery}
        loading={loading}
        queryResults={queryResults}
        queryError={queryError}
        isEditing={isEditing}
        editContent={editContent}
        setEditContent={setEditContent}
        onSparqlChange={onSparqlChange}
        onRunEditedQuery={onRunEditedQuery}
        handleEdit={handleEdit}
        handleSave={handleSave}
        handleCancel={handleCancel}
        handleOpenInORKG={handleOpenInORKG}
        onOpenExplanation={() => setExplanationDialogOpen(true)}
        historyCount={sparqlHistoryItems.length}
        onOpenHistory={() => setHistoryDialogOpen(true)}
        error={error}
        showAIDialog={showAIDialog}
        setShowAIDialog={setShowAIDialog}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        isAIModifying={isAIModifying}
        handleAIModify={handleAIModify}
        evaluationWidget={
          <AiEvaluationWidget
            targetType="sparql"
            targetId={question || 'unknown-question'}
          />
        }
      />

      {/* History Dialog */}
      <SparqlHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        historyItems={sparqlHistoryItems}
        onRevert={(item) => onSparqlChange(item.content)}
      />
    </>
  );
};

export default SPARQLQuerySection;

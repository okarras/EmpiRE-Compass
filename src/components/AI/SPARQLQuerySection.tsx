/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import {
  Edit,
  SmartToy,
  Save,
  Cancel,
  History,
  Refresh,
  Restore,
  Close,
  Info,
} from '@mui/icons-material';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';

import { useHistoryManager } from './HistoryManager';
import { useAIService } from '../../services/backendAIService';
import {
  DynamicQuestionHistory,
  useDynamicQuestion,
} from '../../context/DynamicQuestionContext';
import { PREFIXES } from '../../api/SPARQL_QUERIES';
import { CodeEditor } from '../CodeEditor';
import { PredicatesMapping, PropertyMapping } from '../Graph/types';
import { getTemplate } from '../../api/get_template_data';

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

interface PredicateDetail {
  id: string;
  label: string;
  description: string;
  cardinality: string;
  predicateLabel?: string;
  classId?: string;
  classLabel?: string;
  subtemplateId?: string;
  subtemplateLabel?: string;
  nestedProperties: Array<{
    id: string;
    label: string;
    classLabel?: string;
  }>;
  usageSamples: string[];
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

interface ClassMetadata {
  label?: string;
  viaPredicates: string[];
  subtemplateId?: string;
  subtemplateLabel?: string;
}

const extractPredicateIds = (query: string): string[] => {
  const regex = /orkgp:(P\d+)/gi;
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    const id = match[1].toUpperCase();
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

const extractClassIds = (query: string): string[] => {
  const regex = /orkgc:(C\d+)/gi;
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    const id = match[1].toUpperCase();
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

const extractResourceIds = (query: string): string[] => {
  const regex = /orkgr:(R\d+)/gi;
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(query)) !== null) {
    const id = match[1].toUpperCase();
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
};

const getPredicateUsageSamples = (
  query: string,
  predicateId: string,
  maxSamples = 3
): string[] => {
  const lowerId = `orkgp:${predicateId.toLowerCase()}`;
  return query
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().includes(lowerId))
    .slice(0, maxSamples);
};

const walkMappingForClass = (
  mapping: PropertyMapping | undefined,
  predicateChain: string[],
  targetClassId: string
): ClassMetadata | null => {
  if (!mapping) return null;

  if (mapping.class_id === targetClassId) {
    return {
      label: mapping.class_label ?? mapping.label,
      viaPredicates: predicateChain,
      subtemplateId: mapping.subtemplate_id,
      subtemplateLabel: mapping.subtemplate_label,
    };
  }

  if (!mapping.subtemplate_properties) return null;

  for (const [childPredicateId, childMapping] of Object.entries(
    mapping.subtemplate_properties
  )) {
    const childChain = [...predicateChain, childPredicateId];
    const result = walkMappingForClass(childMapping, childChain, targetClassId);
    if (result) return result;
  }

  return null;
};

const resolveClassMetadata = (
  classId: string,
  templateMapping?: PredicatesMapping
): ClassMetadata | null => {
  if (!templateMapping) return null;

  for (const [predicateId, mapping] of Object.entries(templateMapping)) {
    const result = walkMappingForClass(mapping, [predicateId], classId);
    if (result) return result;
  }

  return null;
};

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

  const [isEditing, setIsEditing] = useState(false);
  const [isAIModifying, setIsAIModifying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editContent, setEditContent] = useState(sparqlQuery);
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

  // Use prop templateMapping if provided, otherwise fall back to context
  const templateMapping = (propTemplateMapping ??
    state.templateMapping ??
    undefined) as PredicatesMapping | undefined;
  const templateId = propTemplateId ?? state.templateId ?? undefined;
  const targetClassId = propTargetClassId ?? state.targetClassId ?? undefined;

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

    const predicateIds = extractPredicateIds(sparqlQuery);
    const predicateDetails: PredicateDetail[] = predicateIds.map(
      (predicateId) => {
        // Try to find mapping - check both with and without P prefix, and case variations
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

        // Check fetched metadata
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

    // Enhance resource details with fetched metadata
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

  // Fetch predicate metadata using SPARQL if not in templateMapping
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
          // Fetch predicate metadata using SPARQL
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
              // Fallback: try fetching from ORKG properties API
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

  // Fetch resource metadata for resources that don't have labels
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

  const handleEdit = () => {
    setEditContent(sparqlQuery);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSparqlChange(editContent);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(sparqlQuery);
    setError(null);
  };

  const handleOpenHistory = () => {
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
  };

  const handleRevertHistory = (item: DynamicQuestionHistory) => {
    onSparqlChange(item.content);
    handleCloseHistory();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const getSparqlHistory = () => {
    const allHistory = getHistoryByType('sparql');
    const currentContent = sparqlQuery;

    // Filter history items that are different from current content and not duplicates
    const seenContents = new Set();
    return allHistory
      .filter((item: { content: string }) => {
        // Skip if content is empty, whitespace-only, same as current, or if we've seen this content before
        const trimmedContent = item.content.trim();
        if (
          !trimmedContent ||
          trimmedContent === currentContent.trim() ||
          seenContents.has(trimmedContent)
        ) {
          return false;
        }
        seenContents.add(trimmedContent);
        return true;
      })
      .sort(
        (a: { timestamp: number }, b: { timestamp: number }) =>
          b.timestamp - a.timestamp
      ); // Sort by newest first
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

      // Clean up any markdown code fences that might be in the response
      modifiedQuery = modifiedQuery
        .replace(/```sparql\s*/gi, '')
        .replace(/```\s*$/gm, '')
        .replace(/^```.*$/gm, '')
        .trim();

      onSparqlChange(modifiedQuery);

      // Track cost for AI modification
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
      {/* Question Input Section */}
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* Query Explanation Dialog */}
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
                {/* Predicates Column */}
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
                                {predicate.classLabel && (
                                  <Chip
                                    label={`Class: ${predicate.classLabel}${predicate.classId ? ` (${predicate.classId})` : ''}`}
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

                {/* Classes & Resources Column */}
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
                                href={`https://orkg.org/classes/${cls.id.startsWith('C') ? cls.id : `C${cls.id}`}`}
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
                                label={resource.id}
                                size="small"
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

              {/* Natural Language Translation */}
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

      {/* SPARQL Query Section */}
      {sparqlQuery && (
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5" sx={{ color: '#e86161', fontWeight: 600 }}>
              SPARQL Query
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isEditing ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSave}
                    startIcon={<Save />}
                    sx={{
                      backgroundColor: '#e86161',
                      '&:hover': { backgroundColor: '#d45151' },
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancel}
                    startIcon={<Cancel />}
                  >
                    Cancel
                  </Button>
                  {getSparqlHistory().length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleOpenHistory}
                      startIcon={<History />}
                      sx={{
                        borderColor: '#e86161',
                        color: '#e86161',
                        '&:hover': {
                          borderColor: '#d45151',
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      History ({getSparqlHistory().length})
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  <Button
                    href={`https://orkg.org/sparql#${encodeURIComponent(PREFIXES + sparqlQuery)}`}
                    target="_blank"
                    sx={{
                      color: '#e86161',
                      mt: { xs: 2, sm: 0 },
                      ml: 2,
                      '&:hover': {
                        color: '#b33a3a',
                      },
                    }}
                    variant="outlined"
                  >
                    <LiveHelpIcon sx={{ mr: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Open in ORKG
                    </Typography>
                  </Button>
                  <Tooltip title="Edit manually">
                    <IconButton
                      onClick={handleEdit}
                      size="small"
                      sx={{
                        color: '#e86161',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ask AI to modify">
                    <IconButton
                      onClick={() => setShowAIDialog(true)}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      <SmartToy />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View query explanation">
                    <IconButton
                      onClick={() => setExplanationDialogOpen(true)}
                      size="small"
                      sx={{
                        color: '#e86161',
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.08)',
                        },
                      }}
                    >
                      <Info />
                    </IconButton>
                  </Tooltip>
                  {getSparqlHistory().length > 0 && (
                    <Tooltip
                      title={`View ${getSparqlHistory().length} previous versions`}
                    >
                      <IconButton
                        onClick={handleOpenHistory}
                        size="small"
                        sx={{
                          color: '#e86161',
                          '&:hover': {
                            backgroundColor: 'rgba(232, 97, 97, 0.08)',
                          },
                        }}
                      >
                        <History />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2, mb: 2 }}>
            <CodeEditor
              value={isEditing ? editContent : sparqlQuery}
              onChange={(value) =>
                isEditing ? setEditContent(value) : onSparqlChange(value)
              }
              language="sparql"
              height="400px"
              readOnly={loading || !isEditing}
              label="SPARQL Query"
              copyable={true}
              formattable={!isEditing}
              fullscreenable={true}
              showMinimap={false}
              placeholder={`PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?paper ?title
WHERE {
  ?paper orkgp:P31 ?contribution .
  ?paper rdfs:label ?title .
}
LIMIT 10`}
            />
          </Box>

          {/* Query Results Status */}
          {!loading && sparqlQuery && !queryError && (
            <Box sx={{ mb: 2 }}>
              {queryResults &&
              Array.isArray(queryResults) &&
              queryResults.length > 0 ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ✅ Query executed successfully! Found{' '}
                    <strong>{queryResults.length}</strong> result
                    {queryResults.length !== 1 ? 's' : ''}.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ⚠️ Query executed successfully but returned no results. Try
                    modifying your query or research question.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Query Error */}
          {!loading && queryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                ❌ Query failed: {queryError}
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={() =>
                onRunEditedQuery(isEditing ? editContent : sparqlQuery)
              }
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
              {loading ? 'Running...' : 'Run'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* AI Modification Dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy sx={{ color: '#e86161' }} />
            <Typography variant="h6">AI Query Modification</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe how you want the AI to modify the SPARQL query. The AI will
            have access to the full context of your research question and
            previous changes.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe how you want to modify the SPARQL query..."
            variant="outlined"
            disabled={isAIModifying}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAIDialog(false)}
            disabled={isAIModifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAIModify}
            variant="contained"
            disabled={isAIModifying || !aiPrompt.trim()}
            startIcon={
              isAIModifying ? <CircularProgress size={16} /> : <Refresh />
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            {isAIModifying ? 'Modifying...' : 'Modify with AI'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History sx={{ color: '#e86161' }} />
              <Typography variant="h6">SPARQL Query History</Typography>
            </Box>
            <IconButton onClick={handleCloseHistory} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {getSparqlHistory().length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No SPARQL query history available yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Changes will appear here once you make edits or AI
                modifications.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {getSparqlHistory().map(
                (item: DynamicQuestionHistory, index: number) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        p: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(232, 97, 97, 0.04)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              color="text.primary"
                            >
                              {item.action === 'ai_modified'
                                ? 'AI Modified SPARQL'
                                : 'Manual Edit SPARQL'}
                            </Typography>
                            <Chip
                              label={
                                item.action === 'ai_modified'
                                  ? 'LLM Context'
                                  : 'Manual'
                              }
                              size="small"
                              color={
                                item.action === 'ai_modified'
                                  ? 'primary'
                                  : 'default'
                              }
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(item.timestamp)}
                          </Typography>
                          {item.prompt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              <strong>LLM Prompt:</strong> {item.prompt}
                            </Typography>
                          )}
                          {item.previousContent && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              <strong>Previous Content:</strong>{' '}
                              {item.previousContent.substring(0, 100)}...
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Restore />}
                            onClick={() => handleRevertHistory(item)}
                            sx={{
                              backgroundColor: '#e86161',
                              '&:hover': { backgroundColor: '#d45151' },
                            }}
                          >
                            Restore
                          </Button>
                        </Box>
                      </Box>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 1,
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          maxHeight: '120px',
                          overflowY: 'auto',
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{ margin: 0, whiteSpace: 'pre-wrap' }}
                        >
                          {item.content.length > 200
                            ? `${item.content.substring(0, 200)}...`
                            : item.content}
                        </Typography>
                      </Paper>
                    </ListItem>
                    {index < getSparqlHistory().length - 1 && <Divider />}
                  </React.Fragment>
                )
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SPARQLQuerySection;

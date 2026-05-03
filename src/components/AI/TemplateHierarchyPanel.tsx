import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import { ExpandMore, AccountTree } from '@mui/icons-material';
import { PredicatesMapping, PropertyMapping } from '../Graph/types';
import { extractOrkgPredicateIds } from '../../utils/sparqlPredicateIds';

export interface TemplateHierarchyPanelProps {
  templateMapping?: PredicatesMapping;
  /** When set, predicates referenced here are highlighted as “used in query”. */
  sparqlQuery?: string;
  defaultExpanded?: boolean;
}

const normalizePredicateKey = (id: string): string => {
  const u = id.toUpperCase();
  return u.startsWith('P') ? u : `P${u}`;
};

interface NodeRowProps {
  predicateId: string;
  mapping: PropertyMapping;
  depth: number;
  usedIds: Set<string>;
}

const HierarchyNode: React.FC<NodeRowProps> = ({
  predicateId,
  mapping,
  depth,
  usedIds,
}) => {
  const key = normalizePredicateKey(predicateId);
  const isUsed = usedIds.has(key);
  const label = mapping.predicate_label ?? mapping.label ?? key;
  const sub = mapping.subtemplate_properties;

  return (
    <Box sx={{ pl: depth === 0 ? 0 : 1.5 }}>
      <Box
        sx={{
          py: 0.5,
          px: 1,
          borderRadius: 1,
          borderLeft:
            depth > 0 ? '2px solid rgba(232, 97, 97, 0.35)' : undefined,
          backgroundColor: isUsed
            ? 'rgba(232, 97, 97, 0.12)'
            : 'rgba(0, 0, 0, 0.02)',
          border: isUsed ? '1px solid rgba(232, 97, 97, 0.45)' : undefined,
        }}
      >
        <Typography
          variant="body2"
          component="span"
          sx={{
            fontWeight: isUsed ? 600 : 500,
            fontSize: '0.85rem',
            color: isUsed ? 'text.primary' : 'text.secondary',
          }}
        >
          {depth > 0 ? '└ ' : ''}
          {label}
        </Typography>
        <Typography
          variant="caption"
          component="span"
          sx={{ ml: 1, fontFamily: 'monospace', opacity: 0.85 }}
        >
          orkgp:{key}
        </Typography>
        {isUsed && (
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              color: '#e86161',
              fontWeight: 600,
              fontSize: '0.65rem',
            }}
          >
            in query
          </Typography>
        )}
      </Box>
      {sub &&
        Object.entries(sub).map(([childId, childMapping]) => (
          <HierarchyNode
            key={childId}
            predicateId={childId}
            mapping={childMapping}
            depth={depth + 1}
            usedIds={usedIds}
          />
        ))}
    </Box>
  );
};

/**
 * Full template property tree for the active schema, with nodes highlighted
 * when the current SPARQL references the corresponding `orkgp:P…` predicate.
 */
const TemplateHierarchyPanel: React.FC<TemplateHierarchyPanelProps> = ({
  templateMapping,
  sparqlQuery = '',
  defaultExpanded = false,
}) => {
  const usedIds = useMemo(
    () => extractOrkgPredicateIds(sparqlQuery),
    [sparqlQuery]
  );

  const hasMapping = templateMapping && Object.keys(templateMapping).length > 0;

  if (!hasMapping) {
    return null;
  }

  const usedCount = usedIds.size;

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: 1,
        '&:before': { display: 'none' },
        backgroundColor: 'rgba(248, 249, 250, 0.5)',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{ minHeight: 48, '& .MuiAccordionSummary-content': { my: 1 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTree sx={{ fontSize: 20, color: '#e86161' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Template schema (hierarchy)
          </Typography>
          <Tooltip title="Predicates referenced in the SPARQL below are highlighted. Follow parent → child order when traversing nested data.">
            <Typography variant="caption" color="text.secondary">
              {usedCount > 0
                ? `${usedCount} predicate(s) from your query highlighted`
                : 'Expand to see properties; generate a query to highlight usage'}
            </Typography>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
        {Object.entries(templateMapping!).map(([predicateId, mapping]) => (
          <HierarchyNode
            key={predicateId}
            predicateId={predicateId}
            mapping={mapping}
            depth={0}
            usedIds={usedIds}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default TemplateHierarchyPanel;

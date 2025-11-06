import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import TemplateGraph from '../components/Graph/TemplateGraph';
import { loadTemplateFlowByID } from '../api/get_template_data';

// Interface for the actual API response structure
interface ApiTemplate {
  id: string;
  label: string;
  description: string;
  target_class: {
    _class?: string;
    id: string;
    label: string;
    uri?: string | null;
  };
  properties: Array<{
    id: string;
    description: string | null;
    order: number;
    min_count: number | null;
    max_count: number | null;
    path: {
      id: string;
      label: string;
    };
    class?: {
      id: string;
      label: string;
    };
    datatype?: {
      id: {
        _class?: string;
        id: string;
        label: string;
        uri?: string;
      };
      label: {
        _class?: string;
        id: string;
        label: string;
        uri?: string;
      };
    };
  }>;
}

// Type adapter to convert API Template to Graph Template
interface GraphTemplate {
  id: string;
  label: string;
  description?: string | null;
  target_class: {
    id: string;
    label: string;
  };
  properties?: Array<{
    id: string;
    label: string;
    description?: string | null;
    order?: number;
    min_count: number | null;
    max_count: number | null;
    path: { id: string; label: string };
    class?: { id: string; label: string };
    datatype?: { id: string; label: string };
  }>;
}

const adaptTemplate = (apiTemplate: ApiTemplate): GraphTemplate => ({
  id: apiTemplate.id,
  label: apiTemplate.label,
  description: apiTemplate.description,
  target_class: {
    id: apiTemplate.target_class.id,
    label: apiTemplate.target_class.label,
  },
  properties: apiTemplate.properties?.map((prop) => ({
    id: prop.id || '',
    label: prop.description || prop.path?.label || 'Unnamed Property',
    description: prop.description,
    order: prop.order,
    min_count: prop.min_count || 0,
    max_count: prop.max_count || null,
    path: {
      id: prop.path?.id || '',
      label: prop.path?.label || 'Unknown Path',
    },
    class: prop.class
      ? {
          id: prop.class.id,
          label: prop.class.label,
        }
      : undefined,
    datatype: prop.datatype
      ? {
          id:
            typeof prop.datatype.id === 'object'
              ? prop.datatype.id.id
              : prop.datatype.id || '',
          label:
            typeof prop.datatype.id === 'object'
              ? prop.datatype.id.label
              : (typeof prop.datatype.label === 'object'
                  ? prop.datatype.label.label
                  : prop.datatype.label) || 'Unknown Type',
        }
      : undefined,
  })),
});

const TemplateGraphPage = () => {
  const [templates, setTemplates] = useState<GraphTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load template flow starting from the main empirical research practice template
        const mainTemplateId = 'R186491'; // Empirical Research Practice template ID
        const templateFlow = await loadTemplateFlowByID(
          mainTemplateId,
          new Set()
        );

        // Extract all templates from the flow (including the main template and its neighbors)
        const allTemplates: GraphTemplate[] = [];

        // Add the main template
        if (templateFlow && 'id' in templateFlow && templateFlow.id) {
          allTemplates.push(adaptTemplate(templateFlow as ApiTemplate));
        }

        // Add neighbor templates recursively
        const extractNeighborTemplates = (node: { neighbors?: unknown[] }) => {
          if (node.neighbors && Array.isArray(node.neighbors)) {
            node.neighbors.forEach((neighbor) => {
              if (
                neighbor &&
                typeof neighbor === 'object' &&
                'id' in neighbor &&
                neighbor.id
              ) {
                // Only process actual templates (resources starting with 'R')
                if (
                  typeof neighbor.id === 'string' &&
                  neighbor.id.startsWith('R')
                ) {
                  // Check if we already have this template to avoid duplicates
                  if (!allTemplates.find((t) => t.id === neighbor.id)) {
                    allTemplates.push(adaptTemplate(neighbor as ApiTemplate));
                  }
                  // Recursively extract neighbors of this neighbor
                  extractNeighborTemplates(
                    neighbor as { neighbors?: unknown[] }
                  );
                }
              }
            });
          }
        };

        extractNeighborTemplates(templateFlow);

        setTemplates(allTemplates);
      } catch (err) {
        console.error('Error loading template data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load template data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadTemplateData();
  }, []);

  return (
    <Box sx={{ flex: 1, height: 'calc(100vh - 64px)' }}>
      <TemplateGraph data={templates} loading={loading} error={error} />
    </Box>
  );
};

export default TemplateGraphPage;

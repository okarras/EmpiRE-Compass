import { useCallback } from 'react';
import { loadTemplateFlowByID } from '../api/get_template_data';
import { generateTemplateMapping } from '../utils/promptGenerator';
import { Template } from '../components/Graph/types';

const DEFAULT_TEMPLATE_ID = 'R186491';
const DEFAULT_TARGET_CLASS_ID = 'C27001';
const STORAGE_KEY = 'selected-template-id';

interface UseTemplateLoaderProps {
  updateTemplateId: (id: string) => void;
  updateTemplateMapping: (mapping: Record<string, unknown>) => void;
  updateTargetClassId: (id: string) => void;
  currentTargetClassId?: string | null;
}

export const useTemplateLoader = ({
  updateTemplateId,
  updateTemplateMapping,
  updateTargetClassId,
  currentTargetClassId,
}: UseTemplateLoaderProps) => {
  /**
   * Load template data and extract all related templates
   */
  const loadTemplateData = useCallback(
    async (templateId: string) => {
      const templateFlow = await loadTemplateFlowByID(templateId, new Set());
      const allTemplates: Template[] = [];

      // Add the main template
      if (templateFlow && 'id' in templateFlow && templateFlow.id) {
        allTemplates.push(templateFlow as Template);

        // Extract and store target class ID
        if (
          'target_class' in templateFlow &&
          templateFlow.target_class &&
          typeof templateFlow.target_class === 'object' &&
          'id' in templateFlow.target_class
        ) {
          const targetClassId = templateFlow.target_class.id as string;
          updateTargetClassId(targetClassId);
        }
      }

      // Recursively extract neighbor templates
      const extractNeighborTemplates = (node: { neighbors?: unknown[] }) => {
        if (node.neighbors && Array.isArray(node.neighbors)) {
          node.neighbors.forEach((neighbor) => {
            if (
              neighbor &&
              typeof neighbor === 'object' &&
              'id' in neighbor &&
              neighbor.id &&
              typeof neighbor.id === 'string' &&
              neighbor.id.startsWith('R')
            ) {
              // Check if we already have this template to avoid duplicates
              if (!allTemplates.find((t) => t.id === neighbor.id)) {
                allTemplates.push(neighbor as Template);
              }
              // Recursively extract neighbors
              extractNeighborTemplates(neighbor as { neighbors?: unknown[] });
            }
          });
        }
      };

      extractNeighborTemplates(templateFlow);

      // Generate and return template mapping
      return generateTemplateMapping(allTemplates);
    },
    [updateTargetClassId]
  );

  /**
   * Handle template ID change with persistence
   */
  const handleTemplateChange = useCallback(
    async (newTemplateId: string) => {
      updateTemplateId(newTemplateId);

      // Load template data for ALL templates (including default R186491)
      try {
        const templateMapping = await loadTemplateData(newTemplateId);
        updateTemplateMapping(templateMapping);

        // Ensure default target class ID for default template if not already set
        if (
          newTemplateId === DEFAULT_TEMPLATE_ID &&
          currentTargetClassId !== DEFAULT_TARGET_CLASS_ID
        ) {
          updateTargetClassId(DEFAULT_TARGET_CLASS_ID);
        }

        // Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, newTemplateId);
        } catch {
          // Ignore storage errors
        }
      } catch (err) {
        console.error('Error loading schema data:', err);
        // If loading fails, ensure default target class for default template
        if (
          newTemplateId === DEFAULT_TEMPLATE_ID &&
          currentTargetClassId !== DEFAULT_TARGET_CLASS_ID
        ) {
          updateTargetClassId(DEFAULT_TARGET_CLASS_ID);
        }
        // Continue with empty mapping if template loading fails
        updateTemplateMapping({});
      }
    },
    [
      updateTemplateId,
      updateTemplateMapping,
      updateTargetClassId,
      currentTargetClassId,
      loadTemplateData,
    ]
  );

  /**
   * Load template from localStorage
   */
  const loadSavedTemplate = useCallback(
    async (currentTemplateId: string) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved !== currentTemplateId) {
          await handleTemplateChange(saved);
          return saved;
        }
      } catch {
        // Ignore storage errors
      }
      return null;
    },
    [handleTemplateChange]
  );

  return {
    handleTemplateChange,
    loadSavedTemplate,
  };
};

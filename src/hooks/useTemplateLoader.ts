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
  const loadTemplateData = useCallback(
    async (templateId: string) => {
      const templateFlow = await loadTemplateFlowByID(templateId, new Set());
      const allTemplates: Template[] = [];

      if (templateFlow && 'id' in templateFlow && templateFlow.id) {
        allTemplates.push(templateFlow as Template);

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
              if (!allTemplates.find((t) => t.id === neighbor.id)) {
                allTemplates.push(neighbor as Template);
              }
              extractNeighborTemplates(neighbor as { neighbors?: unknown[] });
            }
          });
        }
      };

      extractNeighborTemplates(templateFlow);

      return generateTemplateMapping(allTemplates);
    },
    [updateTargetClassId]
  );

  const handleTemplateChange = useCallback(
    async (newTemplateId: string) => {
      updateTemplateId(newTemplateId);

      try {
        const templateMapping = await loadTemplateData(newTemplateId);
        updateTemplateMapping(templateMapping);

        if (
          newTemplateId === DEFAULT_TEMPLATE_ID &&
          currentTargetClassId !== DEFAULT_TARGET_CLASS_ID
        ) {
          updateTargetClassId(DEFAULT_TARGET_CLASS_ID);
        }

        try {
          localStorage.setItem(STORAGE_KEY, newTemplateId);
        } catch {
          // storage unavailable
        }
      } catch (err) {
        console.error('Error loading schema data:', err);
        if (
          newTemplateId === DEFAULT_TEMPLATE_ID &&
          currentTargetClassId !== DEFAULT_TARGET_CLASS_ID
        ) {
          updateTargetClassId(DEFAULT_TARGET_CLASS_ID);
        }
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

  const loadSavedTemplate = useCallback(
    async (currentTemplateId: string) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved !== currentTemplateId) {
          await handleTemplateChange(saved);
          return saved;
        }
      } catch {
        // storage unavailable
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

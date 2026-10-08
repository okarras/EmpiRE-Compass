import { useCallback, useMemo, useState } from 'react';
import type { Template } from '../components/Graph/types';
import {
  SchemaBuilderState,
  SchemaDefinition,
  SchemaField,
  buildJsonSchema,
  clearRefs,
  createField,
  createId,
  mapFieldTree,
  removeFromTree,
  templatesToBuilderState,
} from '../components/Graph/VisualEditor/schemaBuilder';

export type FieldTarget = { parentId?: string; definitionId?: string };

export type FieldPatch = Partial<Omit<SchemaField, 'id' | 'children'>>;
export type DefinitionPatch = Partial<
  Pick<SchemaDefinition, 'name' | 'description'>
>;

export interface SchemaFieldActions {
  addField: (target?: FieldTarget) => void;
  updateField: (id: string, patch: FieldPatch) => void;
  removeField: (id: string) => void;
}

const EMPTY_STATE: SchemaBuilderState = {
  title: '',
  fields: [],
  definitions: [],
};

export function useSchemaBuilder(templates: Template[]) {
  const [state, setState] = useState<SchemaBuilderState>(() =>
    templatesToBuilderState(templates)
  );

  const schemaJson = useMemo(
    () => JSON.stringify(buildJsonSchema(state), null, 2),
    [state]
  );

  // Field ids are unique across root + all definitions, so tree edits can just run on every tree
  const mapAllTrees = useCallback(
    (fn: (fields: SchemaField[]) => SchemaField[]) =>
      setState((prev) => ({
        ...prev,
        fields: fn(prev.fields),
        definitions: prev.definitions.map((d) => ({
          ...d,
          fields: fn(d.fields),
        })),
      })),
    []
  );

  const addField = useCallback(
    ({ parentId, definitionId }: FieldTarget = {}) => {
      const field = createField();
      if (parentId) {
        mapAllTrees((fields) =>
          mapFieldTree(fields, parentId, (p) => ({
            ...p,
            children: [...p.children, field],
          }))
        );
        return;
      }
      setState((prev) =>
        definitionId
          ? {
              ...prev,
              definitions: prev.definitions.map((d) =>
                d.id === definitionId
                  ? { ...d, fields: [...d.fields, field] }
                  : d
              ),
            }
          : { ...prev, fields: [...prev.fields, field] }
      );
    },
    [mapAllTrees]
  );

  const updateField = useCallback(
    (id: string, patch: FieldPatch) =>
      mapAllTrees((fields) =>
        mapFieldTree(fields, id, (f) => ({ ...f, ...patch }))
      ),
    [mapAllTrees]
  );

  const removeField = useCallback(
    (id: string) => mapAllTrees((fields) => removeFromTree(fields, id)),
    [mapAllTrees]
  );

  const addDefinition = useCallback(() => {
    const id = createId('d');
    setState((prev) => {
      const taken = new Set(prev.definitions.map((d) => d.name));
      let name = 'NewDefinition';
      for (let n = 2; taken.has(name); n++) name = `NewDefinition${n}`;
      return {
        ...prev,
        definitions: [...prev.definitions, { id, name, fields: [] }],
      };
    });
  }, []);

  const updateDefinition = useCallback(
    (id: string, patch: DefinitionPatch) =>
      setState((prev) => ({
        ...prev,
        definitions: prev.definitions.map((d) =>
          d.id === id ? { ...d, ...patch } : d
        ),
      })),
    []
  );

  const removeDefinition = useCallback(
    (id: string) =>
      setState((prev) => ({
        ...prev,
        fields: clearRefs(prev.fields, id),
        definitions: prev.definitions
          .filter((d) => d.id !== id)
          .map((d) => ({ ...d, fields: clearRefs(d.fields, id) })),
      })),
    []
  );

  const setTitle = useCallback(
    (title: string) => setState((prev) => ({ ...prev, title })),
    []
  );

  const reset = useCallback(
    () => setState(templatesToBuilderState(templates)),
    [templates]
  );

  const clear = useCallback(() => setState(EMPTY_STATE), []);

  const fieldActions = useMemo<SchemaFieldActions>(
    () => ({ addField, updateField, removeField }),
    [addField, updateField, removeField]
  );

  return {
    state,
    schemaJson,
    setTitle,
    fieldActions,
    addDefinition,
    updateDefinition,
    removeDefinition,
    reset,
    clear,
  };
}

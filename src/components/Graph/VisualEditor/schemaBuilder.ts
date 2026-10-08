import type { Template, TemplateProperty } from '../types';

export type SchemaFieldType = 'object' | 'string' | 'reference' | 'list';
export type ListItemType = 'string' | 'reference';

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  required: boolean;
  description?: string;
  // Points at a definition id, not its name, so renaming a definition keeps refs intact
  refId?: string;
  itemType?: ListItemType;
  // Only emitted when type is 'object'; kept otherwise so switching type back doesn't lose work
  children: SchemaField[];
}

export interface SchemaDefinition {
  id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
}

export interface SchemaBuilderState {
  title: string;
  fields: SchemaField[];
  definitions: SchemaDefinition[];
}

export type JsonSchema = Record<string, unknown>;

export const JSON_SCHEMA_DIALECT =
  'https://json-schema.org/draft/2020-12/schema';

let idCounter = 0;
export const createId = (prefix = 'f') =>
  `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

export const createField = (
  overrides: Partial<SchemaField> = {}
): SchemaField => ({
  id: createId(),
  name: '',
  type: 'string',
  required: false,
  children: [],
  ...overrides,
});

export const mapFieldTree = (
  fields: SchemaField[],
  id: string,
  fn: (field: SchemaField) => SchemaField
): SchemaField[] =>
  fields.map((f) => {
    if (f.id === id) return fn(f);
    if (!f.children.length) return f;
    return { ...f, children: mapFieldTree(f.children, id, fn) };
  });

export const removeFromTree = (
  fields: SchemaField[],
  id: string
): SchemaField[] =>
  fields
    .filter((f) => f.id !== id)
    .map((f) =>
      f.children.length ? { ...f, children: removeFromTree(f.children, id) } : f
    );

// Drop refs to a deleted definition so we never emit a dangling $ref
export const clearRefs = (
  fields: SchemaField[],
  refId: string
): SchemaField[] =>
  fields.map((f) => ({
    ...f,
    refId: f.refId === refId ? undefined : f.refId,
    children: clearRefs(f.children, refId),
  }));

export const findDuplicateNames = (items: { name: string }[]) => {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  items.forEach(({ name }) => {
    const key = name.trim();
    if (!key) return;
    if (seen.has(key)) dupes.add(key);
    seen.add(key);
  });
  return dupes;
};

// JSON Pointer escaping (RFC 6901): "~" and "/" are special in $ref paths
export const toDefRef = (name: string) =>
  `#/$defs/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`;

type DefNames = Map<string, string>;

const refSchema = (refId: string | undefined, defNames: DefNames) => {
  const name = refId ? defNames.get(refId) : undefined;
  // No target picked yet -> "any", which keeps the schema valid while editing
  return name ? { $ref: toDefRef(name) } : {};
};

const objectBody = (fields: SchemaField[], defNames: DefNames) => {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  fields.forEach((f) => {
    const name = f.name.trim();
    // Unnamed rows are drafts; keep them out until the user names them
    if (!name) return;
    properties[name] = fieldToSchema(f, defNames);
    if (f.required && !required.includes(name)) required.push(name);
  });
  return required.length ? { properties, required } : { properties };
};

const fieldToSchema = (field: SchemaField, defNames: DefNames): JsonSchema => {
  const description = field.description?.trim();
  const meta = description ? { description } : {};
  switch (field.type) {
    case 'string':
      return { type: 'string', ...meta };
    case 'reference':
      return { ...refSchema(field.refId, defNames), ...meta };
    case 'list':
      return {
        type: 'array',
        ...meta,
        items:
          field.itemType === 'reference'
            ? refSchema(field.refId, defNames)
            : { type: 'string' },
      };
    case 'object':
      return {
        type: 'object',
        ...meta,
        ...objectBody(field.children, defNames),
      };
  }
};

export const buildJsonSchema = (state: SchemaBuilderState): JsonSchema => {
  const defNames: DefNames = new Map(
    state.definitions
      .filter((d) => d.name.trim())
      .map((d) => [d.id, d.name.trim()])
  );

  const schema: JsonSchema = {
    $schema: JSON_SCHEMA_DIALECT,
    ...(state.title.trim() ? { title: state.title.trim() } : {}),
    type: 'object',
    ...objectBody(state.fields, defNames),
  };

  const defs: Record<string, JsonSchema> = {};
  state.definitions.forEach((d) => {
    const name = d.name.trim();
    if (!name) return;
    const description = d.description?.trim();
    defs[name] = {
      type: 'object',
      ...(description ? { description } : {}),
      ...objectBody(d.fields, defNames),
    };
  });
  if (Object.keys(defs).length) schema.$defs = defs;

  return schema;
};

const propertyToField = (
  prop: TemplateProperty,
  defIdByClassId: Map<string, string>
): SchemaField => {
  const refId = prop.class?.id ? defIdByClassId.get(prop.class.id) : undefined;
  const base = {
    name: prop.path?.label || prop.label,
    required: (prop.min_count ?? 0) >= 1,
    description: prop.description ?? undefined,
  };
  // Same cardinality rule as the "Download as JSON" mapping export
  const isList = prop.max_count === null || prop.max_count > 1;

  if (isList) {
    return createField({
      ...base,
      type: 'list',
      itemType: refId ? 'reference' : 'string',
      refId,
    });
  }
  if (refId) return createField({ ...base, type: 'reference', refId });
  // Class without a loaded template: still an object, just with unknown shape
  if (prop.class?.id) return createField({ ...base, type: 'object' });
  return createField({ ...base, type: 'string' });
};

const sortProps = (props?: TemplateProperty[]) =>
  (props ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

// templates[0] is the main template (TemplateGraphPage guarantees the order);
// every other template becomes a reusable definition.
export const templatesToBuilderState = (
  templates: Template[]
): SchemaBuilderState => {
  if (!templates.length) return { title: '', fields: [], definitions: [] };

  const [main, ...rest] = templates;
  const usedNames = new Set<string>();
  const defIdByClassId = new Map<string, string>();

  const seeds = rest.map((template) => {
    // ORKG labels aren't unique, but $defs keys must be
    const baseName = template.label || template.id;
    let name = baseName;
    for (let n = 2; usedNames.has(name); n++) name = `${baseName} (${n})`;
    usedNames.add(name);

    const id = createId('d');
    if (template.target_class?.id)
      defIdByClassId.set(template.target_class.id, id);
    return { id, name, template };
  });

  const toFields = (props?: TemplateProperty[]) =>
    sortProps(props).map((p) => propertyToField(p, defIdByClassId));

  return {
    title: main.label,
    fields: toFields(main.properties),
    definitions: seeds.map(({ id, name, template }) => ({
      id,
      name,
      description: template.description ?? undefined,
      fields: toFields(template.properties),
    })),
  };
};

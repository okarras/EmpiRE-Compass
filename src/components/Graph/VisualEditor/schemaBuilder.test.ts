import { describe, expect, it } from 'vitest';
import type { Template } from '../types';
import {
  JSON_SCHEMA_DIALECT,
  SchemaBuilderState,
  buildJsonSchema,
  clearRefs,
  createField,
  findDuplicateNames,
  mapFieldTree,
  removeFromTree,
  templatesToBuilderState,
  toDefRef,
} from './schemaBuilder';

const prop = (
  overrides: Partial<NonNullable<Template['properties']>[number]>
) => ({
  id: 'P_x',
  label: 'x',
  min_count: 0,
  max_count: 1,
  path: { id: 'P_x', label: 'x' },
  ...overrides,
});

describe('buildJsonSchema', () => {
  it('builds the person/address/hobbies example', () => {
    const state: SchemaBuilderState = {
      title: 'Profile',
      fields: [
        createField({
          name: 'person',
          type: 'object',
          required: true,
          children: [createField({ name: 'name', required: true })],
        }),
        createField({ name: 'address', type: 'reference', refId: 'd1' }),
        createField({ name: 'hobbies', type: 'list', itemType: 'string' }),
      ],
      definitions: [
        { id: 'd1', name: 'Address', fields: [createField({ name: 'city' })] },
      ],
    };

    expect(buildJsonSchema(state)).toEqual({
      $schema: JSON_SCHEMA_DIALECT,
      title: 'Profile',
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        address: { $ref: '#/$defs/Address' },
        hobbies: { type: 'array', items: { type: 'string' } },
      },
      required: ['person'],
      $defs: {
        Address: { type: 'object', properties: { city: { type: 'string' } } },
      },
    });
  });

  it('skips unnamed fields and emits "any" for unresolved refs', () => {
    const schema = buildJsonSchema({
      title: '',
      fields: [
        createField({ name: '   ' }),
        createField({
          name: 'tags',
          type: 'list',
          itemType: 'reference',
          refId: 'gone',
        }),
      ],
      definitions: [],
    });
    expect(schema.properties).toEqual({ tags: { type: 'array', items: {} } });
    expect(schema).not.toHaveProperty('title');
    expect(schema).not.toHaveProperty('$defs');
  });

  it('only emits nested children for object fields', () => {
    const schema = buildJsonSchema({
      title: 'T',
      fields: [
        createField({
          name: 'a',
          type: 'string',
          children: [createField({ name: 'b' })],
        }),
      ],
      definitions: [],
    });
    expect(schema.properties).toEqual({ a: { type: 'string' } });
  });
});

describe('toDefRef', () => {
  it('escapes JSON pointer characters', () => {
    expect(toDefRef('a/b~c')).toBe('#/$defs/a~1b~0c');
  });
});

describe('tree helpers', () => {
  const child = createField({ name: 'child', refId: 'd1' });
  const root = createField({ name: 'root', type: 'object', children: [child] });

  it('updates and removes nested fields', () => {
    const renamed = mapFieldTree([root], child.id, (f) => ({
      ...f,
      name: 'renamed',
    }));
    expect(renamed[0].children[0].name).toBe('renamed');
    expect(removeFromTree([root], child.id)[0].children).toEqual([]);
  });

  it('clears refs to a deleted definition', () => {
    expect(clearRefs([root], 'd1')[0].children[0].refId).toBeUndefined();
  });

  it('flags duplicate names, ignoring blanks', () => {
    expect(
      findDuplicateNames([
        { name: 'a' },
        { name: 'a ' },
        { name: '' },
        { name: '' },
      ])
    ).toEqual(new Set(['a']));
  });
});

describe('templatesToBuilderState', () => {
  it('returns an empty state without templates', () => {
    expect(templatesToBuilderState([])).toEqual({
      title: '',
      fields: [],
      definitions: [],
    });
  });

  it('maps the main template to fields and the rest to definitions', () => {
    const templates: Template[] = [
      {
        id: 'R1',
        label: 'Paper',
        target_class: { id: 'C1', label: 'Paper' },
        properties: [
          prop({
            id: 'p2',
            order: 2,
            path: { id: 'P2', label: 'authors' },
            max_count: null,
            class: { id: 'C2', label: 'Author' },
          }),
          prop({
            id: 'p1',
            order: 1,
            path: { id: 'P1', label: 'venue' },
            min_count: 1,
            class: { id: 'C2', label: 'Author' },
          }),
          prop({
            id: 'p3',
            order: 3,
            path: { id: 'P3', label: 'keywords' },
            max_count: 5,
          }),
          prop({
            id: 'p4',
            order: 4,
            path: { id: 'P4', label: 'misc' },
            class: { id: 'C9', label: 'Unknown' },
          }),
        ],
      },
      {
        id: 'R2',
        label: 'Author',
        target_class: { id: 'C2', label: 'Author' },
        properties: [prop({})],
      },
      {
        id: 'R3',
        label: 'Author',
        target_class: { id: 'C3', label: 'Author' },
      },
    ];

    const state = templatesToBuilderState(templates);
    const authorDefId = state.definitions[0].id;

    expect(state.title).toBe('Paper');
    expect(state.definitions.map((d) => d.name)).toEqual([
      'Author',
      'Author (2)',
    ]);
    expect(state.fields.map((f) => [f.name, f.type, f.required])).toEqual([
      ['venue', 'reference', true],
      ['authors', 'list', false],
      ['keywords', 'list', false],
      ['misc', 'object', false],
    ]);
    expect(state.fields[0].refId).toBe(authorDefId);
    expect(state.fields[1]).toMatchObject({
      itemType: 'reference',
      refId: authorDefId,
    });
    expect(state.fields[2].itemType).toBe('string');
  });
});

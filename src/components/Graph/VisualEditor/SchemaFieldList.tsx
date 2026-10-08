import React, { useMemo } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  DataObject,
  DeleteOutline,
  FormatListBulleted,
  Link as LinkIcon,
  TextFields,
} from '@mui/icons-material';
import {
  SchemaDefinition,
  SchemaField,
  SchemaFieldType,
  findDuplicateNames,
} from './schemaBuilder';
import type { SchemaFieldActions } from '../../../hooks/useSchemaBuilder';

const TYPE_OPTIONS: {
  value: SchemaFieldType;
  label: string;
  Icon: typeof DataObject;
}[] = [
  { value: 'object', label: 'Object', Icon: DataObject },
  { value: 'string', label: 'String', Icon: TextFields },
  { value: 'reference', label: 'Reference', Icon: LinkIcon },
  { value: 'list', label: 'List', Icon: FormatListBulleted },
];

// List items can be plain strings or a $ref; one select keeps the row compact
const REF_PREFIX = 'ref:';

interface SchemaFieldListProps {
  fields: SchemaField[];
  definitions: SchemaDefinition[];
  actions: SchemaFieldActions;
  depth?: number;
  emptyText?: string;
}

interface FieldRowProps {
  field: SchemaField;
  definitions: SchemaDefinition[];
  actions: SchemaFieldActions;
  depth: number;
  isDuplicate: boolean;
}

const defLabel = (d: SchemaDefinition) => d.name.trim() || '(unnamed)';

const FieldRow: React.FC<FieldRowProps> = ({
  field,
  definitions,
  actions,
  depth,
  isDuplicate,
}) => {
  const { updateField, removeField, addField } = actions;
  const listValue =
    field.itemType === 'reference' && field.refId
      ? `${REF_PREFIX}${field.refId}`
      : 'string';

  const handleListItemChange = (value: string) =>
    updateField(
      field.id,
      value.startsWith(REF_PREFIX)
        ? { itemType: 'reference', refId: value.slice(REF_PREFIX.length) }
        : { itemType: 'string' }
    );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderLeft: 3,
        borderLeftColor: depth ? 'secondary.main' : 'primary.main',
        '&:hover': { boxShadow: 2 },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          size="small"
          placeholder="Field name"
          value={field.name}
          onChange={(e) => updateField(field.id, { name: e.target.value })}
          error={isDuplicate}
          helperText={isDuplicate ? 'Duplicate name' : undefined}
          sx={{ flex: '1 1 160px' }}
          slotProps={{ htmlInput: { 'aria-label': 'Field name' } }}
        />
        <TextField
          select
          size="small"
          label="Type"
          value={field.type}
          onChange={(e) =>
            updateField(field.id, { type: e.target.value as SchemaFieldType })
          }
          sx={{ width: 150 }}
        >
          {TYPE_OPTIONS.map(({ value, label, Icon }) => (
            <MenuItem key={value} value={value}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon fontSize="small" color="action" />
                <span>{label}</span>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
        {field.type === 'reference' && (
          <TextField
            select
            size="small"
            label="$ref"
            value={field.refId ?? ''}
            onChange={(e) => updateField(field.id, { refId: e.target.value })}
            disabled={!definitions.length}
            helperText={
              !definitions.length ? 'Add a definition first' : undefined
            }
            sx={{ width: 180 }}
          >
            {definitions.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {defLabel(d)}
              </MenuItem>
            ))}
          </TextField>
        )}
        {field.type === 'list' && (
          <TextField
            select
            size="small"
            label="Items"
            value={listValue}
            onChange={(e) => handleListItemChange(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="string">String</MenuItem>
            {definitions.map((d) => (
              <MenuItem key={d.id} value={`${REF_PREFIX}${d.id}`}>
                $ref → {defLabel(d)}
              </MenuItem>
            ))}
          </TextField>
        )}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={field.required}
              onChange={(e) =>
                updateField(field.id, { required: e.target.checked })
              }
            />
          }
          label={
            <Typography
              variant="body2"
              color={field.required ? 'primary' : 'text.secondary'}
            >
              {field.required ? 'Required' : 'Optional'}
            </Typography>
          }
          sx={{ mx: 0, minWidth: 108, height: 40 }}
        />
        <Tooltip title="Remove field">
          <IconButton
            size="small"
            aria-label="Remove field"
            onClick={() => removeField(field.id)}
            sx={{ mt: 0.5 }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <TextField
        variant="standard"
        fullWidth
        placeholder="Description (optional)"
        value={field.description ?? ''}
        onChange={(e) => updateField(field.id, { description: e.target.value })}
        sx={{ mt: 0.5 }}
        slotProps={{
          input: {
            disableUnderline: true,
            sx: { fontSize: 13, color: 'text.secondary' },
          },
        }}
      />
      {field.type === 'object' && (
        <Box sx={{ mt: 1, pl: 2, borderLeft: 1, borderColor: 'divider' }}>
          <SchemaFieldList
            fields={field.children}
            definitions={definitions}
            actions={actions}
            depth={depth + 1}
            emptyText="No nested fields yet."
          />
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => addField({ parentId: field.id })}
            sx={{ mt: 1 }}
          >
            Add nested field
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export const SchemaFieldList: React.FC<SchemaFieldListProps> = ({
  fields,
  definitions,
  actions,
  depth = 0,
  emptyText = 'No fields yet.',
}) => {
  const duplicates = useMemo(() => findDuplicateNames(fields), [fields]);

  if (!fields.length) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 1, fontStyle: 'italic' }}
      >
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {fields.map((field) => (
        <FieldRow
          key={field.id}
          field={field}
          definitions={definitions}
          actions={actions}
          depth={depth}
          isDuplicate={duplicates.has(field.name.trim())}
        />
      ))}
    </Stack>
  );
};

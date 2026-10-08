import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline, ExpandMore } from '@mui/icons-material';
import {
  SchemaDefinition,
  findDuplicateNames,
  toDefRef,
} from './schemaBuilder';
import { SchemaFieldList } from './SchemaFieldList';
import type {
  DefinitionPatch,
  SchemaFieldActions,
} from '../../../hooks/useSchemaBuilder';

interface SchemaDefinitionsPanelProps {
  definitions: SchemaDefinition[];
  fieldActions: SchemaFieldActions;
  onAdd: () => void;
  onUpdate: (id: string, patch: DefinitionPatch) => void;
  onRemove: (id: string) => void;
}

interface DefinitionCardProps {
  definition: SchemaDefinition;
  definitions: SchemaDefinition[];
  fieldActions: SchemaFieldActions;
  isDuplicate: boolean;
  onUpdate: (id: string, patch: DefinitionPatch) => void;
  onRemove: (id: string) => void;
}

const DefinitionCard: React.FC<DefinitionCardProps> = ({
  definition,
  definitions,
  fieldActions,
  isDuplicate,
  onUpdate,
  onRemove,
}) => {
  // Seeded templates can be long, so start collapsed; fresh ones open for editing
  const [expanded, setExpanded] = useState(definition.fields.length === 0);
  const name = definition.name.trim();

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, borderLeft: 3, borderLeftColor: 'warning.main' }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse definition' : 'Expand definition'}
          onClick={() => setExpanded((v) => !v)}
          sx={{
            mt: 0.5,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <ExpandMore fontSize="small" />
        </IconButton>
        <TextField
          size="small"
          placeholder="Definition name"
          value={definition.name}
          onChange={(e) => onUpdate(definition.id, { name: e.target.value })}
          error={isDuplicate}
          helperText={isDuplicate ? 'Duplicate name' : undefined}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { 'aria-label': 'Definition name' } }}
        />
        <Chip
          size="small"
          variant="outlined"
          label={name ? toDefRef(name) : '#/$defs/…'}
          sx={{ mt: 1, fontFamily: 'monospace', maxWidth: 220 }}
        />
        <Chip
          size="small"
          label={`${definition.fields.length} field${definition.fields.length === 1 ? '' : 's'}`}
          sx={{ mt: 1 }}
        />
        <Tooltip title="Remove definition (clears refs pointing to it)">
          <IconButton
            size="small"
            aria-label="Remove definition"
            onClick={() => onRemove(definition.id)}
            sx={{ mt: 0.5 }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ mt: 1.5, pl: 2, borderLeft: 1, borderColor: 'divider' }}>
          <TextField
            variant="standard"
            fullWidth
            placeholder="Description (optional)"
            value={definition.description ?? ''}
            onChange={(e) =>
              onUpdate(definition.id, { description: e.target.value })
            }
            sx={{ mb: 1 }}
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { fontSize: 13, color: 'text.secondary' },
              },
            }}
          />
          <SchemaFieldList
            fields={definition.fields}
            definitions={definitions}
            actions={fieldActions}
            depth={1}
            emptyText="No fields in this definition yet."
          />
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() =>
              fieldActions.addField({ definitionId: definition.id })
            }
            sx={{ mt: 1 }}
          >
            Add field
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export const SchemaDefinitionsPanel: React.FC<SchemaDefinitionsPanelProps> = ({
  definitions,
  fieldActions,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const duplicates = useMemo(
    () => findDuplicateNames(definitions),
    [definitions]
  );

  return (
    <Box component="section" aria-labelledby="schema-definitions-heading">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Box>
          <Typography id="schema-definitions-heading" variant="h6">
            Definitions
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reusable schemas, referenced with $ref
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={onAdd}>
          Add Definition
        </Button>
      </Stack>
      {definitions.length ? (
        <Stack spacing={1}>
          {definitions.map((d) => (
            <DefinitionCard
              key={d.id}
              definition={d}
              definitions={definitions}
              fieldActions={fieldActions}
              isDuplicate={duplicates.has(d.name.trim())}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
        </Stack>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 1, fontStyle: 'italic' }}
        >
          No definitions yet.
        </Typography>
      )}
    </Box>
  );
};

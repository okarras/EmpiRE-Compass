import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  ContentCopy,
  DeleteSweep,
  Download,
  RestartAlt,
} from '@mui/icons-material';
import CodeEditor from '../../CodeEditor/CodeEditor';
import { useSchemaBuilder } from '../../../hooks/useSchemaBuilder';
import type { Template } from '../types';
import { SchemaFieldList } from './SchemaFieldList';
import { SchemaDefinitionsPanel } from './SchemaDefinitionsPanel';

interface SchemaVisualEditorProps {
  templates: Template[];
  onClose: () => void;
}

const SchemaVisualEditor: React.FC<SchemaVisualEditorProps> = ({
  templates,
  onClose,
}) => {
  const theme = useTheme();
  const builder = useSchemaBuilder(templates);
  const { state, schemaJson, fieldActions } = builder;
  const [copied, setCopied] = useState(false);
  const editorHostRef = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(0);

  // CodeEditor wants a fixed height; a % height collapses inside its wrapper, so measure the panel
  useEffect(() => {
    const el = editorHostRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setEditorHeight(Math.floor(entry.contentRect.height))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const confirmThen = (message: string, action: () => void) => {
    if (window.confirm(message)) action();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schemaJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy schema:', err);
    }
  };

  const handleDownload = () => {
    const slug =
      state.title
        .trim()
        .replace(/[^\w-]+/g, '-')
        .toLowerCase() || 'schema';
    const url = URL.createObjectURL(
      new Blob([schemaJson], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.download = `${slug}.schema.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button
          id="schema-editor-back-button"
          variant="outlined"
          size="small"
          startIcon={<ArrowBack />}
          onClick={onClose}
        >
          Back to Graph
        </Button>
        <TextField
          size="small"
          label="Schema title"
          value={state.title}
          onChange={(e) => builder.setTitle(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Rebuild from the loaded template (discards edits)">
          <Button
            size="small"
            startIcon={<RestartAlt />}
            onClick={() =>
              confirmThen(
                'Discard your edits and rebuild from the template?',
                builder.reset
              )
            }
          >
            Reset
          </Button>
        </Tooltip>
        <Tooltip title="Start from an empty schema">
          <Button
            size="small"
            color="inherit"
            startIcon={<DeleteSweep />}
            onClick={() =>
              confirmThen('Remove all fields and definitions?', builder.clear)
            }
          >
            Clear
          </Button>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(0, 1fr) minmax(0, 1fr)',
          },
          gridTemplateRows: {
            xs: 'minmax(0, 1fr) minmax(0, 1fr)',
            md: 'minmax(0, 1fr)',
          },
        }}
      >
        {/* Left: visual builder */}
        <Box
          component="section"
          aria-labelledby="schema-fields-heading"
          sx={{ overflow: 'auto', p: 2.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography id="schema-fields-heading" variant="h6">
                Fields
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top-level properties of the schema
              </Typography>
            </Box>
            <Button
              id="schema-add-field-button"
              variant="contained"
              startIcon={<Add />}
              onClick={() => fieldActions.addField()}
            >
              Add Field
            </Button>
          </Stack>
          <SchemaFieldList
            fields={state.fields}
            definitions={state.definitions}
            actions={fieldActions}
            emptyText="No fields yet. Click “Add Field” to start."
          />
          <Divider sx={{ my: 3 }} />
          <SchemaDefinitionsPanel
            definitions={state.definitions}
            fieldActions={fieldActions}
            onAdd={builder.addDefinition}
            onUpdate={builder.updateDefinition}
            onRemove={builder.removeDefinition}
          />
        </Box>

        {/* Right: generated source */}
        <Box
          component="section"
          aria-label="Generated JSON schema"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            bgcolor: 'background.paper',
            borderLeft: { md: 1 },
            borderTop: { xs: 1, md: 0 },
            borderColor: 'divider',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">JSON Schema</Typography>
              <Typography variant="caption" color="text.secondary">
                Generated live from the builder · read-only
              </Typography>
            </Box>
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton
                size="small"
                aria-label="Copy schema"
                onClick={handleCopy}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download schema">
              <IconButton
                size="small"
                aria-label="Download schema"
                onClick={handleDownload}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Box ref={editorHostRef} sx={{ flex: 1, minHeight: 0, p: 1.5 }}>
            {editorHeight > 0 && (
              <CodeEditor
                value={schemaJson}
                language="json"
                readOnly
                height={editorHeight}
                theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'vs'}
                copyable={false}
                formattable={false}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SchemaVisualEditor;

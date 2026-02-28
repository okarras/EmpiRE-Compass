import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Close, Save, ExpandMore } from '@mui/icons-material';
import type { ChartSetting } from '../../constants/queries_chart_info';
import type { ChartSettingsOverride } from '../../firestore/CRUDStaticQuestionOverrides';

interface ChartSettingsEditorProps {
  open: boolean;
  onClose: () => void;
  chartSettings: ChartSetting;
  chartKey: 'chartSettings' | 'chartSettings2';
  onSave: (
    which: 'chartSettings' | 'chartSettings2',
    settings: ChartSettingsOverride,
    changeDescription?: string
  ) => Promise<void>;
  onPreviewChange?: (settings: ChartSettingsOverride | null) => void;
  onOpen?: () => Promise<void>;
}

interface FormKeyConfig {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: readonly string[];
  group?: string;
  helperText?: string;
}

const formKeys: FormKeyConfig[] = [
  {
    key: 'heading',
    label: 'Chart heading',
    type: 'string',
    placeholder: 'Main chart title',
  },
  {
    key: 'detailedChartHeading',
    label: 'Detailed chart heading',
    type: 'string',
    placeholder: 'Use {label} for series name',
  },
  {
    key: 'seriesHeadingTemplate',
    label: 'Series heading template',
    type: 'string',
    placeholder: 'e.g. "number of {label} used..."',
  },
  {
    key: 'barLabel',
    label: 'Bar label',
    type: 'string',
    placeholder: 'Label shown on bars',
  },
  { key: 'height', label: 'Height (px)', type: 'number', placeholder: '400' },
  {
    key: 'width',
    label: 'Width (px)',
    type: 'number',
    placeholder: 'Optional',
  },
  {
    key: 'barCategoryGap',
    label: 'Bar category gap',
    type: 'number',
    placeholder: '10',
  },
  { key: 'barGap', label: 'Bar gap', type: 'number', placeholder: '4' },
  { key: 'barWidth', label: 'Bar width', type: 'number', placeholder: '40' },
  {
    key: 'barCategoryGapRatio',
    label: 'Category gap ratio (MUI)',
    type: 'number',
    placeholder: '0.1',
  },
  {
    key: 'barGapRatio',
    label: 'Bar gap ratio (MUI)',
    type: 'number',
    placeholder: '0.1',
  },
  {
    key: 'borderRadius',
    label: 'Border radius',
    type: 'number',
    placeholder: '0',
  },
  {
    key: 'maxLabelLength',
    label: 'Max label length',
    type: 'string',
    placeholder: 'Number or "auto"',
  },
  {
    key: 'colors',
    label: 'Colors',
    type: 'colors',
    placeholder: '#e86161, #1976d2',
  },
  {
    key: 'layout',
    label: 'Layout',
    type: 'select',
    options: ['horizontal', 'vertical'],
  },
  { key: 'hideLegend', label: 'Hide legend', type: 'boolean' },
  { key: 'showToolbar', label: 'Show toolbar', type: 'boolean' },
  { key: 'skipAnimation', label: 'Skip animation', type: 'boolean' },
  {
    key: 'disableAxisListener',
    label: 'Disable axis listener',
    type: 'boolean',
    helperText: 'Improves performance, breaks interactivity',
  },
  { key: 'hideDetailedCharts', label: 'Hide detailed charts', type: 'boolean' },
  { key: 'noHeadingInSeries', label: 'No heading in series', type: 'boolean' },
  {
    key: 'doesntHaveNormalization',
    label: 'Disable normalization toggle',
    type: 'boolean',
  },
  {
    key: 'hideDetailedChartLegend',
    label: 'Hide detailed chart legend',
    type: 'boolean',
  },
  { key: 'marginTop', label: 'Margin top', type: 'number', group: 'margin' },
  {
    key: 'marginRight',
    label: 'Margin right',
    type: 'number',
    group: 'margin',
  },
  {
    key: 'marginBottom',
    label: 'Margin bottom',
    type: 'number',
    group: 'margin',
  },
  { key: 'marginLeft', label: 'Margin left', type: 'number', group: 'margin' },
  {
    key: 'axisHighlightX',
    label: 'Axis highlight X',
    type: 'select',
    options: ['band', 'line', 'none'],
    group: 'axisHighlight',
  },
  {
    key: 'axisHighlightY',
    label: 'Axis highlight Y',
    type: 'select',
    options: ['band', 'line', 'none'],
    group: 'axisHighlight',
  },
  {
    key: 'gridHorizontal',
    label: 'Grid horizontal',
    type: 'boolean',
    group: 'grid',
  },
  {
    key: 'gridVertical',
    label: 'Grid vertical',
    type: 'boolean',
    group: 'grid',
  },
];

type FormKey = FormKeyConfig['key'];

function getInitialValue(
  key: FormKey,
  chartSettings: ChartSetting,
  type: string
): string | number | boolean {
  if (key === 'colors') {
    return Array.isArray(chartSettings.colors)
      ? chartSettings.colors.join(', ')
      : '';
  }
  if (key === 'maxLabelLength' && chartSettings.maxLabelLength !== undefined) {
    return String(chartSettings.maxLabelLength);
  }
  if (key.startsWith('margin')) {
    const marginKey = key.replace('margin', '').toLowerCase() as
      | 'top'
      | 'right'
      | 'bottom'
      | 'left';
    const m = chartSettings.margin as Record<string, number> | undefined;
    return m?.[marginKey] ?? '';
  }
  if (key === 'axisHighlightX') {
    const ah = chartSettings.axisHighlight as { x?: string } | undefined;
    return ah?.x ?? '';
  }
  if (key === 'axisHighlightY') {
    const ah = chartSettings.axisHighlight as { y?: string } | undefined;
    return ah?.y ?? '';
  }
  if (key === 'gridHorizontal') {
    const g = chartSettings.grid as { horizontal?: boolean } | undefined;
    return !!g?.horizontal;
  }
  if (key === 'gridVertical') {
    const g = chartSettings.grid as { vertical?: boolean } | undefined;
    return !!g?.vertical;
  }
  const val = chartSettings[key as keyof ChartSetting];
  if (type === 'boolean') return !!val;
  if (val !== undefined && val !== null) return val as string | number;
  return type === 'number' ? '' : type === 'string' ? '' : false;
}

function formToOverride(
  form: Record<string, string | number | boolean>,
  chartSettings: ChartSetting
): ChartSettingsOverride {
  const result: ChartSettingsOverride = {};
  formKeys.forEach(({ key, type }) => {
    const val = form[key];
    const orig = getInitialValue(key, chartSettings, type);
    const hasChange =
      typeof val === 'boolean'
        ? val !== orig
        : key === 'colors'
          ? String(val ?? '').replace(/\s/g, '') !==
            String(orig ?? '').replace(/\s/g, '')
          : String(val ?? '') !== String(orig ?? '');

    if (!hasChange) return;

    if (key === 'colors') {
      const arr = String(val ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) result.colors = arr;
    } else if (key === 'maxLabelLength') {
      const s = String(val ?? '').trim();
      result.maxLabelLength =
        s === 'auto' ? 'auto' : parseInt(s, 10) || undefined;
    } else if (
      key.startsWith('margin') &&
      (typeof val === 'number' || (typeof val === 'string' && val !== ''))
    ) {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(num)) {
        result.margin = result.margin || {};
        const k = key.replace('margin', '').toLowerCase() as
          | 'top'
          | 'right'
          | 'bottom'
          | 'left';
        result.margin[k] = num;
      }
    } else if (key === 'axisHighlightX' && val) {
      result.axisHighlight = result.axisHighlight || {};
      result.axisHighlight.x = val as 'band' | 'line' | 'none';
    } else if (key === 'axisHighlightY' && val) {
      result.axisHighlight = result.axisHighlight || {};
      result.axisHighlight.y = val as 'band' | 'line' | 'none';
    } else if (key === 'gridHorizontal') {
      result.grid = result.grid || {};
      result.grid.horizontal = !!val;
    } else if (key === 'gridVertical') {
      result.grid = result.grid || {};
      result.grid.vertical = !!val;
    } else if (type === 'boolean') {
      (result as Record<string, unknown>)[key] = !!val;
    } else if (type === 'number') {
      const num = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
      if (!isNaN(num)) (result as Record<string, unknown>)[key] = num;
    } else if (typeof val === 'string' && val.trim()) {
      (result as Record<string, unknown>)[key] = val.trim();
    }
  });
  return result;
}

function formToFullOverride(
  form: Record<string, string | number | boolean>
): ChartSettingsOverride {
  const result: ChartSettingsOverride = {};
  formKeys.forEach(({ key, type }) => {
    const val = form[key];
    if (val === undefined || val === '') return;
    if (key === 'colors') {
      const arr = String(val)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) result.colors = arr;
    } else if (key === 'maxLabelLength') {
      const s = String(val).trim();
      result.maxLabelLength =
        s === 'auto' ? 'auto' : parseInt(s, 10) || undefined;
    } else if (key.startsWith('margin')) {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(num)) {
        result.margin = result.margin || {};
        const k = key.replace('margin', '').toLowerCase() as
          | 'top'
          | 'right'
          | 'bottom'
          | 'left';
        result.margin[k] = num;
      }
    } else if (key === 'axisHighlightX' && val) {
      result.axisHighlight = result.axisHighlight || {};
      result.axisHighlight.x = val as 'band' | 'line' | 'none';
    } else if (key === 'axisHighlightY' && val) {
      result.axisHighlight = result.axisHighlight || {};
      result.axisHighlight.y = val as 'band' | 'line' | 'none';
    } else if (key === 'gridHorizontal') {
      result.grid = result.grid || {};
      result.grid.horizontal = !!val;
    } else if (key === 'gridVertical') {
      result.grid = result.grid || {};
      result.grid.vertical = !!val;
    } else if (type === 'boolean') {
      (result as Record<string, unknown>)[key] = !!val;
    } else if (type === 'number') {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(num)) (result as Record<string, unknown>)[key] = num;
    } else if (typeof val === 'string' && val.trim()) {
      (result as Record<string, unknown>)[key] = val.trim();
    }
  });
  return result;
}

const ChartSettingsEditor: React.FC<ChartSettingsEditorProps> = ({
  open,
  onClose,
  chartSettings,
  chartKey,
  onSave,
  onPreviewChange,
  onOpen,
}) => {
  const [form, setForm] = useState<Record<string, string | number | boolean>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const prevOpenRef = useRef(false);

  const initForm = useCallback(() => {
    const initial: Record<string, string | number | boolean> = {};
    formKeys.forEach(({ key, type }) => {
      initial[key] = getInitialValue(key, chartSettings, type);
    });
    setForm(initial);
  }, [chartSettings]);

  // Only run load when transitioning from closed to open. Avoid re-running when
  // chartSettings changes (e.g. after fetchOverrides updates parent state),
  // which would cause an infinite loop.
  useEffect(() => {
    if (open && !prevOpenRef.current && chartSettings) {
      prevOpenRef.current = true;
      setOpening(true);
      const load = async () => {
        if (onOpen) await onOpen();
        initForm();
        setError(null);
        setOpening(false);
      };
      load();
    }
    if (!open) {
      prevOpenRef.current = false;
    }
  }, [open, chartSettings, onOpen, initForm]);

  useEffect(() => {
    if (!open) {
      onPreviewChange?.(null);
    }
  }, [open, onPreviewChange]);

  useEffect(() => {
    if (open && form && Object.keys(form).length > 0) {
      const preview = formToFullOverride(form);
      onPreviewChange?.(Object.keys(preview).length > 0 ? preview : null);
    }
  }, [open, form, onPreviewChange]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const override = formToOverride(form, chartSettings);
      if (Object.keys(override).length === 0) {
        setError('No changes to save');
        return;
      }
      await onSave(chartKey, override);
      onClose();
      onPreviewChange?.(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const baseFields = formKeys.filter((f) => !f.group);
  const marginFields = formKeys.filter((f) => f.group === 'margin');
  const axisFields = formKeys.filter((f) => f.group === 'axisHighlight');
  const gridFields = formKeys.filter((f) => f.group === 'grid');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 440 }, p: 2 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#e86161' }}>
            Edit chart settings
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <Close />
          </IconButton>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Changes apply live. Save to persist to Firebase (MUI X Charts).
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pb: 2,
          }}
        >
          {opening ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              {baseFields.map((field) => {
                const { key, label, type, placeholder, helperText } = field;
                return (
                  <Paper key={key} variant="outlined" sx={{ p: 1.5 }}>
                    {type === 'boolean' ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!form[key]}
                            onChange={(e) =>
                              handleChange(key, e.target.checked)
                            }
                            color="primary"
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={500}>
                            {label}
                          </Typography>
                        }
                      />
                    ) : type === 'select' ? (
                      <TextField
                        fullWidth
                        size="small"
                        select
                        label={label}
                        value={form[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        helperText={field.helperText}
                      >
                        <MenuItem value="">Default</MenuItem>
                        {(field.options || []).map((o: string) => (
                          <MenuItem key={o} value={o}>
                            {o}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        label={label}
                        value={form[key] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          handleChange(
                            key,
                            type === 'number' ? parseFloat(v) || '' : v
                          );
                        }}
                        placeholder={placeholder}
                        helperText={helperText}
                        type={type === 'number' ? 'number' : 'text'}
                        inputProps={
                          type === 'number' &&
                          (key === 'height' || key === 'width')
                            ? { min: 100, max: 1200 }
                            : undefined
                        }
                      />
                    )}
                  </Paper>
                );
              })}

              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Margin</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {marginFields.map(({ key, label }) => (
                      <TextField
                        key={key}
                        fullWidth
                        size="small"
                        label={label}
                        type="number"
                        value={form[key] ?? ''}
                        onChange={(e) =>
                          handleChange(key, parseFloat(e.target.value) || '')
                        }
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Axis highlight</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {axisFields.map(({ key, label, options }) => (
                      <TextField
                        key={key}
                        fullWidth
                        size="small"
                        select
                        label={label}
                        value={form[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                      >
                        <MenuItem value="">Default</MenuItem>
                        {(options || []).map((o: string) => (
                          <MenuItem key={o} value={o}>
                            {o}
                          </MenuItem>
                        ))}
                      </TextField>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">Grid</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {gridFields.map(({ key, label }) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            checked={!!form[key]}
                            onChange={(e) =>
                              handleChange(key, e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label={label}
                      />
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || opening}
            startIcon={
              saving ? <CircularProgress size={16} color="inherit" /> : <Save />
            }
            sx={{
              backgroundColor: '#e86161',
              '&:hover': { backgroundColor: '#d45151' },
            }}
          >
            {saving ? 'Saving…' : 'Save to Firebase'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default ChartSettingsEditor;

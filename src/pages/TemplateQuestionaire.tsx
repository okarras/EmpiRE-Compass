import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { darken } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

type TemplateSpec = any;
type Props = {
  templateSpec: TemplateSpec | null;
  answers: Record<string, any>;
  setAnswers: (next: Record<string, any>) => void;
};

const STORAGE_PREFIX = 'template_answers_v1_';
const debounce = (fn: (...a: any[]) => void, wait = 500) => {
  let t: any = 0;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

/* Buffered text field kept largely the same as yours */
const BufferedTextField: React.FC<{
  value: string;
  onCommit: (v: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  id?: string;
  placeholder?: string;
  debounceMs?: number;
  commitOnBlurOnly?: boolean;
}> = ({
  value,
  onCommit,
  size = 'small',
  fullWidth = true,
  id,
  placeholder,
  debounceMs = 500,
  commitOnBlurOnly = false,
}) => {
  const [local, setLocal] = useState<string>(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  useEffect(() => {
    if (commitOnBlurOnly) return;
    const t = setTimeout(() => {
      if ((value ?? '') !== local) onCommit(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, onCommit, debounceMs, value, commitOnBlurOnly]);

  return (
    <TextField
      id={id}
      size={size}
      fullWidth={fullWidth}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if ((value ?? '') !== local) onCommit(local);
      }}
      inputProps={{ 'aria-label': id }}
    />
  );
};

const Info: React.FC<{ desc?: string; label?: string }> = ({ desc, label }) =>
  desc ? (
    <Tooltip
      title={
        <Typography variant="body2" sx={{ maxWidth: 420 }}>
          {desc}
        </Typography>
      }
      arrow
      enterDelay={300}
      leaveDelay={50}
      enterTouchDelay={0}
      followCursor
    >
      <IconButton
        size="small"
        sx={{ ml: 0.5, p: 0.5, minWidth: 30 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <InfoOutlinedIcon fontSize="small" color="action" />
      </IconButton>
    </Tooltip>
  ) : null;

const isManySection = (sec: any) =>
  sec?.cardinality === 'many' ||
  sec?.cardinality === 'multiple' ||
  sec?.cardinality === 'one to many';

const INDENT_PX = 20; // horizontal indent per level
const DARKEN_STEP = 0.04; // amount to darken per level (0.0 - 1.0)
const MAX_DARKEN = 0.24; // clamp maximum darkening so it never becomes too dark

const NodeWrapper: React.FC<{
  level?: number;
  children?: React.ReactNode;
  sx?: any;
}> = ({ level = 0, children, sx }) => {
  const theme = useTheme();

  const base = theme.palette.background.paper;

  const rawAmount = level <= 0 ? 0 : Math.min(MAX_DARKEN, level * DARKEN_STEP);
  const bg = rawAmount > 0 ? darken(base, rawAmount) : 'transparent';

  const left = level * INDENT_PX;

  return (
    <Box sx={{ position: 'relative', pl: `${left}px`, ...sx }}>
      <Box
        sx={{
          backgroundColor: bg,
          borderRadius: 1,
          p: level === 0 ? 0 : 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

const TemplateQuestionaire: React.FC<Props> = ({
  templateSpec,
  answers,
  setAnswers,
}) => {
  const theme = useTheme();

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const setExpandedKey = (key: string, value: boolean) =>
    setExpandedMap((s) => ({ ...s, [key]: value }));
  const isExpandedKey = (key: string) => !!expandedMap[key];
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [validateList, setValidateList] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!templateSpec) return;
    const key =
      STORAGE_PREFIX +
      (templateSpec.template_id ?? templateSpec.template ?? 'default');
    const save = debounce((payload: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (e) {
        /* ignore */
      }
    }, 700);
    save({ answers });
  }, [answers, templateSpec]);

  useEffect(() => {
    if (!templateSpec) return;
    const key =
      STORAGE_PREFIX +
      (templateSpec.template_id ?? templateSpec.template ?? 'default');
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.answers) {
          const hasAny = Object.keys(answers || {}).length > 0;
          if (!hasAny) setAnswers(parsed.answers);
        }
      }
    } catch (e) {
      /* ignore */
    }
  }, [templateSpec]);

  const overwriteAnswers = useCallback(
    (next: Record<string, any>) => setAnswers(next),
    [setAnswers]
  );

  const setSingleAnswer = useCallback(
    (questionId: string, value: any) => {
      overwriteAnswers({ ...answers, [questionId]: value });
    },
    [answers, overwriteAnswers]
  );

  const addSectionEntry = useCallback(
    (section: any) => {
      const secId = section.id;
      const arr = Array.isArray(answers[secId]) ? [...answers[secId]] : [];
      const entry: Record<string, any> = {};
      (section.questions || []).forEach((q: any) => {
        if (q.type === 'multi_select') entry[q.id] = [];
        else if (q.type === 'repeat_group' || q.type === 'repeat_text')
          entry[q.id] = [];
        else entry[q.id] = '';
      });
      arr.push(entry);
      overwriteAnswers({ ...answers, [secId]: arr });
    },
    [answers, overwriteAnswers]
  );

  const removeSectionEntry = useCallback(
    (sectionId: string, idx: number) => {
      const arr = Array.isArray(answers[sectionId])
        ? [...answers[sectionId]]
        : [];
      arr.splice(idx, 1);
      overwriteAnswers({ ...answers, [sectionId]: arr });
    },
    [answers, overwriteAnswers]
  );

  const setSectionEntryValue = useCallback(
    (sectionId: string, idx: number, questionId: string, value: any) => {
      const arr = Array.isArray(answers[sectionId])
        ? [...answers[sectionId]]
        : [];
      const entry = { ...(arr[idx] ?? {}) };
      entry[questionId] = value;
      arr[idx] = entry;
      overwriteAnswers({ ...answers, [sectionId]: arr });
    },
    [answers, overwriteAnswers]
  );

  const exportAnswers = useCallback(() => {
    const payload = { answers, exported_at: new Date().toISOString() };
    const b = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateSpec?.template_id ?? 'answers'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [answers, templateSpec]);

  const FieldRow: React.FC<{
    children: React.ReactNode;
    label?: string;
    desc?: string;
  }> = ({ children, label, desc }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
          {label}
        </Box>
        <Info desc={desc} />
      </Box>
      <Box>{children}</Box>
    </Box>
  );

  const QuestionRenderer: React.FC<{
    q: any;
    value: any;
    onChange: (v: any) => void;
    idAttr?: string;
    level?: number;
  }> = ({ q, value, onChange, idAttr, level = 0 }) => {
    const commonLabel = q.label ?? q.title ?? '';
    const desc = q.desc ?? q.description ?? '';

    // TEXT / URL / default
    if (q.type === 'text' || q.type === 'url' || !q.type) {
      return (
        <NodeWrapper level={level}>
          <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
            <BufferedTextField
              id={idAttr}
              value={String(value ?? '')}
              onCommit={(v) => onChange(v)}
              size="small"
              fullWidth
              commitOnBlurOnly
              placeholder={q.placeholder ?? ''}
            />
          </FieldRow>
        </NodeWrapper>
      );
    }

    // single-select / boolean / text_object
    if (
      q.type === 'text_object' ||
      q.type === 'single_select' ||
      q.type === 'boolean'
    ) {
      const opts =
        q.options && q.options.length
          ? q.options
          : q.type === 'boolean'
            ? ['yes', 'no']
            : [];
      return (
        <NodeWrapper level={level}>
          <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
            <FormControl fullWidth size="small">
              <Select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                displayEmpty
                input={<OutlinedInput />}
              >
                {opts.map((opt: string) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FieldRow>
        </NodeWrapper>
      );
    }

    // multi_select
    if (q.type === 'multi_select') {
      const opts = q.options ?? [];
      return (
        <NodeWrapper level={level}>
          <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
            <FormControl fullWidth size="small">
              <Select
                multiple
                value={Array.isArray(value) ? value : []}
                onChange={(e) =>
                  onChange(
                    typeof e.target.value === 'string'
                      ? e.target.value.split(',')
                      : e.target.value
                  )
                }
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(selected as string[]).map((s) => (
                      <Chip key={s} label={s} size="small" />
                    ))}
                  </Box>
                )}
              >
                {opts.map((opt: string) => (
                  <MenuItem key={opt} value={opt}>
                    <Checkbox
                      checked={
                        Array.isArray(value) ? value.indexOf(opt) > -1 : false
                      }
                    />
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FieldRow>
        </NodeWrapper>
      );
    }

    // repeat_text
    if (q.type === 'repeat_text') {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <NodeWrapper level={level}>
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography variant="subtitle2">
                {q.label}
                {q.required ? ' *' : ''}
              </Typography>
              <Info desc={desc} />
            </Box>
            <Stack spacing={1}>
              {arr.map((v, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                  <BufferedTextField
                    id={`${idAttr ?? 'repeat_text'}-${i}`}
                    value={String(v ?? '')}
                    onCommit={(val) => {
                      const copy = [...arr];
                      copy[i] = val;
                      onChange(copy);
                    }}
                    size="small"
                    fullWidth
                    commitOnBlurOnly
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      const copy = [...arr];
                      copy.splice(i, 1);
                      onChange(copy);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange([...arr, '']);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </NodeWrapper>
      );
    }

    // repeat_group
    if (q.type === 'repeat_group') {
      const arr = Array.isArray(value) ? value : [];
      useEffect(() => {
        if (Array.isArray(value) && value.length === 0) {
          const initEntry = q.item_fields
            ? q.item_fields.reduce((acc: any, f: any) => {
                acc[f.id] = f.type === 'multi_select' ? [] : '';
                return acc;
              }, {})
            : {};
          onChange([initEntry]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [q.id]);

      return (
        <NodeWrapper level={level}>
          <Box sx={{ pl: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ ml: 0 }}>
                {q.label}
                {q.required ? ' *' : ''}
              </Typography>
              <Info desc={desc} />
            </Box>

            <Stack spacing={1}>
              {arr.map((item: any, idx: number) => {
                const key = `${idAttr ?? q.id}-entry-${idx}`;
                return (
                  <Accordion
                    key={idx}
                    expanded={isExpandedKey(key)}
                    onChange={(_e, val) => setExpandedKey(key, val)}
                    sx={{ boxShadow: 'none' }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {q.item_label ?? `Entry #${idx + 1}`}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const copy = [...arr];
                              copy.splice(idx, 1);
                              onChange(copy);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {(q.item_fields || []).map((f: any) => (
                          <QuestionRenderer
                            key={f.id}
                            q={f}
                            value={item[f.id]}
                            onChange={(nv) => {
                              const copy = [...arr];
                              copy[idx] = { ...(copy[idx] ?? {}), [f.id]: nv };
                              onChange(copy);
                            }}
                            idAttr={`${idAttr ?? q.id}-item-${idx}-f-${f.id}`}
                            level={level + 1}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              <Button
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange([
                    ...(arr || []),
                    q.item_fields
                      ? q.item_fields.reduce((acc: any, f: any) => {
                          acc[f.id] = f.type === 'multi_select' ? [] : '';
                          return acc;
                        }, {})
                      : '',
                  ]);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Add {q.item_label ?? 'item'}
              </Button>
            </Stack>
          </Box>
        </NodeWrapper>
      );
    }

    // group (collapsible subfields)
    if (q.type === 'group') {
      const obj = value ?? {};
      const key = `${idAttr ?? q.id}-group`;
      return (
        <NodeWrapper level={level}>
          <Accordion
            expanded={isExpandedKey(key)}
            onChange={(_e, val) => setExpandedKey(key, val)}
            sx={{ boxShadow: 'none', borderRadius: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -1.5 }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}
                >
                  {q.label ?? q.title}
                  {q.required ? ' *' : ''}
                </Typography>
                <Info desc={desc} />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'grid', gap: 1, pl: 1 }}>
                {(q.item_fields || q.subquestions || []).map((f: any) => (
                  <QuestionRenderer
                    key={f.id}
                    q={f}
                    value={obj[f.id]}
                    onChange={(nv) => onChange({ ...(obj ?? {}), [f.id]: nv })}
                    idAttr={`${idAttr ?? q.id}-g-${f.id}`}
                    level={level + 1}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </NodeWrapper>
      );
    }

    // fallback
    return (
      <NodeWrapper level={level}>
        <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
          <TextField
            size="small"
            fullWidth
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </FieldRow>
      </NodeWrapper>
    );
  };

  const toggleSection = (secId: string) =>
    setExpandedSection((cur) => (cur === secId ? null : secId));

  const renderSection = (sec: any, si: number) => {
    const many = isManySection(sec);
    const secKey = sec.id ?? String(si);

    const SectionHeaderRight = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip size="small" label={`${computeSectionProgress(sec)}`} />
        {many && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              addSectionEntry(sec);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Add
          </Button>
        )}
      </Box>
    );

    return (
      <Accordion
        key={secKey}
        expanded={expandedSection === secKey}
        onChange={() => toggleSection(secKey)}
        sx={{
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          boxShadow: 'none',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {sec.title}
              </Typography>
              {sec.desc ? (
                <Tooltip
                  title={
                    <Typography variant="body2" sx={{ maxWidth: 420 }}>
                      {sec.desc}
                    </Typography>
                  }
                  arrow
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.4, minWidth: 30 }}
                    aria-label={`Info for section ${sec.title}`}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>

            {SectionHeaderRight}
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          {!many && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {(sec.questions || []).map((q: any, qi: number) => {
                const val = answers[q.id];
                return (
                  <QuestionRenderer
                    key={q.id ?? qi}
                    q={q}
                    value={val}
                    onChange={(v) => setSingleAnswer(q.id, v)}
                    idAttr={`q-${q.id}`}
                    level={1}
                  />
                );
              })}
            </Box>
          )}

          {many && (
            <Stack spacing={2}>
              {Array.isArray(answers[sec.id]) &&
                answers[sec.id].length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No entries yet — click Add to start.
                  </Typography>
                )}

              {(Array.isArray(answers[sec.id]) ? answers[sec.id] : []).map(
                (entry: any, idx: number) => {
                  const entryKey = `${sec.id}-entry-${idx}`;
                  return (
                    <Accordion
                      key={`${sec.id}-${idx}`}
                      expanded={isExpandedKey(entryKey)}
                      onChange={(_e, val) => setExpandedKey(entryKey, val)}
                      sx={{ boxShadow: 'none' }}
                    >
                      <AccordionSummary>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            {sec.title} #{idx + 1}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSectionEntry(sec.id, idx);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'grid', gap: 1 }}>
                          {(sec.questions || []).map((q: any, qi: number) => {
                            const v = entry?.[q.id];
                            return (
                              <QuestionRenderer
                                key={q.id ?? qi}
                                q={q}
                                value={v}
                                onChange={(nv) =>
                                  setSectionEntryValue(sec.id, idx, q.id, nv)
                                }
                                idAttr={`sec-${sec.id}-entry-${idx}-q-${q.id}`}
                                level={1}
                              />
                            );
                          })}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                }
              )}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const computeSectionProgress = (sec: any) => {
    if (!sec) return '';

    const isEmptyPrimitive = (v: any) =>
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0);
    const countQuestion = (q: any, value: any): { t: number; a: number } => {
      if (!q) return { t: 0, a: 0 };

      const isStructural =
        q.type === 'group' ||
        q.type === 'repeat_group' ||
        q.type === 'repeat_text';
      if (isStructural && q.required === false) {
        return { t: 0, a: 0 };
      }

      // repeat_text
      if (q.type === 'repeat_text') {
        if (!q.required) return { t: 0, a: 0 };
        const t = 1;
        const a = Array.isArray(value) && value.length > 0 ? 1 : 0;
        return { t, a };
      }

      // repeat_group
      if (q.type === 'repeat_group') {
        let t = 0;
        let a = 0;
        const arr = Array.isArray(value) ? value : [];
        if (arr.length > 0 && Array.isArray(q.item_fields)) {
          q.item_fields.forEach((f: any) => {
            if (f?.required) {
              arr.forEach((item: any) => {
                if (
                  f.type === 'group' ||
                  f.type === 'repeat_group' ||
                  f.type === 'repeat_text'
                ) {
                  const { t: nt, a: na } = countQuestion(f, item?.[f.id]);
                  t += nt;
                  a += na;
                } else {
                  t += 1;
                  const fv = item?.[f.id];
                  if (!isEmptyPrimitive(fv)) a += 1;
                }
              });
            } else {
              if (f.type === 'group' || f.type === 'repeat_group') {
                arr.forEach((item: any) => {
                  const { t: nt, a: na } = countQuestion(f, item?.[f.id]);
                  t += nt;
                  a += na;
                });
              }
            }
          });
        }
        return { t, a };
      }

      if (q.type === 'group') {
        const fields = q.item_fields ?? q.subquestions ?? [];
        let t = 0;
        let a = 0;
        fields.forEach((f: any) => {
          const fv = value ? value[f.id] : undefined;
          const { t: ft, a: fa } = countQuestion(f, fv);
          t += ft;
          a += fa;
        });
        return { t, a };
      }

      if (q.required) {
        const t = 1;
        const a = !isEmptyPrimitive(value) ? 1 : 0;
        return { t, a };
      }

      return { t: 0, a: 0 };
    };

    const many = isManySection(sec);
    let total = 0;
    let answered = 0;

    if (!many) {
      (sec.questions || []).forEach((q: any) => {
        const v = answers[q.id];
        const { t, a } = countQuestion(q, v);
        total += t;
        answered += a;
      });
    } else {
      const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
      const sectionHasRequired = (sec.questions || []).some(
        (q: any) => q.required
      );
      total = sectionHasRequired ? 1 : 0;
      if (sectionHasRequired && arr.length > 0) answered = 1;

      if (arr.length > 0) {
        arr.forEach((entry: any) => {
          (sec.questions || []).forEach((q: any) => {
            const entryValue = entry?.[q.id];
            const { t, a } = countQuestion(q, entryValue);
            total += t;
            answered += a;
          });
        });
      }
    }

    return `${answered}/${total}`;
  };

  const requiredSummary = useMemo(() => {
    if (!templateSpec)
      return { totalRequired: 0, answeredRequired: 0, perSection: [] as any[] };

    // helper: check if a primitive value is answered
    const isAnsweredPrimitive = (val: any) => {
      if (val === undefined || val === null) return false;
      if (Array.isArray(val)) return val.length > 0;
      return String(val).trim() !== '';
    };

    const countQuestion = (q: any, value: any): { t: number; a: number } => {
      if (!q) return { t: 0, a: 0 };

      const isStructural =
        q.type === 'group' ||
        q.type === 'repeat_group' ||
        q.type === 'repeat_text';
      if (isStructural && q.required === false) {
        return { t: 0, a: 0 };
      }

      if (q.type === 'repeat_text') {
        if (!q.required) return { t: 0, a: 0 };
        const t = 1;
        const a = Array.isArray(value) && value.length > 0 ? 1 : 0;
        return { t, a };
      }

      if (q.type === 'repeat_group') {
        let t = 0;
        let a = 0;
        const arr = Array.isArray(value) ? value : [];

        if (arr.length > 0 && Array.isArray(q.item_fields)) {
          q.item_fields.forEach((f: any) => {
            if (f?.required) {
              arr.forEach((item: any) => {
                if (
                  f.type === 'group' ||
                  f.type === 'repeat_group' ||
                  f.type === 'repeat_text'
                ) {
                  const { t: nt, a: na } = countQuestion(f, item?.[f.id]);
                  t += nt;
                  a += na;
                } else {
                  t += 1;
                  const fv = item?.[f.id];
                  if (isAnsweredPrimitive(fv)) a += 1;
                }
              });
            } else {
              if (f.type === 'group' || f.type === 'repeat_group') {
                arr.forEach((item: any) => {
                  const { t: nt, a: na } = countQuestion(f, item?.[f.id]);
                  t += nt;
                  a += na;
                });
              }
            }
          });
        }

        return { t, a };
      }

      if (q.type === 'group') {
        const fields = q.item_fields ?? q.subquestions ?? [];
        let t = 0;
        let a = 0;
        fields.forEach((f: any) => {
          const fv = value ? value[f.id] : undefined;
          const { t: ft, a: fa } = countQuestion(f, fv);
          t += ft;
          a += fa;
        });
        return { t, a };
      }

      if (q.required) {
        const t = 1;
        const a = isAnsweredPrimitive(value) ? 1 : 0;
        return { t, a };
      }
      return { t: 0, a: 0 };
    };

    let total = 0;
    let answered = 0;
    const perSection: { sectionId: string; total: number; answered: number }[] =
      [];

    (templateSpec.sections || []).forEach((sec: any) => {
      let sTotal = 0;
      let sAnswered = 0;
      const many = isManySection(sec);

      if (!many) {
        (sec.questions || []).forEach((q: any) => {
          const v = answers[q.id];
          const { t, a } = countQuestion(q, v);
          sTotal += t;
          sAnswered += a;
        });
      } else {
        const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
        const sectionHasRequired = (sec.questions || []).some(
          (q: any) => q.required
        );
        if (sectionHasRequired) {
          sTotal += 1;
          if (arr.length > 0) sAnswered += 1;
        }

        if (arr.length > 0) {
          arr.forEach((entry: any) => {
            (sec.questions || []).forEach((q: any) => {
              const entryValue = entry?.[q.id];
              const { t, a } = countQuestion(q, entryValue);
              sTotal += t;
              sAnswered += a;
            });
          });
        }
      }

      total += sTotal;
      answered += sAnswered;
      perSection.push({
        sectionId: sec.id,
        total: sTotal,
        answered: sAnswered,
      });
    });

    return { totalRequired: total, answeredRequired: answered, perSection };
  }, [templateSpec, answers]);

  const computeMissing = useCallback(() => {
    const missing: Array<{ id: string; label: string }> = [];
    if (!templateSpec) return missing;

    const isEmptyPrimitive = (v: any) =>
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0);

    const collectMissing = (
      q: any,
      value: any,
      pathLabel: string,
      idPrefix: string
    ): Array<{ id: string; label: string }> => {
      const out: Array<{ id: string; label: string }> = [];
      if (!q) return out;

      const isStructural =
        q.type === 'group' ||
        q.type === 'repeat_group' ||
        q.type === 'repeat_text';
      if (isStructural && q.required === false) return out;

      if (q.type === 'repeat_text') {
        if (q.required) {
          if (!Array.isArray(value) || value.length === 0) {
            out.push({
              id: `${idPrefix}-${q.id}`,
              label: `${pathLabel} → ${q.label}`,
            });
          }
        }
        return out;
      }

      if (q.type === 'group') {
        const fields = q.item_fields ?? q.subquestions ?? [];
        fields.forEach((f: any) => {
          const fv = value ? value[f.id] : undefined;
          out.push(
            ...collectMissing(
              f,
              fv,
              `${pathLabel} → ${q.label}`,
              `${idPrefix}-${q.id}`
            )
          );
        });
        return out;
      }
      if (q.type === 'repeat_group') {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length === 0) {
          return out;
        }
        arr.forEach((item: any, idx: number) => {
          (q.item_fields || []).forEach((f: any) => {
            if (!f) return;
            if (
              f.type === 'group' ||
              f.type === 'repeat_group' ||
              f.type === 'repeat_text'
            ) {
              const nestedValue = item?.[f.id];
              out.push(
                ...collectMissing(
                  f,
                  nestedValue,
                  `${pathLabel} → ${q.label} #${idx + 1}`,
                  `${idPrefix}-${q.id}-item-${idx}`
                )
              );
            } else {
              if (f.required) {
                const fv = item?.[f.id];
                if (isEmptyPrimitive(fv)) {
                  out.push({
                    id: `${idPrefix}-${q.id}-item-${idx}-f-${f.id}`,
                    label: `${pathLabel} → ${q.label} #${idx + 1} → ${f.label}`,
                  });
                }
              }
            }
          });
        });
        return out;
      }

      if (q.required) {
        if (isEmptyPrimitive(value)) {
          out.push({
            id: `${idPrefix}-${q.id}`,
            label: `${pathLabel} → ${q.label}`,
          });
        }
      }

      return out;
    };

    (templateSpec.sections || []).forEach((sec: any) => {
      const many = isManySection(sec);

      if (!many) {
        (sec.questions || []).forEach((q: any) => {
          const v = answers[q.id];
          missing.push(...collectMissing(q, v, `${sec.title}`, `q-${q.id}`));
        });
      } else {
        const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
        const sectionHasRequired = (sec.questions || []).some(
          (q: any) => q.required
        );
        if (sectionHasRequired && arr.length === 0) {
          missing.push({
            id: `sec-${sec.id}`,
            label: `${sec.title} → at least one entry required`,
          });
        }

        arr.forEach((entry: any, idx: number) => {
          (sec.questions || []).forEach((q: any) => {
            const entryValue = entry?.[q.id];
            missing.push(
              ...collectMissing(
                q,
                entryValue,
                `${sec.title} #${idx + 1}`,
                `sec-${sec.id}-entry-${idx}-q-${q.id}`
              )
            );
          });
        });
      }
    });

    return missing;
  }, [templateSpec, answers]);

  const missing = computeMissing();

  const handleValidate = () => {
    const m = computeMissing();
    setValidateList(m);
    setValidateDialogOpen(true);
  };

  if (!templateSpec) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography>Loading template…</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Top sticky summary bar */}
      <Box sx={{ position: 'sticky', top: 8, zIndex: 1400 }}>
        <Paper variant="outlined" sx={{ p: 1, mx: 0, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {templateSpec?.template ?? 'Template'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {templateSpec?.version ? `v${templateSpec.version}` : ''}
              </Typography>
            </Box>

            <Chip
              icon={<CheckCircleOutlineIcon />}
              label={`${requiredSummary.answeredRequired}/${requiredSummary.totalRequired} required`}
              variant="outlined"
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportAnswers}
              >
                Export
              </Button>
              <Button
                size="small"
                color={missing.length ? 'error' : 'primary'}
                variant="contained"
                onClick={handleValidate}
              >
                Validate {missing.length > 0 ? `(${missing.length})` : ''}
              </Button>
            </Box>
          </Box>
        </Paper>
        {/* Validate dialog — single centered box */}
        <Dialog
          open={validateDialogOpen}
          onClose={() => setValidateDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          aria-labelledby="validate-dialog-title"
        >
          <DialogTitle id="validate-dialog-title">
            {validateList.length === 0
              ? 'All set'
              : `Missing required fields (${validateList.length})`}
          </DialogTitle>

          <DialogContent dividers>
            {validateList.length === 0 ? (
              <Typography>All required fields are filled.</Typography>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {validateList.slice(0, 200).map((it) => (
                  <ListItem key={it.id} divider>
                    <ListItemText primary={it.label} />
                  </ListItem>
                ))}
                {validateList.length > 200 && (
                  <ListItem>
                    <ListItemText
                      primary={`...and ${validateList.length - 200} more`}
                    />
                  </ListItem>
                )}
              </List>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setValidateDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box>
            {(templateSpec?.sections || []).map((sec: any, si: number) => (
              <Box id={`section-${si}`} key={sec.id ?? si} sx={{ mb: 3 }}>
                {renderSection(sec, si)}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <style>{`
        .validation-flash {
          animation: validationFlash 1.0s ease;
        }
        @keyframes validationFlash {
          0% { box-shadow: 0 0 0 0 rgba(255,0,0,0.0); }
          30% { box-shadow: 0 0 10px 3px rgba(255,0,0,0.18); }
          100% { box-shadow: 0 0 0 0 rgba(255,0,0,0.0); }
        }
      `}</style>
    </Box>
  );
};

export default TemplateQuestionaire;

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
  Grid,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

type TemplateSpec = any;

type Props = {
  templateSpec: TemplateSpec | null;
  answers: Record<string, any>;
  setAnswers: (next: Record<string, any>) => void;
};

const STORAGE_PREFIX = 'template_answers_v1_';
const debounce = (fn: (...args: any[]) => void, wait = 500) => {
  let t: any = 0;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

const isManySection = (sec: any) =>
  sec?.cardinality === 'many' ||
  sec?.cardinality === 'multiple' ||
  sec?.cardinality === 'one to many';

const TemplateQuestionaire: React.FC<Props> = ({
  templateSpec,
  answers,
  setAnswers,
}) => {
  const theme = useTheme();

  // only a single expanded section at a time
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
        // ignore
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
      // ignore
    }
  }, [templateSpec]);

  const overwriteAnswers = useCallback(
    (next: Record<string, any>) => {
      setAnswers(next);
    },
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

  const GroupBlock: React.FC<{
    q: any;
    value: any;
    onChange: (v: any) => void;
    idAttr?: string;
  }> = ({ q, value, onChange, idAttr }) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const obj = value ?? {};
    const fields = q.item_fields || q.subquestions || [];
    return (
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((s) => !s)}
        sx={{ boxShadow: 'none', borderRadius: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {q.label}
              {q.required ? ' *' : ''}
            </Typography>
            {q.desc ? (
              <Tooltip
                title={
                  <Typography variant="body2" sx={{ maxWidth: 420 }}>
                    {q.desc}
                  </Typography>
                }
                arrow
              >
                <IconButton
                  size="small"
                  sx={{ p: 0.4, minWidth: 30 }}
                  aria-label={`Info for ${q.label}`}
                >
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            {fields.map((f: any) => (
              <Grid item xs={12} key={f.id}>
                <QuestionRenderer
                  q={f}
                  value={obj[f.id]}
                  onChange={(nv) => onChange({ ...(obj ?? {}), [f.id]: nv })}
                  idAttr={`${idAttr ?? q.id}-g-${f.id}`}
                />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const RepeatGroupBlock: React.FC<{
    q: any;
    value: any;
    onChange: (v: any) => void;
    idAttr?: string;
  }> = ({ q, value, onChange, idAttr }) => {
    const [expandedIndex, setExpandedIndex] = useState<Record<number, boolean>>(
      {}
    );
    const arr = Array.isArray(value) ? value : [];
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2">
            {q.label}
            {q.required ? ' *' : ''}
          </Typography>
          {q.desc ? (
            <Tooltip
              title={
                <Typography variant="body2" sx={{ maxWidth: 420 }}>
                  {q.desc}
                </Typography>
              }
              arrow
            >
              <IconButton
                aria-label={`Info for ${q.label}`}
                size="small"
                sx={{ p: 0.4, minWidth: 30 }}
              >
                <InfoOutlinedIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>

        <Stack spacing={1}>
          {arr.map((item: any, idx: number) => (
            <Accordion
              key={idx}
              expanded={!!expandedIndex[idx]}
              onChange={() =>
                setExpandedIndex((s) => ({ ...s, [idx]: !s[idx] }))
              }
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
                  <Typography variant="subtitle2">
                    {q.label} #{idx + 1}
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
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {(q.item_fields || []).map((f: any) => (
                    <Grid item xs={12} key={f.id}>
                      <QuestionRenderer
                        q={f}
                        value={item[f.id]}
                        onChange={(nv) => {
                          const copy = [...arr];
                          copy[idx] = { ...(copy[idx] ?? {}), [f.id]: nv };
                          onChange(copy);
                        }}
                        idAttr={`${idAttr ?? q.id}-item-${idx}-f-${f.id}`}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
          <Button
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() =>
              onChange([
                ...(arr || []),
                q.item_fields
                  ? q.item_fields.reduce((acc: any, f: any) => {
                      acc[f.id] = f.type === 'multi_select' ? [] : '';
                      return acc;
                    }, {})
                  : '',
              ])
            }
          >
            Add {q.item_label ?? 'item'}
          </Button>
        </Stack>
      </Box>
    );
  };

  const QuestionRenderer: React.FC<{
    q: any;
    value: any;
    onChange: (v: any) => void;
    error?: boolean;
    idAttr?: string;
  }> = ({ q, value, onChange, error, idAttr }) => {
    const commonLabelText = q.label + (q.required ? ' *' : '');
    const desc = q.desc ?? q.description ?? '';

    const LabelNodeText = (
      <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
        {commonLabelText}
      </Box>
    );

    const tooltipProps = {
      enterDelay: 300,
      leaveDelay: 50,
      enterTouchDelay: 0,
      followCursor: true as const,
    };

    const InfoIconButton = desc ? (
      <Tooltip
        title={
          <Typography variant="body2" sx={{ maxWidth: 420 }}>
            {desc}
          </Typography>
        }
        arrow
        {...tooltipProps}
      >
        <IconButton
          aria-label={`Info for ${q.label}`}
          size="small"
          sx={{ ml: 0.5, p: 0.5, minWidth: 30 }}
        >
          <InfoOutlinedIcon fontSize="small" color="action" />
        </IconButton>
      </Tooltip>
    ) : null;

    // TEXT / URL / default
    if (q.type === 'text' || q.type === 'url' || !q.type) {
      return (
        <Box
          id={idAttr}
          sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {LabelNodeText}
            {InfoIconButton}
          </Box>

          <TextField
            size="small"
            fullWidth
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </Box>
      );
    }

    // text_object / single-select / boolean
    if (
      q.type === 'text_object' ||
      q.type === 'single_select' ||
      q.type === 'boolean'
    ) {
      const opts =
        q.options && q.options.length > 0
          ? q.options
          : q.type === 'boolean'
            ? ['yes', 'no']
            : [];
      return (
        <Box
          id={idAttr}
          sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {LabelNodeText}
            {InfoIconButton}
          </Box>

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
        </Box>
      );
    }

    // multi_select
    if (q.type === 'multi_select') {
      const opts = q.options ?? [];
      return (
        <Box
          id={idAttr}
          sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {LabelNodeText}
            {InfoIconButton}
          </Box>

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
        </Box>
      );
    }

    // repeat_text
    if (q.type === 'repeat_text') {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <Box id={idAttr}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2">
              {q.label}
              {q.required ? ' *' : ''}
            </Typography>
            {desc ? (
              <Tooltip
                title={
                  <Typography variant="body2" sx={{ maxWidth: 420 }}>
                    {desc}
                  </Typography>
                }
                arrow
                {...tooltipProps}
              >
                <IconButton
                  aria-label={`Info for ${q.label}`}
                  size="small"
                  sx={{ p: 0.5, minWidth: 30 }}
                >
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>

          <Stack spacing={1}>
            {arr.map((v, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={v}
                  onChange={(e) => {
                    const copy = [...arr];
                    copy[i] = e.target.value;
                    onChange(copy);
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    const copy = [...arr];
                    copy.splice(i, 1);
                    onChange(copy);
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => onChange([...arr, ''])}
            >
              Add
            </Button>
          </Stack>
        </Box>
      );
    }

    if (q.type === 'repeat_group') {
      return (
        <RepeatGroupBlock
          q={q}
          value={value}
          onChange={onChange}
          idAttr={idAttr}
        />
      );
    }

    if (q.type === 'group') {
      return (
        <GroupBlock q={q} value={value} onChange={onChange} idAttr={idAttr} />
      );
    }

    return (
      <Box id={idAttr}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {LabelNodeText}
          {InfoIconButton}
        </Box>
        <TextField
          size="small"
          fullWidth
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </Box>
    );
  };

  const toggleSection = (secId: string) => {
    // make sure only one section expanded at a time
    setExpandedSection((cur) => (cur === secId ? null : secId));
  };

  const renderSection = (sec: any, si: number) => {
    const many = isManySection(sec);
    const secKey = sec.id ?? String(si);

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
                  >
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip size="small" label={`${computeSectionProgress(sec)}`} />
              {many && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    addSectionEntry(sec);
                  }}
                >
                  Add
                </Button>
              )}
            </Box>
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          {!many && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(sec.questions || []).map((q: any, qi: number) => {
                const val = answers[q.id];
                const onChange = (v: any) => setSingleAnswer(q.id, v);
                const qDomId = `q-${q.id}`;

                return (
                  <Box key={q.id ?? qi}>
                    <QuestionRenderer
                      q={q}
                      value={val}
                      onChange={onChange}
                      idAttr={qDomId}
                    />
                  </Box>
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
                (entry: any, idx: number) => (
                  <Accordion
                    key={`${sec.id}-${idx}`}
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
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={1}>
                        {(sec.questions || []).map((q: any, qi: number) => {
                          const v = entry?.[q.id];
                          const setter = (nv: any) =>
                            setSectionEntryValue(sec.id, idx, q.id, nv);
                          const qDomId = `sec-${sec.id}-entry-${idx}-q-${q.id}`;
                          return (
                            <Grid item xs={12} key={q.id ?? qi}>
                              <QuestionRenderer
                                q={q}
                                value={v}
                                onChange={setter}
                                idAttr={qDomId}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )
              )}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const computeSectionProgress = (sec: any) => {
    const many = isManySection(sec);
    if (!sec) return '';
    let total = 0;
    let answered = 0;
    if (!many) {
      (sec.questions || []).forEach((q: any) => {
        if (q.required) {
          total += 1;
          const v = answers[q.id];
          if (
            v !== undefined &&
            v !== null &&
            String(v).trim() !== '' &&
            !(Array.isArray(v) && v.length === 0)
          )
            answered += 1;
        }
      });
    } else {
      const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
      const sectionHasRequired = (sec.questions || []).some(
        (q: any) => q.required
      );
      total = sectionHasRequired ? 1 : 0;
      if (sectionHasRequired && arr.length > 0) answered = 1;
    }
    return `${answered}/${total}`;
  };

  const requiredSummary = useMemo(() => {
    if (!templateSpec)
      return { totalRequired: 0, answeredRequired: 0, perSection: [] as any[] };
    let total = 0;
    let answered = 0;
    const perSection: { sectionId: string; total: number; answered: number }[] =
      [];

    (templateSpec.sections || []).forEach((sec: any) => {
      let sTotal = 0;
      let sAnswered = 0;

      const many = isManySection(sec);
      const countQuestion = (q: any, value: any) => {
        if (!q?.required) return { t: 0, a: 0 };
        const t = 1;
        let a = 0;
        if (q.type === 'repeat_group' || q.type === 'repeat_text') {
          if (Array.isArray(value) && value.length > 0) a = 1;
        } else {
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
          )
            a = 1;
        }
        return { t, a };
      };

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
          if (arr && arr.length > 0) sAnswered += 1;
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

  // compute missing
  const computeMissing = useCallback(() => {
    const missing: Array<{ id: string; label: string }> = [];
    if (!templateSpec) return missing;

    (templateSpec.sections || []).forEach((sec: any) => {
      const many = isManySection(sec);

      if (!many) {
        (sec.questions || []).forEach((q: any) => {
          const val = answers[q.id];
          const empty =
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '') ||
            (Array.isArray(val) && val.length === 0);
          if (q.required && empty) {
            missing.push({
              id: `q-${q.id}`,
              label: `${sec.title} → ${q.label}`,
            });
          }
          if (q.type === 'repeat_group' && q.required) {
            const arr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
            if (arr.length === 0) {
              missing.push({
                id: `q-${q.id}`,
                label: `${sec.title} → ${q.label} (at least 1 item)`,
              });
            } else {
              arr.forEach((item: any, idx: number) => {
                (q.item_fields || []).forEach((f: any) => {
                  if (f.required) {
                    const fv = item?.[f.id];
                    const fEmpty =
                      fv === undefined ||
                      fv === null ||
                      (typeof fv === 'string' && fv.trim() === '') ||
                      (Array.isArray(fv) && fv.length === 0);
                    if (fEmpty) {
                      missing.push({
                        id: `q-${q.id}-item-${idx}-f-${f.id}`,
                        label: `${sec.title} → ${q.label} #${idx + 1} → ${f.label}`,
                      });
                    }
                  }
                });
              });
            }
          }
        });
      } else {
        const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
        const sectionHasRequired = (sec.questions || []).some(
          (q: any) => q.required
        );
        if (sectionHasRequired && arr.length === 0)
          missing.push({
            id: `sec-${sec.id}`,
            label: `${sec.title} → at least one entry required`,
          });
        arr.forEach((entry: any, idx: number) => {
          (sec.questions || []).forEach((q: any) => {
            if (q.required) {
              const v = entry?.[q.id];
              const empty =
                v === undefined ||
                v === null ||
                (typeof v === 'string' && v.trim() === '') ||
                (Array.isArray(v) && v.length === 0);
              if (empty)
                missing.push({
                  id: `sec-${sec.id}-entry-${idx}-q-${q.id}`,
                  label: `${sec.title} #${idx + 1} → ${q.label}`,
                });
            }
            if (q.type === 'repeat_group' && q.required) {
              const arr2 = Array.isArray(entry?.[q.id]) ? entry[q.id] : [];
              if (arr2.length === 0)
                missing.push({
                  id: `sec-${sec.id}-entry-${idx}-q-${q.id}`,
                  label: `${sec.title} #${idx + 1} → ${q.label} (at least 1)`,
                });
              else {
                arr2.forEach((it: any, j: number) => {
                  (q.item_fields || []).forEach((f: any) => {
                    if (f.required) {
                      const fv = it?.[f.id];
                      const fEmpty =
                        fv === undefined ||
                        fv === null ||
                        (typeof fv === 'string' && fv.trim() === '') ||
                        (Array.isArray(fv) && fv.length === 0);
                      if (fEmpty)
                        missing.push({
                          id: `sec-${sec.id}-entry-${idx}-q-${q.id}-item-${j}-f-${f.id}`,
                          label: `${sec.title} #${idx + 1} → ${q.label} #${j + 1} → ${f.label}`,
                        });
                    }
                  });
                });
              }
            }
          });
        });
      }
    });

    return missing;
  }, [templateSpec, answers]);

  const missing = computeMissing();

  const handleValidate = () => {
    const m = computeMissing();
    const newExpanded: Record<string, boolean> = {};
    m.forEach((mm) => {
      (templateSpec.sections || []).forEach((sec: any) => {
        if ((mm.label ?? '').startsWith(sec.title))
          newExpanded[sec.id ?? String(sec.title)] = true;
      });
    });
    // open only first matching missing section
    const firstKey = Object.keys(newExpanded)[0] ?? null;
    setExpandedSection(firstKey);

    if (m.length === 0) {
      alert('All required fields are filled.');
    } else {
      const list = m
        .slice(0, 30)
        .map((x) => `• ${x.label}`)
        .join('\n');
      alert(
        `Missing required fields:\n\n${list}${m.length > 30 ? `\n\n...and ${m.length - 30} more` : ''}`
      );
    }
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
                {templateSpec?.version ? `v${templateSpec.version}` : ''}{' '}
                {/* {templateSpec?.template_id ? ` • ${templateSpec.template_id}` : ''} */}
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

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Required answered: {requiredSummary.answeredRequired}/
              {requiredSummary.totalRequired}
            </Typography>
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

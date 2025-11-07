import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

import SectionAccordion from '../components/TemplateQuestionaire/SectionAccordion';
import TopSummaryBar from '../components/TemplateQuestionaire/TopSummaryBar';
import ValidateDialog from '../components/TemplateQuestionaire/ValidateDialog';

/* types & constants */
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

const isManySection = (sec: any) =>
  sec?.cardinality === 'many' ||
  sec?.cardinality === 'multiple' ||
  sec?.cardinality === 'one to many';

const TemplateQuestionaire: React.FC<Props> = ({
  templateSpec,
  answers,
  setAnswers,
}) => {
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
      <Box sx={{ position: 'sticky', top: 8, zIndex: 1400 }}>
        <TopSummaryBar
          templateSpec={templateSpec}
          requiredSummary={requiredSummary}
          exportAnswers={exportAnswers}
          missingCount={missing.length}
          onValidate={handleValidate}
        />
        <ValidateDialog
          open={validateDialogOpen}
          onClose={() => setValidateDialogOpen(false)}
          validateList={validateList}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Box>
            {(templateSpec?.sections || []).map((sec: any, si: number) => (
              <Box id={`section-${si}`} key={sec.id ?? si} sx={{ mb: 3 }}>
                <SectionAccordion
                  sec={sec}
                  si={si}
                  answers={answers}
                  expandedSection={expandedSection}
                  toggleSection={(s) =>
                    setExpandedSection((cur) => (cur === s ? null : s))
                  }
                  computeSectionProgress={computeSectionProgress}
                  addSectionEntry={addSectionEntry}
                  removeSectionEntry={removeSectionEntry}
                  setSingleAnswer={setSingleAnswer}
                  setSectionEntryValue={setSectionEntryValue}
                  isManySection={isManySection}
                  setExpandedKey={setExpandedKey}
                  isExpandedKey={isExpandedKey}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TemplateQuestionaire;

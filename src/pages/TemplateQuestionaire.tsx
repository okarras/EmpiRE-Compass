import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Snackbar, Alert } from '@mui/material';

import SectionAccordion from '../components/TemplateQuestionaire/SectionAccordion';
import TopSummaryBar from '../components/TemplateQuestionaire/TopSummaryBar';
import ImportDialog from '../components/TemplateQuestionaire/ImportDialog';
import { parseValidationRules, validateValue } from '../utils/validationRules';
import {
  useAIService,
  type AIVerificationResult,
} from '../services/backendAIService';
import type { StructuredDocument } from '../utils/structuredPdfExtractor';

/* types & constants */
type TemplateSpec = any;
type Props = {
  templateSpec: TemplateSpec | null;
  answers: Record<string, any>;
  setAnswers: (next: Record<string, any>) => void;
  pdfContent?: string;
  structuredDocument?: StructuredDocument | null;
  onNavigateToPage?: (pageNumber: number) => void;
  pdfExtractionError?: Error | null;
  onRetryExtraction?: () => void;
  onHighlightsChange?: (
    highlights: Record<
      number,
      { left: number; top: number; width: number; height: number }[]
    >
  ) => void;
  pdfUrl?: string | null;
  pageWidth?: number | null;
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
  pdfContent,
  structuredDocument,
  onNavigateToPage,
  pdfExtractionError,
  onRetryExtraction,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
}) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const setExpandedKey = (key: string, value: boolean) =>
    setExpandedMap((s) => ({ ...s, [key]: value }));
  const isExpandedKey = (key: string) => !!expandedMap[key];

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importData, setImportData] = useState<Record<string, any> | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isValidatingImport, setIsValidatingImport] = useState(false);
  const [importSnackbar, setImportSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const aiService = useAIService();
  type ExtendedAIVerificationResult = Omit<AIVerificationResult, 'status'> & {
    status: 'pending' | 'verified' | 'needs_improvement' | 'error';
  };

  const [aiVerifications, setAiVerifications] = useState<
    Record<string, ExtendedAIVerificationResult>
  >({});
  const [aiVerificationStatus, setAiVerificationStatus] = useState<
    'not_started' | 'in_progress' | 'complete'
  >('not_started');

  const questionRefs = React.useRef<Record<string, HTMLElement | null>>({});

  const handleRegisterQuestionRef = useCallback(
    (questionId: string, element: HTMLElement | null) => {
      questionRefs.current[questionId] = element;
    },
    []
  );

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

  const handleImportConfirm = useCallback(
    (mode: 'replace' | 'merge') => {
      if (!importData) {
        setImportSnackbar({
          open: true,
          message: 'Import failed: No data to import',
          severity: 'error',
        });
        return;
      }

      try {
        const importedCount = Object.keys(importData).length;
        const existingCount = Object.keys(answers).length;

        if (mode === 'replace') {
          overwriteAnswers(importData);

          let message = `Successfully imported ${importedCount} answer field${importedCount !== 1 ? 's' : ''}`;
          if (existingCount > 0) {
            message += ` (replaced ${existingCount} existing field${existingCount !== 1 ? 's' : ''})`;
          }

          setImportSnackbar({
            open: true,
            message,
            severity: 'success',
          });
        } else {
          const mergedAnswers = { ...answers, ...importData };
          const newFieldsCount =
            importedCount -
            Object.keys(answers).filter((key) => key in importData).length;
          const updatedFieldsCount = importedCount - newFieldsCount;

          overwriteAnswers(mergedAnswers);

          let message = `Successfully merged ${importedCount} answer field${importedCount !== 1 ? 's' : ''}`;
          if (newFieldsCount > 0 && updatedFieldsCount > 0) {
            message += ` (${newFieldsCount} new, ${updatedFieldsCount} updated)`;
          } else if (newFieldsCount > 0) {
            message += ` (${newFieldsCount} new field${newFieldsCount !== 1 ? 's' : ''})`;
          } else if (updatedFieldsCount > 0) {
            message += ` (${updatedFieldsCount} field${updatedFieldsCount !== 1 ? 's' : ''} updated)`;
          }

          setImportSnackbar({
            open: true,
            message,
            severity: 'success',
          });
        }

        setImportDialogOpen(false);
        setImportData(null);
        setImportFileName('');
        setImportError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during import';

        setImportSnackbar({
          open: true,
          message: `Import failed: ${errorMessage}`,
          severity: 'error',
        });

        console.error('Import error:', error);
      }
    },
    [importData, answers, overwriteAnswers]
  );

  const validateImportData = useCallback(
    (
      data: any
    ): {
      valid: boolean;
      error: string | null;
      answers: Record<string, any> | null;
    } => {
      if (data === null || data === undefined) {
        return {
          valid: false,
          error: 'Invalid JSON file: File is empty or contains null data',
          answers: null,
        };
      }

      if (typeof data !== 'object') {
        return {
          valid: false,
          error: `Invalid JSON file: Expected an object, but got ${typeof data}`,
          answers: null,
        };
      }

      if (Array.isArray(data)) {
        return {
          valid: false,
          error:
            'Invalid JSON file: Root element must be an object, not an array. Expected format: {"answers": {...}} or direct answer object',
          answers: null,
        };
      }

      const importedAnswers = data.answers || data;

      if (!importedAnswers || typeof importedAnswers !== 'object') {
        return {
          valid: false,
          error:
            'Invalid JSON file: Could not find valid answers data. Expected an object with answer fields',
          answers: null,
        };
      }

      if (Array.isArray(importedAnswers)) {
        return {
          valid: false,
          error:
            'Invalid JSON file: Answers must be an object with field IDs as keys, not an array',
          answers: null,
        };
      }

      const keys = Object.keys(importedAnswers);
      if (keys.length === 0) {
        return {
          valid: false,
          error:
            'Invalid JSON file: No answer fields found. The file appears to be empty',
          answers: null,
        };
      }

      let hasValidData = false;
      let invalidKeys: string[] = [];

      for (const key of keys) {
        const value = importedAnswers[key];
        if (
          value !== undefined &&
          typeof value !== 'function' &&
          typeof value !== 'symbol'
        ) {
          hasValidData = true;
        } else if (typeof value === 'function') {
          invalidKeys.push(key);
        }
      }

      if (invalidKeys.length > 0) {
        return {
          valid: false,
          error: `Invalid JSON file: Found invalid data types in fields: ${invalidKeys.slice(0, 3).join(', ')}${invalidKeys.length > 3 ? '...' : ''}`,
          answers: null,
        };
      }

      if (!hasValidData) {
        return {
          valid: false,
          error:
            'Invalid JSON file: No valid answer data found. All fields appear to be empty or invalid',
          answers: null,
        };
      }

      return {
        valid: true,
        error: null,
        answers: importedAnswers,
      };
    },
    []
  );

  const importAnswers = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.json')) {
        setImportFileName(file.name);
        setImportError('Invalid file type: Please select a JSON file (.json)');
        setIsValidatingImport(false);
        setImportData(null);
        setImportDialogOpen(true);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setImportFileName(file.name);
        setImportError(
          `File too large: Maximum file size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
        );
        setIsValidatingImport(false);
        setImportData(null);
        setImportDialogOpen(true);
        return;
      }

      if (file.size === 0) {
        setImportFileName(file.name);
        setImportError('Invalid file: The selected file is empty');
        setIsValidatingImport(false);
        setImportData(null);
        setImportDialogOpen(true);
        return;
      }

      // Reset state
      setImportFileName(file.name);
      setIsValidatingImport(true);
      setImportError(null);
      setImportData(null);

      try {
        let text: string;
        try {
          text = await file.text();
        } catch (readError) {
          setImportError(
            `Error reading file: ${readError instanceof Error ? readError.message : 'Could not read file contents'}`
          );
          setIsValidatingImport(false);
          setImportDialogOpen(true);
          return;
        }

        if (!text || text.trim().length === 0) {
          setImportError(
            'Invalid JSON file: File is empty or contains only whitespace'
          );
          setIsValidatingImport(false);
          setImportDialogOpen(true);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseError) {
          let errorMessage = 'Invalid JSON file: Could not parse the file.';

          if (parseError instanceof SyntaxError) {
            const syntaxError = parseError as SyntaxError;
            const match = syntaxError.message.match(/position (\d+)/i);
            if (match) {
              errorMessage += ` Syntax error at position ${match[1]}.`;
            } else {
              errorMessage += ` ${syntaxError.message}`;
            }
          }

          errorMessage +=
            ' Please check the file format and ensure it contains valid JSON.';

          setImportError(errorMessage);
          setIsValidatingImport(false);
          setImportDialogOpen(true);
          return;
        }

        const validation = validateImportData(parsed);

        if (!validation.valid) {
          setImportError(validation.error);
          setIsValidatingImport(false);
          setImportDialogOpen(true);
          return;
        }

        setImportData(validation.answers);
        setIsValidatingImport(false);
        setImportDialogOpen(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `Unexpected error: ${error.message}`
            : 'An unexpected error occurred while processing the file';

        setImportError(errorMessage);
        setIsValidatingImport(false);
        setImportDialogOpen(true);
      }
    };

    input.click();
  }, [validateImportData]);

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
              label: `${pathLabel} → ${q.label || q.title || 'Untitled'}`,
            });
          }
        }
        return out;
      }

      if (q.type === 'group') {
        const fields = q.item_fields ?? q.subquestions ?? [];
        fields.forEach((f: any) => {
          const fv = value ? value[f.id] : undefined;
          const groupName = q.label || q.title;
          const newPathLabel = groupName
            ? `${pathLabel} → ${groupName}`
            : pathLabel;
          out.push(
            ...collectMissing(f, fv, newPathLabel, `${idPrefix}-${q.id}-g`)
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
              const groupName = q.label || q.title || 'Group';
              out.push(
                ...collectMissing(
                  f,
                  nestedValue,
                  `${pathLabel} → ${groupName} #${idx + 1}`,
                  `${idPrefix}-${q.id}-item-${idx}`
                )
              );
            } else {
              if (f.required) {
                const fv = item?.[f.id];
                if (isEmptyPrimitive(fv)) {
                  const groupName = q.label || q.title || 'Group';
                  const fieldName = f.label || f.title || 'Untitled';
                  out.push({
                    id: `${idPrefix}-${q.id}-item-${idx}-f-${f.id}`,
                    label: `${pathLabel} → ${groupName} #${idx + 1} → ${fieldName}`,
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
            label: `${pathLabel} → ${q.label || q.title || 'Untitled'}`,
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

  const missingFieldsForButton = useMemo(() => {
    return missing.map((m) => {
      const parts = m.label.split(' → ');
      const sectionTitle = parts[0] || '';
      const questionLabel = parts.slice(1).join(' → ') || m.label;

      return {
        questionId: m.id,
        questionLabel: questionLabel,
        sectionId: m.id.split('-')[0] || '',
        sectionTitle: sectionTitle,
      };
    });
  }, [missing]);

  const computeInvalidFields = useCallback(() => {
    const invalidFields: Array<{
      questionId: string;
      questionLabel: string;
      errorMessage: string;
      sectionId: string;
      sectionTitle: string;
    }> = [];

    if (!templateSpec) return invalidFields;

    const validateQuestion = (
      question: any,
      value: any,
      sectionTitle: string,
      sectionId: string,
      pathLabel: string = ''
    ) => {
      if (!question) return;

      const isStructural =
        question.type === 'group' ||
        question.type === 'repeat_group' ||
        question.type === 'repeat_text';

      const rules = parseValidationRules(question);

      if (!isStructural && rules.length > 0) {
        const result = validateValue(value, rules);
        if (
          !result.isValid &&
          result.error &&
          result.error !== 'This field is required'
        ) {
          const label = pathLabel
            ? `${pathLabel} → ${question.label || question.title || 'Untitled'}`
            : question.label || question.title || 'Untitled';
          invalidFields.push({
            questionId: question.id,
            questionLabel: label,
            errorMessage: result.error,
            sectionId: sectionId,
            sectionTitle: sectionTitle,
          });
        }
      }

      if (question.type === 'group') {
        const fields = question.item_fields ?? question.subquestions ?? [];
        fields.forEach((field: any) => {
          const fieldValue = value ? value[field.id] : undefined;
          const groupName = question.label || question.title;
          const newPath = groupName
            ? pathLabel
              ? `${pathLabel} → ${groupName}`
              : groupName
            : pathLabel;
          validateQuestion(field, fieldValue, sectionTitle, sectionId, newPath);
        });
      } else if (question.type === 'repeat_group') {
        const arr = Array.isArray(value) ? value : [];
        arr.forEach((item: any, idx: number) => {
          (question.item_fields || []).forEach((field: any) => {
            const fieldValue = item?.[field.id];
            const groupName = question.label || question.title || 'Group';
            const newPath = pathLabel
              ? `${pathLabel} → ${groupName} #${idx + 1}`
              : `${groupName} #${idx + 1}`;
            validateQuestion(
              field,
              fieldValue,
              sectionTitle,
              sectionId,
              newPath
            );
          });
        });
      }
    };

    (templateSpec.sections || []).forEach((sec: any) => {
      const many = isManySection(sec);

      if (!many) {
        (sec.questions || []).forEach((q: any) => {
          const value = answers[q.id];
          validateQuestion(q, value, sec.title, sec.id);
        });
      } else {
        const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
        arr.forEach((entry: any, idx: number) => {
          (sec.questions || []).forEach((q: any) => {
            const entryValue = entry?.[q.id];
            validateQuestion(q, entryValue, `${sec.title} #${idx + 1}`, sec.id);
          });
        });
      }
    });

    return invalidFields;
  }, [templateSpec, answers]);

  const invalidFields = useMemo(
    () => computeInvalidFields(),
    [computeInvalidFields]
  );

  const invalidFieldsPerSection = useMemo(() => {
    const sectionCounts: Record<string, number> = {};
    invalidFields.forEach((field) => {
      sectionCounts[field.sectionId] =
        (sectionCounts[field.sectionId] || 0) + 1;
    });
    return sectionCounts;
  }, [invalidFields]);

  const validationErrorsByQuestion = useMemo(() => {
    const errorMap: Record<string, string> = {};
    invalidFields.forEach((field) => {
      errorMap[field.questionId] = field.errorMessage;
    });
    return errorMap;
  }, [invalidFields]);

  const handleVerificationComplete = useCallback(
    (result: AIVerificationResult) => {
      setAiVerifications((prev) => ({
        ...prev,
        [result.questionId]: result,
      }));
    },
    []
  );

  const collectQuestionsForVerification = useCallback(() => {
    const questionsToVerify: Array<{
      questionId: string;
      questionText: string;
      currentAnswer: string;
      questionType?: string;
    }> = [];

    if (!templateSpec) return questionsToVerify;

    const collectFromQuestion = (
      question: any,
      value: any,
      questionId: string,
      pathPrefix: string = ''
    ) => {
      if (!question) return;
      const hasAnswer =
        value !== undefined &&
        value !== null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0);

      if (!hasAnswer) return;

      if (question.type === 'group') {
        const fields = question.item_fields ?? question.subquestions ?? [];
        fields.forEach((field: any) => {
          const fieldValue = value ? value[field.id] : undefined;
          collectFromQuestion(
            field,
            fieldValue,
            field.id,
            `${pathPrefix}${question.label} → `
          );
        });
      } else if (question.type === 'repeat_group') {
        const arr = Array.isArray(value) ? value : [];
        arr.forEach((item: any, idx: number) => {
          (question.item_fields || []).forEach((field: any) => {
            const fieldValue = item?.[field.id];
            collectFromQuestion(
              field,
              fieldValue,
              `${questionId}[${idx}].${field.id}`,
              `${pathPrefix}${question.label} #${idx + 1} → `
            );
          });
        });
      } else if (question.type === 'repeat_text') {
        if (Array.isArray(value)) {
          value.forEach((entry, idx) => {
            if (entry && String(entry).trim()) {
              questionsToVerify.push({
                questionId: `${questionId}[${idx}]`,
                questionText: `${pathPrefix}${question.label} #${idx + 1}`,
                currentAnswer: String(entry),
                questionType: question.type,
              });
            }
          });
        }
      } else {
        const answerText = Array.isArray(value)
          ? value.join(', ')
          : String(value);
        if (answerText.trim()) {
          questionsToVerify.push({
            questionId: questionId,
            questionText: `${pathPrefix}${question.label}`,
            currentAnswer: answerText,
            questionType: question.type,
          });
        }
      }
    };

    (templateSpec.sections || []).forEach((sec: any) => {
      const many = isManySection(sec);

      if (!many) {
        (sec.questions || []).forEach((q: any) => {
          const value = answers[q.id];
          collectFromQuestion(q, value, q.id);
        });
      } else {
        const arr = Array.isArray(answers[sec.id]) ? answers[sec.id] : [];
        arr.forEach((entry: any, idx: number) => {
          (sec.questions || []).forEach((q: any) => {
            const entryValue = entry?.[q.id];
            collectFromQuestion(
              q,
              entryValue,
              `${sec.id}[${idx}].${q.id}`,
              `${sec.title} #${idx + 1} → `
            );
          });
        });
      }
    });

    return questionsToVerify;
  }, [templateSpec, answers]);

  const handleRunAIVerification = useCallback(async () => {
    setAiVerificationStatus('in_progress');

    try {
      const questionsToVerify = collectQuestionsForVerification();

      if (questionsToVerify.length === 0) {
        setImportSnackbar({
          open: true,
          message: 'No answers to verify',
          severity: 'error',
        });
        setAiVerificationStatus('not_started');
        return;
      }

      const pendingVerifications: Record<string, ExtendedAIVerificationResult> =
        {};
      questionsToVerify.forEach((q) => {
        pendingVerifications[q.questionId] = {
          questionId: q.questionId,
          status: 'pending' as const,
          confidence: 0,
        };
      });
      setAiVerifications(pendingVerifications);

      const results = await aiService.verifyAnswersBatch(questionsToVerify);
      const verificationResults: Record<string, ExtendedAIVerificationResult> =
        {};
      results.forEach((result) => {
        verificationResults[result.questionId] =
          result as ExtendedAIVerificationResult;
      });
      setAiVerifications(verificationResults);

      setAiVerificationStatus('complete');
      const verifiedCount = results.filter(
        (r) => r.status === 'verified'
      ).length;
      const needsImprovementCount = results.filter(
        (r) => r.status === 'needs_improvement'
      ).length;
      const errorCount = results.filter((r) => r.status === 'error').length;

      let message = `Verified ${results.length} answer${results.length !== 1 ? 's' : ''}`;
      if (verifiedCount > 0) {
        message += ` (${verifiedCount} verified`;
        if (needsImprovementCount > 0) {
          message += `, ${needsImprovementCount} need${needsImprovementCount === 1 ? 's' : ''} improvement`;
        }
        if (errorCount > 0) {
          message += `, ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
        }
        message += ')';
      }

      setImportSnackbar({
        open: true,
        message,
        severity: errorCount === results.length ? 'error' : 'success',
      });
    } catch (error) {
      console.error('Error running AI verification:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to verify answers';
      setAiVerificationStatus('not_started');

      setImportSnackbar({
        open: true,
        message: `Verification failed: ${errorMessage}`,
        severity: 'error',
      });
    }
  }, [aiService, collectQuestionsForVerification]);

  if (!templateSpec) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography>Loading template…</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ position: 'sticky', top: 8, zIndex: 1200 }}>
        <TopSummaryBar
          templateSpec={templateSpec}
          requiredSummary={requiredSummary}
          exportAnswers={exportAnswers}
          importAnswers={importAnswers}
          pdfExtractionError={pdfExtractionError}
          onRetryExtraction={onRetryExtraction}
          missingFields={missingFieldsForButton}
          invalidFields={invalidFields}
          aiVerificationStatus={aiVerificationStatus}
          aiVerifications={aiVerifications}
          onRunAIVerification={handleRunAIVerification}
        />
        <ImportDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onConfirm={handleImportConfirm}
          fileName={importFileName}
          importData={importData}
          error={importError}
          isValidating={isValidatingImport}
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
                  pdfContent={pdfContent}
                  structuredDocument={structuredDocument}
                  onNavigateToPage={onNavigateToPage}
                  onHighlightsChange={onHighlightsChange}
                  pdfUrl={pdfUrl}
                  pageWidth={pageWidth}
                  invalidFieldCount={invalidFieldsPerSection[sec.id] || 0}
                  validationErrors={validationErrorsByQuestion}
                  onRegisterQuestionRef={handleRegisterQuestionRef}
                  onAIVerificationComplete={handleVerificationComplete}
                  aiVerifications={aiVerifications}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={importSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setImportSnackbar({ ...importSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setImportSnackbar({ ...importSnackbar, open: false })}
          severity={importSnackbar.severity}
          sx={{ width: '100%' }}
        >
          {importSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateQuestionaire;

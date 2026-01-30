import React, { useEffect, useState } from 'react';
import NodeWrapper from '../NodeWrapper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Typography from '@mui/material/Typography';
import InfoTooltip from '../InfoTooltip';
import QuestionRenderer from './QuestionRenderer';
import type { AIVerificationResult } from '../../../services/backendAIService';
import type { StructuredDocument } from '../../../utils/structuredPdfExtractor';
import type { ParentContext } from '../../../types/context';

const RepeatGroupQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
  pdfContent?: string;
  structuredDocument?: StructuredDocument | null;
  onNavigateToPage?: (pageNumber: number) => void;
  onHighlightsChange?: (
    highlights: Record<
      number,
      { left: number; top: number; width: number; height: number }[]
    >
  ) => void;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  onAIVerificationComplete?: (result: AIVerificationResult) => void;
}> = ({
  q,
  value,
  onChange,
  idAttr,
  level = 0,
  pdfContent,
  structuredDocument,
  onNavigateToPage,
  onHighlightsChange,
  pdfUrl,
  pageWidth,
  onAIVerificationComplete,
}) => {
  const arr = Array.isArray(value) ? value : [];
  const desc = q.desc ?? q.description ?? '';
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Initialize required repeat_group fields with one empty entry
  useEffect(() => {
    if (q.required && (!Array.isArray(value) || value.length === 0)) {
      const initEntry = q.item_fields
        ? q.item_fields.reduce((acc: any, f: any) => {
            acc[f.id] = f.type === 'multi_select' ? [] : '';
            return acc;
          }, {})
        : {};
      onChange([initEntry]);
    }
  }, [q.required, q.id]);

  const setExpandedKey = (k: string, v: boolean) =>
    setExpandedMap((s) => ({ ...s, [k]: v }));

  return (
    <NodeWrapper level={level}>
      <Box sx={{ pl: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ ml: 0 }}>
            {q.label}
            {q.required ? ' *' : ''}
          </Typography>
          <InfoTooltip desc={desc} />
        </Box>

        <Stack spacing={1}>
          {arr.map((item: any, idx: number) => {
            const key = `${idAttr ?? q.id}-entry-${idx}`;
            return (
              <Accordion
                key={idx}
                expanded={!!expandedMap[key]}
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
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {q.item_label ?? `Entry #${idx + 1}`}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        disabled={arr.length === 1 && q.required === true}
                        onClick={(e) => {
                          e.stopPropagation();
                          const copy = [...arr];
                          copy.splice(idx, 1);
                          onChange(copy);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        aria-label={
                          arr.length === 1 && q.required === true
                            ? `Cannot delete last required ${q.label} item`
                            : `Delete ${q.label} item ${idx + 1}`
                        }
                        sx={{
                          opacity:
                            arr.length === 1 && q.required === true ? 0.4 : 1,
                          cursor:
                            arr.length === 1 && q.required === true
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {(q.item_fields || []).map((f: any) => {
                      const parentContext: ParentContext = {
                        questionText: q.label,
                        answer: JSON.stringify(item),
                        questionId: q.id,
                        questionType: 'repeat_group',
                      };

                      const siblingQuestionIds = (q.item_fields || []).map(
                        (field: any) => field.id
                      );

                      const questionDefinitions = (q.item_fields || []).reduce(
                        (acc: Record<string, any>, field: any) => {
                          acc[field.id] = field;
                          return acc;
                        },
                        {}
                      );

                      return (
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
                          pdfContent={pdfContent}
                          structuredDocument={structuredDocument}
                          onNavigateToPage={onNavigateToPage}
                          onHighlightsChange={onHighlightsChange}
                          pdfUrl={pdfUrl}
                          pageWidth={pageWidth}
                          onAIVerificationComplete={onAIVerificationComplete}
                          parentContext={parentContext}
                          allAnswers={item}
                          siblingQuestionIds={siblingQuestionIds}
                          questionDefinitions={questionDefinitions}
                          allEntries={arr}
                          currentEntryIndex={idx}
                        />
                      );
                    })}
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
};

export default RepeatGroupQuestion;

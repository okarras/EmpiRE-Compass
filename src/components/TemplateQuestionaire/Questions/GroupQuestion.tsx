import React, { useState } from 'react';
import NodeWrapper from '../NodeWrapper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InfoTooltip from '../InfoTooltip';
import QuestionRenderer from './QuestionRenderer';
import type { AIVerificationResult } from '../../../services/backendAIService';
import type { StructuredDocument } from '../../../utils/structuredPdfExtractor';
import type { ParentContext } from '../../../types/context';

const GroupQuestion: React.FC<{
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
  const obj = value ?? {};
  const [expanded, setExpanded] = useState(false);
  const desc = q.desc ?? q.description ?? '';

  return (
    <NodeWrapper level={level}>
      <Accordion
        expanded={expanded}
        onChange={(_e, val) => setExpanded(val)}
        sx={{ boxShadow: 'none', borderRadius: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: -1.5 }}>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}
            >
              {q.label ?? q.title}
              {q.required ? ' *' : ''}
            </Typography>
            <InfoTooltip desc={desc} />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gap: 1, pl: 1 }}>
            {(q.item_fields || q.subquestions || []).map((f: any) => {
              const parentContext: ParentContext = {
                questionText: q.label ?? q.title,
                answer: JSON.stringify(obj),
                questionId: q.id,
                questionType: 'group',
              };

              const siblingQuestionIds = (
                q.item_fields ||
                q.subquestions ||
                []
              ).map((field: any) => field.id);

              const questionDefinitions = (
                q.item_fields ||
                q.subquestions ||
                []
              ).reduce((acc: Record<string, any>, field: any) => {
                acc[field.id] = field;
                return acc;
              }, {});

              return (
                <QuestionRenderer
                  key={f.id}
                  q={f}
                  value={obj[f.id]}
                  onChange={(nv) => onChange({ ...(obj ?? {}), [f.id]: nv })}
                  idAttr={`${idAttr ?? q.id}-g-${f.id}`}
                  level={level + 1}
                  pdfContent={pdfContent}
                  structuredDocument={structuredDocument}
                  onNavigateToPage={onNavigateToPage}
                  onHighlightsChange={onHighlightsChange}
                  pdfUrl={pdfUrl}
                  pageWidth={pageWidth}
                  onAIVerificationComplete={onAIVerificationComplete}
                  parentContext={parentContext}
                  allAnswers={obj}
                  siblingQuestionIds={siblingQuestionIds}
                  questionDefinitions={questionDefinitions}
                />
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>
    </NodeWrapper>
  );
};

export default GroupQuestion;

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

const GroupQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
}> = ({ q, value, onChange, idAttr, level = 0 }) => {
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
};

export default GroupQuestion;

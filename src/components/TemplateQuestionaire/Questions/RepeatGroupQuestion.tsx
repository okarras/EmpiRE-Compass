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

const RepeatGroupQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
}> = ({ q, value, onChange, idAttr, level = 0 }) => {
  const arr = Array.isArray(value) ? value : [];
  const desc = q.desc ?? q.description ?? '';
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
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
  }, [q.id]);

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
};

export default RepeatGroupQuestion;

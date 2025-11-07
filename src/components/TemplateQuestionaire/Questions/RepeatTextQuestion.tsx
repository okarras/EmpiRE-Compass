import React from 'react';
import NodeWrapper from '../NodeWrapper';
import BufferedTextField from '../BufferedTextField';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Typography from '@mui/material/Typography';
import InfoTooltip from '../InfoTooltip';

const RepeatTextQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
}> = ({ q, value, onChange, idAttr, level = 0 }) => {
  const arr: string[] = Array.isArray(value) ? value : [];
  const desc = q.desc ?? q.description ?? '';

  return (
    <NodeWrapper level={level}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle2">
            {q.label}
            {q.required ? ' *' : ''}
          </Typography>
          <InfoTooltip desc={desc} />
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
};

export default RepeatTextQuestion;

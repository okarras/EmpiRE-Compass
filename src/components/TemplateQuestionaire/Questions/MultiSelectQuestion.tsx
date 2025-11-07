import React from 'react';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

const MultiSelectQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
}> = ({ q, value, onChange, level = 0 }) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';
  const opts = q.options ?? [];

  return (
    <NodeWrapper level={level}>
      <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
        <FormControl fullWidth size="small">
          <Select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const v = (e.target as any).value;
              onChange(typeof v === 'string' ? v.split(',') : v);
            }}
            input={<OutlinedInput />}
            renderValue={(selected: any) => (
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
};

export default MultiSelectQuestion;

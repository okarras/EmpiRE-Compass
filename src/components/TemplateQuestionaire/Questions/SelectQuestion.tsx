import React from 'react';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';

const SelectQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
}> = ({ q, value, onChange, level = 0 }) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';
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
            onChange={(e) => onChange((e.target as any).value)}
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
};

export default SelectQuestion;

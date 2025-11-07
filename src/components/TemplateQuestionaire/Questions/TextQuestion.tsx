import React from 'react';
import NodeWrapper from '../NodeWrapper';
import FieldRow from '../FieldRow';
import BufferedTextField from '../BufferedTextField';

const TextQuestion: React.FC<{
  q: any;
  value: any;
  onChange: (v: any) => void;
  idAttr?: string;
  level?: number;
}> = ({ q, value, onChange, idAttr, level = 0 }) => {
  const commonLabel = q.label ?? q.title ?? '';
  const desc = q.desc ?? q.description ?? '';
  return (
    <NodeWrapper level={level}>
      <FieldRow label={commonLabel + (q.required ? ' *' : '')} desc={desc}>
        <BufferedTextField
          id={idAttr}
          value={String(value ?? '')}
          onCommit={(v) => onChange(v)}
          size="small"
          fullWidth
          commitOnBlurOnly
          placeholder={q.placeholder ?? ''}
        />
      </FieldRow>
    </NodeWrapper>
  );
};

export default TextQuestion;

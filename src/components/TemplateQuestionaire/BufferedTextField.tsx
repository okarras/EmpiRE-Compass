import React, { useEffect, useState } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

type Props = {
  value: string;
  onCommit: (v: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  id?: string;
  placeholder?: string;
  debounceMs?: number;
  commitOnBlurOnly?: boolean;
  error?: boolean;
  sx?: TextFieldProps['sx'];
  'aria-label'?: string;
  'aria-required'?: boolean;
  'aria-describedby'?: string;
};

const BufferedTextField: React.FC<Props> = ({
  value,
  onCommit,
  size = 'small',
  fullWidth = true,
  id,
  placeholder,
  debounceMs = 500,
  commitOnBlurOnly = false,
  error = false,
  sx,
  'aria-label': ariaLabel,
  'aria-required': ariaRequired,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [local, setLocal] = useState<string>(value ?? '');

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  useEffect(() => {
    if (commitOnBlurOnly) return;
    const t = setTimeout(() => {
      if ((value ?? '') !== local) onCommit(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, onCommit, debounceMs, value, commitOnBlurOnly]);

  return (
    <TextField
      id={id}
      size={size}
      fullWidth={fullWidth}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if ((value ?? '') !== local) onCommit(local);
      }}
      inputProps={{
        'aria-label': ariaLabel || id,
        'aria-required': ariaRequired,
        'aria-describedby': ariaDescribedBy,
      }}
      error={error}
      sx={sx}
    />
  );
};

export default BufferedTextField;

import React from 'react';
import Box from '@mui/material/Box';
import InfoTooltip from './InfoTooltip';

type Props = {
  children: React.ReactNode;
  label?: string;
  desc?: string;
};

const FieldRow: React.FC<Props> = ({ children, label, desc }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box component="span" sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}>
        {label}
      </Box>
      <InfoTooltip desc={desc} />
    </Box>
    <Box>{children}</Box>
  </Box>
);

export default FieldRow;

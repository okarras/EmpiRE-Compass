import React, { forwardRef } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { darken } from '@mui/material/styles';

type Props = {
  level?: number;
  children?: React.ReactNode;
  sx?: any;
};

const INDENT_PX = 20;
const DARKEN_STEP = 0.04;
const MAX_DARKEN = 0.24;

const NodeWrapper = forwardRef<HTMLDivElement, Props>(
  ({ level = 0, children, sx }, ref) => {
    const theme = useTheme();
    const base = theme.palette.background.paper;

    const rawAmount =
      level <= 0 ? 0 : Math.min(MAX_DARKEN, level * DARKEN_STEP);
    const bg = rawAmount > 0 ? darken(base, rawAmount) : 'transparent';
    const left = level * INDENT_PX;

    return (
      <Box ref={ref} sx={{ position: 'relative', pl: `${left}px`, ...sx }}>
        <Box
          sx={{
            backgroundColor: bg,
            borderRadius: 1,
            p: level === 0 ? 0 : 1,
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }
);

NodeWrapper.displayName = 'NodeWrapper';

export default NodeWrapper;

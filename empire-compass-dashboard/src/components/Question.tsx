import { Box } from '@mui/material';
import type { ReactElement } from 'react';

const Question = ({ children }: {children: ReactElement}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '20px',
      }}
    >
      {children}
    </Box>
  );
};

export default Question;

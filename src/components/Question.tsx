import { Box } from '@mui/material';
import type { ReactElement } from 'react';

const Question = ({
  children,
  dataAnalysisInformation,
}: {
  children: ReactElement;
  dataAnalysisInformation: { question: string };
}) => {
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
        flexDirection: 'column',
      }}
    >
      <h1>{dataAnalysisInformation.question}</h1>
      {children}
    </Box>
  );
};

export default Question;

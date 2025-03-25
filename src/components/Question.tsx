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
      <div style={{display: "grid", gridTemplateColumns: '1fr 1fr', width: '100%'}}>
        {children}
      </div>
    </Box>
  );
};

export default Question;

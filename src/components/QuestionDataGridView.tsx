import React from 'react';
import { Typography } from '@mui/material';
import MuiDataGrid from './CustomGrid';

interface QuestionDataGridViewProps {
  questionData: Record<string, unknown>[];
}

const QuestionDataGridView: React.FC<QuestionDataGridViewProps> = ({
  questionData,
}) => {
  return (
    <>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          color: '#e86161',
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        Raw Data
      </Typography>
      <MuiDataGrid questionData={questionData} />
    </>
  );
};

export default QuestionDataGridView;

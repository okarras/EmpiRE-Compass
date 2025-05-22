import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import MuiDataGrid from './CustomGrid';

interface QuestionDataGridViewProps {
  questionData: Record<string, unknown>[];
}

const QuestionDataGridView: React.FC<QuestionDataGridViewProps> = ({
  questionData,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
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
    </Paper>
  );
};

export default QuestionDataGridView; 
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Query } from '../constants/queries_chart_info';

interface QuestionInformationViewProps {
  query: Pick<Query, 'dataAnalysisInformation'>;
}

const QuestionInformationView: React.FC<QuestionInformationViewProps> = ({
  query,
}) => {
  const info = query.dataAnalysisInformation;
  return (
    <Box>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: '#e86161', mb: 1 }}
      >
        Explanation of the Competency Question
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
        {info.questionExplanation}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: '#e86161', mb: 1 }}
      >
        Required Data for Analysis
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
        {info.requiredDataForAnalysis}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: '#e86161', mb: 1 }}
      >
        Data Analysis
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
        {info.dataAnalysis}
      </Typography>
    </Box>
  );
};

export default QuestionInformationView;

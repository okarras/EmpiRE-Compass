import React from 'react';
import { Box, DialogContentText } from '@mui/material';
import QuestionInformation from './QuestionInformation';
import { Query } from '../constants/queries_chart_info';

interface QuestionInformationViewProps {
  query: Query;
}

const QuestionInformationView: React.FC<QuestionInformationViewProps> = ({
  query,
}) => {
  return (
    <>
      <>
        <DialogContentText>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.questionExplanation}
              label="Explanation of the Competency Question"
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={
                query.dataAnalysisInformation.requiredDataForAnalysis
              }
              label="Required Data for Analysis"
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.dataAnalysis}
              label="Data Analysis"
            />
          </Box>
          {/* <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.dataInterpretation}
              label="Data Interpretation"
            />
          </Box> */}
        </DialogContentText>
      </>
    </>
  );
};

export default QuestionInformationView;

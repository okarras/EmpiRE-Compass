import React from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  Box,
  Paper,
  DialogContentText,
} from '@mui/material';
import QuestionInformation from './QuestionInformation';
import AIAssistant from './AI/AIAssistant';

interface QuestionInformationViewProps {
  query: Query;
  questionData: Record<string, unknown>[];
}

const QuestionInformationView: React.FC<QuestionInformationViewProps> = ({
  query,
  questionData,
}) => {
  return (
    <>
      <AIAssistant query={query} questionData={questionData} />
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <DialogContentText>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.questionExplanation}
              label="Explanation of the Competency Question"
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.requiredDataForAnalysis}
              label="Required Data for Analysis"
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.dataAnalysis}
              label="Data Analysis"
            />
          </Box>
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.dataInterpretation}
              label="Data Interpretation"
            />
          </Box>
        </DialogContentText>
      </Paper>
    </>
  );
};

export default QuestionInformationView; 
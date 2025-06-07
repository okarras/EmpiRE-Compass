import React from 'react';
import { Query } from '../constants/queries_chart_info';
import { Box, DialogContentText, Button, Typography } from '@mui/material';
import QuestionInformation from './QuestionInformation';
import CodeIcon from '@mui/icons-material/Code';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import { SPARQL_QUERIES, PREFIXES } from '../api/SPARQL_QUERIES';

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
          <Box sx={{ mb: 4 }}>
            <QuestionInformation
              information={query.dataAnalysisInformation.dataInterpretation}
              label="Data Interpretation"
            />
          </Box>
          <Box>
            <Button
              href={`https://mybinder.org/v2/gh/okarras/EmpiRE-Analysis/HEAD?labpath=%2Fempire-analysis.ipynb`}
              target="_blank"
              sx={{
                color: '#e86161',
                mt: { xs: 2, sm: 0 },
                '&:hover': {
                  color: '#b33a3a',
                },
              }}
              variant="outlined"
            >
              <CodeIcon sx={{ mr: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Check and edit the code in Binder
              </Typography>
            </Button>
            <Button
              href={`https://orkg.org/sparql#${encodeURIComponent(PREFIXES + SPARQL_QUERIES[query.uid as keyof typeof SPARQL_QUERIES])}`}
              target="_blank"
              sx={{
                color: '#e86161',
                mt: { xs: 2, sm: 0 },
                ml: 2,
                '&:hover': {
                  color: '#b33a3a',
                },
              }}
              variant="outlined"
            >
              <LiveHelpIcon sx={{ mr: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                SPARQL Query
              </Typography>
            </Button>
          </Box>
        </DialogContentText>
      </>
    </>
  );
};

export default QuestionInformationView;

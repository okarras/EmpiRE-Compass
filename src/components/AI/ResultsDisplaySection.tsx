import React from 'react';
import { Box, Divider, Paper, Typography } from '@mui/material';
import TextSkeleton from './TextSkeleton';
import HTMLRenderer from './HTMLRenderer';
import AIContentGenerator from './AIContentGenerator';
import SectionSelector from '../SectionSelector';
import QuestionInformationView from '../QuestionInformationView';
import QuestionDataGridView from '../QuestionDataGridView';

// Dynamic query interface to match the structure of Query
interface DynamicQuery {
  title: string;
  id: number;
  uid: string;
  dataAnalysisInformation: {
    question: string;
    questionExplanation: string;
    requiredDataForAnalysis: string | string[];
    dataAnalysis: string | string[];
    dataInterpretation: string | string[];
  };
  chartSettings?: {
    series: Array<{ dataKey: string; label: string }>;
    colors?: string[];
    yAxis: Array<{ label: string; dataKey: string }>;
    seriesHeadingTemplate?: string;
    noHeadingInSeries?: boolean;
    height: number;
    sx: Record<string, unknown>;
  };
  chartType?: 'bar' | 'pie';
  dataProcessingFunction?: (
    data: Record<string, unknown>[]
  ) => Record<string, unknown>[];
}

interface ResultsDisplaySectionProps {
  loading: boolean;
  error: string | null;
  question: string;
  sparqlQuery: string;
  queryResults: Record<string, unknown>[];
  chartHtml: string;
  questionInterpretation: string;
  dataCollectionInterpretation: string;
  dataAnalysisInterpretation: string;
  dynamicQuery: DynamicQuery | null;
  onContentGenerated: (
    chartHtmlContent: string,
    chartDescriptionContent: string,
    questionInterpretationContent: string,
    dataCollectionInterpretationContent: string,
    dataAnalysisInterpretationContent: string
  ) => void;
  onError: (error: string) => void;
  onChartHtmlChange: (html: string) => void;
}

const ResultsDisplaySection: React.FC<ResultsDisplaySectionProps> = ({
  loading,
  error,
  question,
  sparqlQuery,
  queryResults,
  chartHtml,
  questionInterpretation,
  dataCollectionInterpretation,
  dataAnalysisInterpretation,
  dynamicQuery,
  onContentGenerated,
  onError,
  onChartHtmlChange,
}) => {
  const renderErrorState = (errorMessage: string) => (
    <Box
      sx={{
        p: 4,
        mt: 4,
        textAlign: 'center',
        backgroundColor: 'rgba(232, 97, 97, 0.05)',
        border: '1px solid rgba(232, 97, 97, 0.1)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        An Error Occurred
      </Typography>
      <Typography color="text.secondary">{errorMessage}</Typography>
    </Box>
  );

  return (
    <>
      {loading && !sparqlQuery && <TextSkeleton lines={12} />}
      {error && renderErrorState(error)}

      {queryResults.length > 0 &&
        question &&
        !chartHtml &&
        !questionInterpretation &&
        !dataCollectionInterpretation &&
        !dataAnalysisInterpretation && (
          <AIContentGenerator
            data={queryResults}
            question={question}
            onContentGenerated={onContentGenerated}
            onError={onError}
          />
        )}

      {dynamicQuery && queryResults.length > 0 && (
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
          <SectionSelector
            sectionType="information"
            sectionTitle="Question Information"
            query={dynamicQuery}
          />
          <QuestionInformationView query={dynamicQuery} isInteractive={true} />

          {chartHtml && (
            <>
              <Divider sx={{ my: 3 }} />
              <HTMLRenderer
                html={chartHtml}
                title="AI-Generated Chart"
                type="chart"
                useIframe={true}
                onContentChange={onChartHtmlChange}
              />
            </>
          )}
        </Paper>
      )}

      {queryResults.length > 0 && (
        <QuestionDataGridView questionData={queryResults} />
      )}
    </>
  );
};

export default ResultsDisplaySection;

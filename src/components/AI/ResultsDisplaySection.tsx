import React from 'react';
import { Box, Divider, Paper, Typography } from '@mui/material';
import TextSkeleton from './TextSkeleton';
import HTMLRenderer from './HTMLRenderer';
import AIContentGenerator from './AIContentGenerator';
import SectionSelector from '../SectionSelector';
import QuestionInformationView from '../QuestionInformationView';
import QuestionDataGridView from '../QuestionDataGridView';
import CostDisplay from './CostDisplay';
import { CostBreakdown } from '../../utils/costCalculator';

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
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
  };
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
  costs: CostBreakdown[];
  searchProvider?: 'local' | 'orkg-ask';
  orkgAskResults?: any | null;
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
  costs,
  searchProvider = 'local',
  orkgAskResults,
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
      {loading && searchProvider === 'local' && !sparqlQuery && (
        <TextSkeleton lines={12} />
      )}
      {loading && searchProvider === 'orkg-ask' && <TextSkeleton lines={12} />}
      {error && renderErrorState(error)}

      {/* ORKG ASK Results View */}
      {searchProvider === 'orkg-ask' && orkgAskResults && (
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
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, color: '#e86161' }}
          >
            ORKG ASK (AI) Answer
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              color: '#333',
              fontSize: '1.05rem',
            }}
          >
            {orkgAskResults.synthesis || 'No synthesis text returned.'}
          </Typography>
        </Paper>
      )}

      {/* Symbolic Local Results View */}
      {searchProvider === 'local' &&
        queryResults &&
        Array.isArray(queryResults) &&
        queryResults.length > 0 &&
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

      {searchProvider === 'local' &&
        dynamicQuery &&
        queryResults &&
        Array.isArray(queryResults) &&
        queryResults.length > 0 && (
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
            <QuestionInformationView
              query={dynamicQuery}
              isInteractive={true}
            />

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

      {costs && Array.isArray(costs) && costs.length > 0 && (
        <CostDisplay costs={costs} />
      )}

      {searchProvider === 'local' &&
        queryResults &&
        Array.isArray(queryResults) &&
        queryResults.length > 0 && (
          <QuestionDataGridView
            key={`grid-${sparqlQuery.length}-${queryResults.length}-${Object.keys(queryResults[0] || {}).join(',')}`}
            questionData={queryResults}
            gridOptions={dynamicQuery?.gridOptions}
          />
        )}
    </>
  );
};

export default ResultsDisplaySection;

import React from 'react';
import { Query } from '../constants/queries_chart_info';
import { DialogContentText, Box, Divider, Paper, Typography } from '@mui/material';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import MuiDataGrid from './CustomGrid';
import QuestionInformation from './QuestionInformation';

type Props = {
  query: Query;
  questionData: Record<string, unknown>[];
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
  chartData: Record<string, unknown>[];
};

const Question = (props: Props) => {
  const { query, questionData, normalized, setNormalized, chartData } = props;
  const detailedChartData: { dataKey: string; label: string }[] =
    query.chartSettings.series;

  return (
    <Box sx={{ mt: 2 }}>
      {/* Information Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)'
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

      {/* Charts Section */}
      {detailedChartData.length > 1 && (
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3,
              color: '#e86161',
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Detailed Charts
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {detailedChartData.map((chart, index) => (
              <React.Fragment key={`${query.uid}-chart-${index}`}>
                <ChartWrapper
                  question_id={query.uid}
                  dataset={chartData ?? []}
                  chartSetting={{
                    ...query.chartSettings,
                    series: [chart],
                    heading: 'Number of ' + chart.label + 's used',
                    colors: [query.chartSettings.colors?.[index] ?? '#e86161'],
                    yAxis: [
                      {
                        label: chart.label,
                        dataKey: chart.dataKey,
                      },
                    ],
                  }}
                  normalized={true}
                  loading={false}
                  defaultChartType={query.chartType ?? 'bar'}
                  availableCharts={['bar', 'pie']}
                />
                {index < detailedChartData.length - 1 && (
                  <Divider sx={{ my: 3 }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>
      )}

      {/* Main Chart Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ mb: 3 }}>
          <ChartParamsSelector
            normalized={normalized}
            setNormalized={setNormalized}
            query={query}
          />
        </Box>
        <ChartWrapper
          key={`${query.uid}-chart`}
          question_id={query.uid}
          dataset={chartData ?? []}
          chartSetting={query.chartSettings}
          normalized={normalized}
          loading={false}
          defaultChartType={query.chartType ?? 'bar'}
          availableCharts={['bar', 'pie']}
        />
      </Paper>

      {/* Data Grid Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3,
            color: '#e86161',
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          Raw Data
        </Typography>
        <MuiDataGrid questionData={questionData} />
      </Paper>
    </Box>
  );
};

export default Question;

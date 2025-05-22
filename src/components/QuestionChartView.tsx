import React from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  Box,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';

interface QuestionChartViewProps {
  query: Query;
  questionData: Record<string, unknown>[];
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
  queryId: string;
}

const QuestionChartView: React.FC<QuestionChartViewProps> = ({
  query,
  questionData,
  normalized,
  setNormalized,
  queryId,
}) => {
  const detailedChartData: { dataKey: string; label: string }[] =
    query.chartSettings.series;
  
  if(query.uid_2 === queryId) {
    console.log('questionData', questionData);
    console.log('chartSettings', query.chartSettings);
    console.log('detailedChartData', query.dataProcessingFunction(questionData ?? []));
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Charts Section */}
      {detailedChartData.length > 1 && (
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
            sx={{
              mb: 3,
              color: '#e86161',
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Detailed Charts
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {detailedChartData.map((chart, index) => (
              <React.Fragment key={`${queryId}-chart-${index}`}>
                <ChartWrapper
                  question_id={queryId}
                  dataset={query.dataProcessingFunction(questionData ?? [])}
                  chartSetting={{
                    ...query.chartSettings,
                    series: [chart],
                    heading: 'Number of ' + chart.label + 's used',
                    colors: [
                      query.chartSettings.colors?.[index] ?? '#e86161',
                    ],
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
          border: '1px solid rgba(0, 0, 0, 0.1)',
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
          key={`${queryId}-chart`}
          question_id={queryId}
          dataset={query.dataProcessingFunction(questionData ?? [])}
          chartSetting={query.chartSettings}
          normalized={normalized}
          loading={false}
          defaultChartType={query.chartType ?? 'bar'}
          availableCharts={['bar', 'pie']}
        />
      </Paper>
    </Box>
  );
};

export default QuestionChartView; 
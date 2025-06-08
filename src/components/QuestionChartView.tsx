import React from 'react';
import { ChartSetting, Query } from '../constants/queries_chart_info';
import { Box, Typography } from '@mui/material';
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
  const isSecondSubQuery = query.uid_2 === queryId;
  const chartSettingsKey = isSecondSubQuery
    ? 'chartSettings2'
    : 'chartSettings';
  const hasSecondSubQueryChart = !!query.chartSettings2;
  if (isSecondSubQuery && !hasSecondSubQueryChart) {
    return null;
  }

  const detailedChartData = isSecondSubQuery
    ? (query.chartSettings2?.series ?? [])
    : query.chartSettings.series;

  const processedChartDataset = isSecondSubQuery
    ? (query.dataProcessingFunction2?.(questionData ?? []) ?? [])
    : query.dataProcessingFunction(questionData ?? []);

  const chartSettings = isSecondSubQuery
    ? ((query.chartSettings2 ?? []) as ChartSetting)
    : query.chartSettings;

  const createHeading = (chart: { label: string }) => {
    if (query[chartSettingsKey]?.seriesHeadingTemplate) {
      return query[chartSettingsKey].seriesHeadingTemplate.replace(
        '{label}',
        chart.label
      );
    }
    return 'Number of ' + chart.label + 's used';
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Charts Section */}
      {detailedChartData.length > 1 && (
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
            Detailed Charts
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 4,
              overflowX: 'auto',
              pb: 2,
              scrollSnapType: 'x mandatory',
              '& > *': {
                minWidth: { xs: '90vw', sm: 400, md: 500 },
                maxWidth: 600,
                scrollSnapAlign: 'start',
              },
            }}
          >
            {detailedChartData.map(
              (chart: { label: string; dataKey: unknown }, index: number) => (
                <React.Fragment key={`${queryId}-chart-${index}`}>
                  <ChartWrapper
                    question_id={queryId}
                    dataset={processedChartDataset}
                    chartSetting={{
                      ...chartSettings,
                      series: [chart],
                      heading: createHeading(chart),
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
                    normalized={normalized}
                    loading={false}
                    defaultChartType={query.chartType ?? 'bar'}
                    availableCharts={['bar', 'pie']}
                  />
                </React.Fragment>
              )
            )}
          </Box>
        </>
      )}

      {/* Main Chart Section */}
      <>
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
          dataset={processedChartDataset}
          chartSetting={chartSettings}
          normalized={normalized}
          loading={false}
          defaultChartType={query.chartType ?? 'bar'}
          availableCharts={['bar', 'pie']}
        />
      </>
    </Box>
  );
};

export default QuestionChartView;

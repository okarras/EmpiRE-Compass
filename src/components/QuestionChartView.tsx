import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import { PREFIXES, SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import CodeIcon from '@mui/icons-material/Code';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import { Query, ChartSetting } from '../constants/queries_chart_info';

interface QuestionChartViewProps {
  query: Query;
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
  queryId: string;
  chartSettings: ChartSetting;
  processedChartDataset: Record<string, unknown>[];
  dataInterpretation: string;
}

const QuestionChartView: React.FC<QuestionChartViewProps> = ({
  query,
  normalized,
  setNormalized,
  queryId,
  chartSettings,
  processedChartDataset,
  dataInterpretation,
}) => {
  let series = chartSettings.series;
  if (chartSettings.series.length > 1 && normalized) {
    // add normalized to each series key string
    series = series.map((chart: { dataKey: string }) => ({
      ...chart,
      dataKey: 'normalized_' + chart.dataKey,
    }));
  }
  const createHeading = (chart: { label: string }) => {
    if (chartSettings?.seriesHeadingTemplate) {
      return chartSettings.seriesHeadingTemplate.replace(
        '{label}',
        chart.label
      );
    }
    return 'Number of ' + chart.label + 's used';
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="h6"
        sx={{
          color: '#e86161',
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1.1rem', sm: '1.2rem' },
        }}
      >
        Data Interpretation
      </Typography>

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

      {/* Charts Section */}
      {series.length > 1 && (
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
                minWidth: { xs: '90vw', sm: 600, md: 1050 },
                maxWidth: 600,
                scrollSnapAlign: 'start',
              },
            }}
          >
            {series.map(
              (chart: { label: string; dataKey: unknown }, index: number) => (
                <React.Fragment key={`${queryId}-chart-${index}`}>
                  <ChartWrapper
                    question_id={queryId}
                    dataset={processedChartDataset}
                    chartSetting={{
                      ...chartSettings,
                      series: [chart],
                      heading: chartSettings.noHeadingInSeries
                        ? ''
                        : createHeading(chart),
                      colors: [chartSettings.colors?.[index] ?? '#e86161'],
                      yAxis: [
                        {
                          label: chartSettings.yAxis?.[0]?.label,
                          dataKey: chart.dataKey,
                        },
                      ],
                    }}
                    normalized={normalized}
                    loading={false}
                    defaultChartType={query.chartType ?? 'bar'}
                    availableCharts={['bar', 'pie']}
                    isSubChart={true}
                  />
                </React.Fragment>
              )
            )}
          </Box>
        </>
      )}
      <Box
        component="div"
        sx={{
          '& p': {
            fontSize: { xs: '0.95rem', sm: '1rem' },
            lineHeight: 1.7,
            color: 'text.primary',
            mt: 4,
            mb: 4,
          },
          '& a': {
            color: '#e86161',
            textDecoration: 'none',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& strong': {
            color: 'text.primary',
            fontWeight: 600,
          },
        }}
        dangerouslySetInnerHTML={{
          __html: dataInterpretation,
        }}
      />

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
    </Box>
  );
};

export default QuestionChartView;

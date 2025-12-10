import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import {
  PREFIXES as EMPIRICAL_PREFIXES,
  SPARQL_QUERIES as EMPIRICAL_SPARQL_QUERIES,
} from '../api/SPARQL_QUERIES';
import {
  PREFIXES as NLP4RE_PREFIXES,
  SPARQL_QUERIES as NLP4RE_SPARQL_QUERIES,
} from '../api/SPARQL_QUERIES_NLP4RE';
import CodeIcon from '@mui/icons-material/Code';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Query, ChartSetting } from '../constants/queries_chart_info';
import { useLocation } from 'react-router-dom';

interface QuestionChartViewProps {
  query: Query;
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
  queryId: string;
  chartSettings: ChartSetting;
  processedChartDataset: Record<string, unknown>[];
  dataInterpretation: string;
  type: string;
}

const QuestionChartView: React.FC<QuestionChartViewProps> = ({
  query,
  normalized,
  setNormalized,
  queryId,
  chartSettings,
  processedChartDataset,
  dataInterpretation,
  type,
}) => {
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  //TODO: we need better way to handle this
  const [prefixes, setPrefixes] = useState<string>(EMPIRICAL_PREFIXES);
  const [sparqlQueries, setSparqlQueries] = useState<
    typeof EMPIRICAL_SPARQL_QUERIES | typeof NLP4RE_SPARQL_QUERIES
  >(EMPIRICAL_SPARQL_QUERIES);
  const [templateId, setTemplateId] = useState<string>('R186491');
  const location = useLocation();

  useEffect(() => {
    const newTemplateId = location.pathname.split('/')[1];
    setTemplateId(newTemplateId);
    setPrefixes(
      newTemplateId === 'R186491' ? EMPIRICAL_PREFIXES : NLP4RE_PREFIXES
    );
    setSparqlQueries(
      newTemplateId === 'R186491'
        ? EMPIRICAL_SPARQL_QUERIES
        : NLP4RE_SPARQL_QUERIES
    );
  }, [location.pathname]);

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
    if (type === 'dataCollection') {
      if (chartSettings.detailedChartHeading) {
        //replace {label} with chart.label
        return chartSettings.detailedChartHeading.replace(
          '{label}',
          chart.label
        );
      }
      return 'number of ' + chart.label + ' used for data collection';
    } else if (type === 'dataAnalysis') {
      return 'number of ' + chart.label + ' used for data analysis';
    }
  };

  const handlePreviousChart = () => {
    setCurrentChartIndex((prev) => (prev > 0 ? prev - 1 : series.length - 1));
  };

  const handleNextChart = () => {
    setCurrentChartIndex((prev) => (prev < series.length - 1 ? prev + 1 : 0));
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
        {!query.chartSettings?.doesntHaveNormalization ? (
          <Box sx={{ mb: 3 }}>
            <ChartParamsSelector
              normalized={normalized}
              setNormalized={setNormalized}
              query={query}
            />
          </Box>
        ) : (
          <></>
        )}
        <ChartWrapper
          key={`${queryId}-chart`}
          question_id={queryId}
          dataset={processedChartDataset}
          chartSetting={{
            ...chartSettings,
            series: series,
          }}
          normalized={normalized}
          loading={false}
          defaultChartType={query.chartType ?? 'bar'}
          availableCharts={['bar', 'pie']}
        />
      </>

      {/* Charts Section */}
      {series.length > 1 && !chartSettings.hideDetailedCharts && (
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
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}
          >
            <IconButton
              onClick={handlePreviousChart}
              sx={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'white',
                boxShadow: 1,
                '&:hover': { bgcolor: 'grey.100' },
                zIndex: 1,
              }}
              aria-label="Previous chart"
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <Box
              sx={{
                width: { xs: '90vw', sm: 900, md: 1300 },
                maxWidth: 800,
                mx: 'auto',
              }}
            >
              <ChartWrapper
                question_id={queryId}
                dataset={processedChartDataset}
                chartSetting={{
                  ...chartSettings,
                  series: [series[currentChartIndex]],
                  heading: chartSettings.noHeadingInSeries
                    ? ''
                    : createHeading(series[currentChartIndex]),
                  colors: [
                    chartSettings.colors?.[currentChartIndex] ?? '#e86161',
                  ],
                  yAxis: [
                    {
                      label: chartSettings.yAxis?.[0]?.label,
                      dataKey: series[currentChartIndex].dataKey,
                    },
                  ],
                }}
                normalized={normalized}
                loading={false}
                defaultChartType={query.chartType ?? 'bar'}
                availableCharts={['bar', 'pie']}
                isSubChart={true}
              />
              {/* show the current chart index and total charts */}
              <Typography
                variant="body1"
                sx={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  mt: 2,
                  textAlign: 'center',
                }}
              >
                {currentChartIndex + 1} of {series.length}
              </Typography>
            </Box>
            <IconButton
              onClick={handleNextChart}
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'white',
                boxShadow: 1,
                '&:hover': { bgcolor: 'grey.100' },
                zIndex: 1,
              }}
              aria-label="Next chart"
            >
              <ArrowForwardIosIcon />
            </IconButton>
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
        {templateId === 'R186491' && (
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
        )}
        <Button
          href={`https://orkg.org/sparql#${encodeURIComponent(prefixes + sparqlQueries[query.uid as keyof typeof sparqlQueries])}`}
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

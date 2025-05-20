import React, { useEffect, useState } from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  DialogContentText,
  Box,
  Divider,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import MuiDataGrid from './CustomGrid';
import QuestionInformation from './QuestionInformation';
import fetchSPARQLData from '../helpers/fetch_query';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';

interface QuestionProps {
  query: Query;
}

const Question: React.FC<QuestionProps> = ({ query }) => {
  // Tabs state (only used if uid_2 exists)
  const [tab, setTab] = useState(0);

  // State for primary data (uid)
  const [data1, setData1] = useState<Record<string, unknown>[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [error1, setError1] = useState<string | null>(null);
  const [normalized1, setNormalized1] = useState(true);

  // State for secondary data (uid_2 if exists)
  const [data2, setData2] = useState<Record<string, unknown>[]>([]);
  const [loading2, setLoading2] = useState(false); // Only start loading when uid_2 exists
  const [error2, setError2] = useState<string | null>(null);
  const [normalized2, setNormalized2] = useState(true);

  // Fetch primary data (uid)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading1(true);
        setError1(null);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
        setData1(data);
      } catch (err) {
        setError1('Failed to load question data');
        console.error('Error fetching question data:', err);
      } finally {
        setLoading1(false);
      }
    };
    fetchData();
  }, [query.uid]);

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    if (!query?.uid_2) return;
    console.log('query', query);
    const fetchData = async () => {
      try {
        setLoading2(true);
        setError2(null);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid_2]);
        setData2(data);
      } catch (err) {
        setError2('Failed to load secondary data');
        console.error('Error fetching secondary data:', err);
      } finally {
        setLoading2(false);
      }
    };
    fetchData();
  }, [query, query?.uid_2]);

  console.log('data2', data2);

  // Helper to render the content for a given dataset
  const renderQueryContent = (
    questionData: Record<string, unknown>[],
    normalized: boolean,
    setNormalized: React.Dispatch<React.SetStateAction<boolean>>,
    loading: boolean,
    error: string | null,
    queryId: string // Pass the specific uid being used
  ) => {
    const detailedChartData: { dataKey: string; label: string }[] =
      query.chartSettings.series;

    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 8,
          }}
        >
          <CircularProgress sx={{ color: '#e86161', mb: 2 }} />
          <Typography color="text.secondary">
            Loading question data...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Paper
          elevation={0}
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
            {error}
          </Typography>
          <Typography color="text.secondary">
            Please try again later or contact support if the problem persists.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {/* Information Section - only show in first tab or if no uid_2 */}
        {(!query.uid_2 || queryId === query.uid) && (
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
                  information={
                    query.dataAnalysisInformation.questionExplanation
                  }
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
            </DialogContentText>
          </Paper>
        )}

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

        {/* Data Grid Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
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
            Raw Data
          </Typography>
          <MuiDataGrid questionData={questionData} />
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {query.uid_2 ? (
        <>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 2 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Primary Data" />
            <Tab label="Secondary Data" />
          </Tabs>
          <Box hidden={tab !== 0}>
            {renderQueryContent(
              data1,
              normalized1,
              setNormalized1,
              loading1,
              error1,
              query.uid
            )}
          </Box>
          <Box hidden={tab !== 1}>
            {renderQueryContent(
              data2,
              normalized2,
              setNormalized2,
              loading2,
              error2,
              query.uid_2
            )}
          </Box>
        </>
      ) : (
        renderQueryContent(
          data1,
          normalized1,
          setNormalized1,
          loading1,
          error1,
          query.uid
        )
      )}
    </Box>
  );
};

export default Question;

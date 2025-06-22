import React, { useEffect, useState } from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
} from '@mui/material';
import fetchSPARQLData from '../helpers/fetch_query';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import QuestionInformationView from './QuestionInformationView';
import QuestionChartView from './QuestionChartView';
import QuestionDataGridView from './QuestionDataGridView';
import { useAIAssistantContext } from '../context/AIAssistantContext';

interface QuestionProps {
  query: Query;
}

const Question: React.FC<QuestionProps> = ({ query }) => {
  // Tabs state
  const [tab, setTab] = useState(0);
  const { setContext } = useAIAssistantContext();

  // State for primary data (uid)
  const [dataCollection, setDataCollection] = useState<
    Record<string, unknown>[]
  >([]);
  const [loading1, setLoading1] = useState(true);
  const [error1, setError1] = useState<string | null>(null);
  const [normalized, setNormalized] = useState(true);

  // State for secondary data (uid_2 if exists)
  const [dataAnalysis, setDataAnalysis] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState<string | null>(null);

  // Update AI Assistant context when data changes
  useEffect(() => {
    if (!loading1 && !error1) {
      setContext(query, dataCollection);
    }
  }, [query, dataCollection, loading1, error1, setContext]);

  // Fetch primary data (uid)
  useEffect(() => {
    setTab(0);
    const fetchData = async () => {
      try {
        setLoading1(true);
        setError1(null);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
        setDataCollection(data);
      } catch (err) {
        setError1('Failed to load question data');
        console.error('Error fetching question data:', err);
      } finally {
        setLoading1(false);
      }
    };
    setNormalized(true);
    fetchData();
  }, [query.uid]);

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    if (query?.uid_2) {
      const fetchData = async () => {
        try {
          setLoading2(true);
          setError2(null);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid_2]);
          setDataAnalysis(data);
        } catch (err) {
          setError2('Failed to load secondary data');
          console.error('Error fetching secondary data:', err);
        } finally {
          setLoading2(false);
        }
      };
      fetchData();
    } else if (query?.uid_2_merge) {
      const fetchData = async () => {
        try {
          setLoading2(true);
          setError2(null);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid_2_merge]);
          setDataAnalysis(data);
        } catch (err) {
          setError2('Failed to load secondary data');
          console.error('Error fetching secondary data:', err);
        } finally {
          setLoading2(false);
        }
      };
      fetchData();
    }
  }, [query, query?.uid_2, query?.uid_2_merge]);

  const getProcessedChartData = () => {
    if (query.uid_2_merge) {
      return (
        query.dataProcessingFunction2?.(dataCollection ?? [], dataAnalysis) ??
        []
      );
    }
    return query.dataProcessingFunction?.(dataCollection ?? []) ?? [];
  };

  const getDataInterpretation = (tabName: string) => {
    if (Array.isArray(query.dataAnalysisInformation.dataInterpretation)) {
      if (tabName === 'dataCollection') {
        return query.dataAnalysisInformation.dataInterpretation[0];
      } else if (tabName === 'dataAnalysis') {
        return query.dataAnalysisInformation.dataInterpretation[1];
      }
    }
    return query.dataAnalysisInformation.dataInterpretation;
  };

  const renderLoadingState = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 8,
      }}
    >
      <CircularProgress sx={{ color: '#e86161', mb: 2 }} />
      <Typography color="text.secondary">Loading question data...</Typography>
    </Box>
  );

  const renderErrorState = (error: string) => (
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

  if (loading1) {
    return renderLoadingState();
  }

  if (error1) {
    return renderErrorState(error1);
  }

  return (
    <Box sx={{ width: '100%' }}>
      {query.uid_2 && (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Data Collection" />
          <Tab label="Data Analysis" />
        </Tabs>
      )}

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
        <QuestionInformationView query={query} />
        {/* Data Collection View */}
        {/* <Divider sx={{ my: 3 }} /> */}
        <Box hidden={tab !== 0}>
          {query.chartSettings && (
            <>
              <QuestionChartView
                query={query}
                normalized={normalized}
                setNormalized={setNormalized}
                queryId={query.uid}
                chartSettings={query.chartSettings}
                processedChartDataset={getProcessedChartData()}
                dataInterpretation={getDataInterpretation('dataCollection')}
                type="dataCollection"
              />
              <Divider sx={{ my: 3 }} />
            </>
          )}
          <QuestionDataGridView questionData={dataCollection} />
        </Box>

        {/* Data Analysis View */}
        {query.uid_2 && (
          <Box hidden={tab !== 1}>
            {loading2 ? (
              renderLoadingState()
            ) : error2 ? (
              renderErrorState(error2)
            ) : (
              <>
                {query.chartSettings2 ? (
                  <QuestionChartView
                    query={query}
                    normalized={normalized}
                    setNormalized={setNormalized}
                    queryId={query.uid_2}
                    chartSettings={query.chartSettings2}
                    processedChartDataset={
                      query.dataProcessingFunction2?.(dataAnalysis ?? []) ?? []
                    }
                    dataInterpretation={getDataInterpretation('dataAnalysis')}
                    type="dataAnalysis"
                  />
                ) : null}
                <Divider sx={{ my: 3 }} />
                <QuestionDataGridView questionData={dataAnalysis} />
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Question;

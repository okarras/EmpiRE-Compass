import React, { useEffect, useState } from 'react';
import { Query } from '../constants/queries_chart_info';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import fetchSPARQLData from '../helpers/fetch_query';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import QuestionInformationView from './QuestionInformationView';
import QuestionChartView from './QuestionChartView';
import QuestionDataGridView from './QuestionDataGridView';

interface QuestionProps {
  query: Query;
}

const Question: React.FC<QuestionProps> = ({ query }) => {
  // Tabs state
  const [tab, setTab] = useState(0);

  // State for primary data (uid)
  const [dataCollection, setDataCollection] = useState<Record<string, unknown>[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [error1, setError1] = useState<string | null>(null);
  const [normalized1, setNormalized1] = useState(true);

  // State for secondary data (uid_2 if exists)
  const [dataAnalysis, setDataAnalysis] = useState<Record<string, unknown>[]>([]);
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState<string | null>(null);

  // Fetch primary data (uid)
  useEffect(() => {
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
    fetchData();
  }, [query.uid]);

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    if (!query?.uid_2) return;
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
  }, [query, query?.uid_2]);

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
      <Typography color="text.secondary">
        Loading question data...
      </Typography>
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
      {/* Question Information - Always visible */}
      <QuestionInformationView query={query} questionData={dataCollection} />

      {/* Tabs for different views */}
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

      {/* Data Collection View */}
      <Box hidden={tab !== 0}>
        <QuestionChartView
          query={query}
          questionData={dataCollection}
          normalized={normalized1}
          setNormalized={setNormalized1}
          queryId={query.uid}
        />
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
              <QuestionChartView
                query={query}
                questionData={dataAnalysis}
                normalized={normalized1}
                setNormalized={setNormalized1}
                queryId={query.uid_2}
              />
              <QuestionDataGridView questionData={dataAnalysis} />
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Question;

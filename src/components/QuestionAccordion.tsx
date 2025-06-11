import {
  AccordionSummary,
  Box,
  Typography,
  Accordion,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformation from './QuestionInformation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate } from 'react-router';
import QuestionChartView from './QuestionChartView';

const QuestionAccordion = ({ query }: { query: Query }) => {
  const [normalized, setNormalized] = useState(true);
  const [tab, setTab] = useState(0);
  const [dataCollection, setDataCollection] = useState<
    Record<string, unknown>[]
  >([]);
  const [dataAnalysis, setDataAnalysis] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Fetch primary data (uid)
  useEffect(() => {
    const fetchData = async () => {
      if (!expanded) return;
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
  }, [query.uid, expanded]);

  // Fetch secondary data (uid_2) if it exists
  useEffect(() => {
    if (!expanded) return;
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
  }, [query, query?.uid_2, query?.uid_2_merge, expanded]);

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  const openQuestionPage = () => {
    navigate(`/questions/${query.id}`);
  };

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
        {error}
      </Typography>
      <Typography color="text.secondary">
        Please try again later or contact support if the problem persists.
      </Typography>
    </Box>
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        borderRadius: (theme) => `${theme.shape.borderRadius}px !important`,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 1px 4px rgba(0, 0, 0, 0.05)',
        transition: (theme) =>
          theme.transitions.create(
            ['box-shadow', 'border-color', 'background-color'],
            { duration: theme.transitions.duration.shorter }
          ),
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '16px 0',
          '&:first-of-type': {
            marginTop: 0,
          },
          '&:last-of-type': {
            marginBottom: 0,
          },
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.4)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'action.hover' : 'background.paper',
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon
            sx={{
              transition: 'transform 0.3s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: expanded ? 'primary.main' : 'text.secondary',
            }}
          />
        }
        sx={{
          padding: { xs: 2, sm: 3 },
          minHeight: 64,
          '& .MuiAccordionSummary-content': {
            margin: '0',
            gap: 2,
            alignItems: 'center',
          },
          '&.Mui-expanded': {
            minHeight: 64,
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            transition: (theme) => theme.transitions.create('color'),
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 600,
            color: expanded ? 'primary.main' : 'text.primary',
            flex: 1,
            lineHeight: 1.4,
          }}
        >
          {`${query.id}. ${query.dataAnalysisInformation.question}`}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            minWidth: 'fit-content',
          }}
        >
          <Button
            startIcon={<BarChartIcon />}
            variant="outlined"
            onClick={openQuestionPage}
            sx={{
              color: '#e86161',
              borderColor: '#e86161',
              marginLeft: '10px',
              minWidth: '15vw',
              '&:hover': {
                backgroundColor: '#e86161',
                color: 'white',
                borderColor: '#e86161',
              },
              '&.MuiButton-outlined': {
                borderColor: '#e86161',
              },
            }}
            size="small"
          >
            Question Information
          </Button>
        </Box>
      </AccordionSummary>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2 },
        }}
      >
        <QuestionInformation
          information={query.dataAnalysisInformation.requiredDataForAnalysis}
          label="Required Data for Analysis"
        />

        {query.uid_2 && (
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 2, mt: 2 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Data Collection" />
            <Tab label="Data Analysis" />
          </Tabs>
        )}

        {/* Data Collection View */}
        <Box hidden={tab !== 0}>
          {loading1 ? (
            renderLoadingState()
          ) : error1 ? (
            renderErrorState(error1)
          ) : (
            <>
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
                  />
                  <Divider sx={{ my: 3 }} />
                </>
              )}
              {/* <QuestionDataGridView questionData={dataCollection} /> */}
            </>
          )}
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
                {query.chartSettings2 && (
                  <>
                    <QuestionChartView
                      query={query}
                      normalized={normalized}
                      setNormalized={setNormalized}
                      queryId={query.uid_2}
                      chartSettings={query.chartSettings2}
                      processedChartDataset={
                        query.dataProcessingFunction2?.(dataAnalysis ?? []) ??
                        []
                      }
                      dataInterpretation={getDataInterpretation('dataAnalysis')}
                    />
                    {/* <Divider sx={{ my: 3 }} /> */}
                  </>
                )}
                {/* <QuestionDataGridView questionData={dataAnalysis} /> */}
              </>
            )}
          </Box>
        )}
      </Box>
    </Accordion>
  );
};

export default QuestionAccordion;

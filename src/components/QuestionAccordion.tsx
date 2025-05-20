import { AccordionSummary, Box, Typography, Accordion, Tabs, Tab } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformation from './QuestionInformation';
import QuestionDialog from './QuestionDialog';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const QuestionAccordion = ({ query }: { query: Query }) => {
  // Tab state for uid/uid_2
  const [tab, setTab] = useState(0);
  
  // State for primary data (uid)
  const [normalized1, setNormalized1] = useState(true);
  const [data1, setData1] = useState<Record<string, unknown>[]>([]);
  const [loading1, setLoading1] = useState(true);

  // State for secondary data (uid_2)
  const [normalized2, setNormalized2] = useState(true);
  const [data2, setData2] = useState<Record<string, unknown>[]>([]);
  const [loading2, setLoading2] = useState(false);

  const [expanded, setExpanded] = useState(false);

  // Fetch primary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading1(true);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
        setData1(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading1(false);
      }
    };

    if (expanded) {
      fetchData();
    }
  }, [query.uid, expanded]);

  // Fetch secondary data if uid_2 exists
  useEffect(() => {
    if (!query.uid_2 || !expanded) return;
    
    const fetchData = async () => {
      try {
        setLoading2(true);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid_2]);
        setData2(data);
      } catch (error) {
        console.error('Error fetching secondary data:', error);
      } finally {
        setLoading2(false);
      }
    };

    fetchData();
  }, [query.uid_2, expanded]);

  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  // Helper to render content for a dataset
  const renderContent = (
    data: Record<string, unknown>[],
    normalized: boolean,
    setNormalized: React.Dispatch<React.SetStateAction<boolean>>,
    loading: boolean,
    queryId: string
  ) => (
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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          width: '100%',
          gap: 3,
          my: 3,
        }}
      >
        <ChartParamsSelector
          normalized={normalized}
          setNormalized={setNormalized}
          query={query}
        />
        <ChartWrapper
          key={`${queryId}-chart`}
          question_id={queryId}
          dataset={query.dataProcessingFunction([...data]) ?? []}
          chartSetting={query.chartSettings}
          normalized={normalized}
          loading={loading}
          defaultChartType={query.chartType ?? 'bar'}
          availableCharts={['bar', 'pie']}
        />
      </Box>

      <QuestionInformation
        information={query.dataAnalysisInformation.dataInterpretation}
        label="Data Interpretation"
      />
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
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 1px 4px rgba(0, 0, 0, 0.05)',
        transition: (theme) => theme.transitions.create(
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
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0, 0, 0, 0.4)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: (theme) => theme.palette.mode === 'dark'
            ? 'action.hover'
            : 'background.paper',
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
          <QuestionDialog
            query={query}
            data1={data1}
            data2={data2}
            normalized1={normalized1}
            setNormalized1={setNormalized1}
            normalized2={normalized2}
            setNormalized2={setNormalized2}
          />
        </Box>
      </AccordionSummary>

      {query.uid_2 ? (
        <>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ px: 3, pt: 2 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Primary Data" />
            <Tab label="Secondary Data" />
          </Tabs>
          <Box hidden={tab !== 0}>
            {renderContent(data1, normalized1, setNormalized1, loading1, query.uid)}
          </Box>
          <Box hidden={tab !== 1}>
            {renderContent(data2, normalized2, setNormalized2, loading2, query.uid_2)}
          </Box>
        </>
      ) : (
        renderContent(data1, normalized1, setNormalized1, loading1, query.uid)
      )}
    </Accordion>
  );
};

export default QuestionAccordion;

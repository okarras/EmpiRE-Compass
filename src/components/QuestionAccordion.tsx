import { AccordionSummary, Box, Typography, Accordion } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import CustomBarChart from './CustomCharts/CustomBarChart';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformation from './QuestionInformation';
import QuestionDialog from './QuestionDialog';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const QuestionAccordion = ({ query }: { query: Query}) => {
  const [normalized, setNormalized] = useState(true);
  const [questionData, setQuestionData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
        setQuestionData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (expanded) {
      fetchData();
    }
  }, [query, expanded]);

  const handleAccordionChange = (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={handleAccordionChange}
      sx={{
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px !important',
        padding: '16px 24px',
        flexDirection: 'column',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        mb: 3,
        '&:before': {
          display: 'none',
        },
        '&:hover': {
          boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)',
        },
        '&.Mui-expanded': {
          margin: '16px 0',
          boxShadow: '0px 12px 35px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <AccordionSummary
        expandIcon={
          <ExpandMoreIcon 
            sx={{ 
              transition: 'transform 0.3s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: '#e86161'
            }} 
          />
        }
        aria-controls="panel1-content"
        id="panel1-header"
        sx={{
          '& .MuiAccordionSummary-content': {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          },
          padding: '8px 0',
          minHeight: '64px',
          '&:hover': {
            '& .MuiTypography-root': {
              color: '#e86161',
            },
          },
          '&.Mui-expanded': {
            minHeight: '64px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            marginBottom: 2,
          },
        }}
      >
        <Typography 
          variant="h6" 
          sx={{
            transition: 'color 0.3s ease',
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 600,
            color: expanded ? '#e86161' : 'text.primary',
            flex: 1,
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
            questionData={questionData}
            query={query}
            chartData={query.dataProcessingFunction(questionData) ?? []}
            normalized={normalized}
            setNormalized={setNormalized}
          />
        </Box>
      </AccordionSummary>

      <Box sx={{ py: 2 }}>
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
          <CustomBarChart
            key={`${query.uid}-barchart`}
            question_id={query.uid}
            dataset={query.dataProcessingFunction([...questionData]) ?? []}
            chartSetting={query.chartSettings}
            normalized={normalized}
            loading={loading}
          />
        </Box>

        <QuestionInformation
          information={query.dataAnalysisInformation.dataInterpretation}
          label="Data Interpretation"
        />
      </Box>
    </Accordion>
  );
};

export default QuestionAccordion;

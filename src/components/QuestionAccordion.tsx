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
        borderRadius: '10px !important',
        padding: '10px 20px',
        flexDirection: 'column',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        mb: 2,
        '&:before': {
          display: 'none',
        },
        '&:hover': {
          boxShadow: '0px 6px 25px rgba(0, 0, 0, 0.08)',
        },
        '&.Mui-expanded': {
          margin: '16px 0',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
        sx={{
          '& .MuiAccordionSummary-content': {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
          padding: '0px',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
      >
        <Typography variant="h6">{`${query.id}- ${query.dataAnalysisInformation.question}`}</Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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

      <QuestionInformation
        information={query.dataAnalysisInformation.requiredDataForAnalysis}
        label="Required Data for Analysis"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
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
          dataset={query.dataProcessingFunction([...questionData]) ?? []} // Create a new array to avoid mutation
          chartSetting={query.chartSettings}
          normalized={normalized}
          loading={loading}
        />
      </div>

      <QuestionInformation
        information={query.dataAnalysisInformation.dataInterpretation}
        label="Data Interpretation"
      />
    </Accordion>
  );
};

export default QuestionAccordion;

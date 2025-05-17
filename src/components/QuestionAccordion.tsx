import { AccordionSummary, Box, Typography, Accordion } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import ChartWrapper from './CustomCharts/ChartWrapper';
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
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '8px !important',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: 'none',
        '&:before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '0',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          padding: { xs: 2, sm: 3 },
          '& .MuiAccordionSummary-content': {
            margin: '0',
            gap: 2,
            alignItems: 'center',
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
          <ChartWrapper
            key={`${query.uid}-chart`}
            question_id={query.uid}
            dataset={query.dataProcessingFunction([...questionData]) ?? []}
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
    </Accordion>
  );
};

export default QuestionAccordion;

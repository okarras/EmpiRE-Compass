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

const Question = ({ query }: { query: Query; accordion: boolean }) => {
  const [normalized, setNormalized] = useState(true);
  const [questionData, setQuestionData] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
      setQuestionData(data);
      setLoading(false);
    };

    fetchData();
  }, [query, setQuestionData]);

  return (
    <Accordion
      sx={{
        display: 'flex',
        // justifyContent: 'center',
        // alignItems: 'center',
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '20px',
        flexDirection: 'column',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
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
          padding: '0px', // your existing padding

          //hover make bigger
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
          dataset={query.dataProcessingFunction(questionData) ?? []} // Cast the dynamic value to unknown[] to match the expected type
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

export default Question;

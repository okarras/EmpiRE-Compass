import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import CustomBarChart from './CustomCharts/CustomBarChart';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import fetchSPARQLData from '../helpers/fetch_query';

const Question = ({ query }: { query: Query }) => {
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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '20px',
        flexDirection: 'column',
      }}
    >
      <h1>{`${query.id}- ${query.dataAnalysisInformation.question}`}</h1>
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
    </Box>
  );
};

export default Question;

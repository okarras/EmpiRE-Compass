import Question from './Question';
import CustomBarChart from './CustomCharts/CustomBarChart';
import { useEffect, useState } from 'react';
import fetchSPARQLData from '../helpers/fetch_query';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import { queries } from '../constants/queries_chart_info';
import { Box } from '@mui/system';
import { Divider } from '@mui/material';

interface OrkgData {
  [key: string]: unknown[]; // Make this dynamic, allowing different keys for each query
}

const Dashboard = () => {
  const [orkgData, setOrkgData] = useState<OrkgData>({});

  useEffect(() => {
    const fetchData = async () => {
      const dataEntries = await Promise.all(
        Object.keys(SPARQL_QUERIES).map(async (query) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-expect-error
          const data = await fetchSPARQLData(SPARQL_QUERIES[query]);
          return { [query]: data };
        })
      );

      // Merge all fetched data into a single object
      const newData = Object.assign({}, ...dataEntries);

      // Update state properly
      setOrkgData(newData);
    };

    fetchData();
  }, []);

  if (Object.keys(orkgData).length === 0) {
    return <div>Loading...</div>;
  }
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        flexGrow: 1,
        flexDirection: 'column',
      }}
    >
      {queries.map((query, index) => (
        <>
          <Question
            key={index}
            dataAnalysisInformation={query.dataAnalysisInformation}
          >
            {/* TODO: for each query, the chart can be different */}
            <>
              {query.chartSettings.map((chart, index) => {
                return (
                  <CustomBarChart
                    key={index}
                    question_id={query.uid}
                    dataset={
                      query.dataProcessingFunction(
                        orkgData[query.uid] as { year: number }[],
                        query.uid
                      ) ?? []
                    } // Cast the dynamic value to unknown[] to match the expected type
                    chartSetting={chart}
                  />
                );
              })}
            </>
          </Question>
          <Divider
            variant="fullWidth"
            sx={{
              backgroundColor: 'black',
            }}
          />
        </>
      ))}
    </Box>
  );
};

export default Dashboard;

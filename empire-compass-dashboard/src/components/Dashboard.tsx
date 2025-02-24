import Question from './Question';
import CustomBarChart from './CustomCharts/CustomBarChart';
import { useEffect, useState } from 'react';
import fetchSPARQLData from '../helpers/fetch_query';
import { query_1 } from '../queries/queries';
import { queries } from '../constants/queries_chart_info';

interface OrkgData {
  [key: string]: unknown[]; // Make this dynamic, allowing different keys for each query
}

const Dashboard = () => {
  const [orkgData, setOrkgData] = useState<OrkgData>({
    query_1: [],
  });

  useEffect(() => {
    fetchSPARQLData(query_1).then((data) => {
      setOrkgData((prevData) => ({ ...prevData, query_1: data }));
    });
  }, []);

  return (
    <>
      {queries.map((query, index) => (
        <Question key={index} dataAnalysisInformation={query.dataAnalysisInformation}>
          {/* TODO: for each query, the chart can be different */}
          <CustomBarChart
            dataset={query.dataProcessingFunction(
              orkgData[query.uid] as {year: number}[]
            )} // Cast the dynamic value to unknown[] to match the expected type
            chartSetting={query.chartSetting}
          />
        </Question>
      ))}
    </>
  );
};

export default Dashboard;

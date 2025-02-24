import Question from './Question';
import CustomBarChart from './CustomCharts/CustomBarChart';
import { useEffect, useState } from 'react';
import fetchSPARQLData from '../helpers/fetch_query';
import { query_1 } from '../queries/queries';
import { query_1_chart_info } from '../constants/queries_chart_info';

const Dashboard = () => {
  const [orkgData, setOrkgData] = useState({
    query_1: [],
  });

  useEffect(() => {
    fetchSPARQLData(query_1).then((data) => {
      setOrkgData({ query_1: data });
    });
  }, []);

  return (
    <Question>
      <CustomBarChart
        dataset={query_1_chart_info.dataProcessingFunction(orkgData.query_1)}
        chartSetting={query_1_chart_info.chartSetting}
      />
    </Question>
  );
};

export default Dashboard;

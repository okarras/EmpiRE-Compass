/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart';

interface CustomBarChartInterface {
  dataset: any[];
  chartSetting: any;
}

const CustomBarChart = (props: CustomBarChartInterface) => {
  const { dataset, chartSetting } = props;

  return (
    <BarChart
      dataset={dataset}
      {...chartSetting}
    />
    
  );
};

export default CustomBarChart;

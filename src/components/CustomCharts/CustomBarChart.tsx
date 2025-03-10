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
      xAxis={[
        {
          scaleType: 'band',
          dataKey: 'year',
          valueFormatter: (v) => v.toString(),
          tickPlacement: 'middle',
        },
      ]}
      {...chartSetting}
      colors={['#e86161']}
    />
  );
};

export default CustomBarChart;

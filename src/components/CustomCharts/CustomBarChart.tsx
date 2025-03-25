/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart';

interface CustomBarChartInterface {
  dataset: any[];
  chartSetting: any;
}

const CustomBarChart = (props: CustomBarChartInterface) => {
  const { dataset, chartSetting } = props;

  return (
    <div className={chartSetting.className} style={{ width: chartSetting.layout == 'horizontal' ? '80%' : 'auto', margin: chartSetting.layout == 'horizontal' ? 'auto' : '',  }} >
      <h4 style={{textAlign: 'center'}}> {chartSetting.heading} </h4>
      <BarChart
        dataset={dataset}
        {...chartSetting}
      />
    </div>
  );
};

export default CustomBarChart;

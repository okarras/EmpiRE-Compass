/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart';

interface CustomBarChartInterface {
  dataset: any[];
  chartSetting: any;
  question_id: string;
}

const CustomBarChart = (props: CustomBarChartInterface) => {
  const { dataset, chartSetting, question_id } = props;

  return (
    <div
      className={chartSetting.className}
      style={{
        width: chartSetting.layout == 'horizontal' ? '80%' : 'auto',
        margin: chartSetting.layout == 'horizontal' ? 'auto' : '',
      }}
      id={`chart-${question_id}`}
    >
      <h4 style={{ textAlign: 'center' }}> {chartSetting.heading} </h4>
      <BarChart dataset={dataset} {...chartSetting} colors={['#e86161']} />
    </div>
  );
};

export default CustomBarChart;

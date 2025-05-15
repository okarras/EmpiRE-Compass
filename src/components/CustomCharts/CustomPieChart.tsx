import { PieChart } from '@mui/x-charts/PieChart';
import { ChartSetting } from '../../constants/queries_chart_info';

interface CustomPieChartInterface {
  dataset: Array<{
    [key: string]: string | number;
  }>;
  chartSetting: ChartSetting;
  question_id: string;
  loading: boolean;
}

const CustomPieChart = (props: CustomPieChartInterface) => {
  const { dataset, chartSetting, question_id, loading } = props;
  console.log('CustomPieChart', chartSetting, dataset);

  return (
    <div className={chartSetting.className} id={`chart-${question_id}`}>
      <h4 style={{ textAlign: 'center' }}> {chartSetting.heading} </h4>
      <PieChart
        colors={chartSetting.colors ?? ['#e86161']}
        loading={loading}
        {...chartSetting}
      />
    </div>
  );
};

export default CustomPieChart;

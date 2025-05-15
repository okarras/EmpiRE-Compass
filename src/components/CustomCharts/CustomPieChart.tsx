/* eslint-disable @typescript-eslint/no-explicit-any */
import { PieChart } from '@mui/x-charts/PieChart';

interface CustomPieChartInterface {
  dataset: any[];
  chartSetting: any;
  question_id: string;
  loading: boolean;
}

const CustomPieChart = (props: CustomPieChartInterface) => {
  const { dataset, chartSetting, question_id, loading } = props;
  console.log('CustomPieChart', chartSetting, dataset);

  return (
    <div
      className={chartSetting.className}
      id={`chart-${question_id}`}
    >
      <h4 style={{ textAlign: 'center' }}> {chartSetting.heading} </h4>
      <PieChart
        series={[
          {
            data: dataset,
            innerRadius: chartSetting.innerRadius ?? 0,
            outerRadius: chartSetting.outerRadius ?? 100,
            paddingAngle: chartSetting.paddingAngle ?? 2,
            cornerRadius: chartSetting.cornerRadius ?? 0,
          },
        ]}
        colors={chartSetting.colors ?? ['#e86161']}
        loading={loading}
        {...chartSetting}
      />
    </div>
  );
};

export default CustomPieChart;

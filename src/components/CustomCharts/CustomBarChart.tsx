/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart';

interface CustomBarChartInterface {
  dataset: any[];
  chartSetting: any;
  question_id: string;
  normalized: boolean;
  loading: boolean
}

const CustomBarChart = (props: CustomBarChartInterface) => {
  const { dataset, chartSetting, question_id, loading, normalized } = props;

  return (
    <div
      className={chartSetting.className}
      style={{
        width: chartSetting.layout === 'horizontal' ? '80%' : 'auto',
        margin: chartSetting.layout === 'horizontal' ? 'auto' : '',
      }}
      id={`chart-${question_id}`}
    >
      <h4 style={{ textAlign: 'center' }}> {chartSetting.heading} </h4>
      <BarChart
        dataset={dataset}
        {...chartSetting} // Spread existing settings first
        series={chartSetting.series.map((s: Record<string, unknown>) => ({
          ...s,
          dataKey: normalized ? s.dataKey : 'count', // Override dataKey based on normalized
        }))}
        colors={['#e86161']}
        loading={loading}
      />
    </div>
  );
};
export default CustomBarChart;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart';

interface CustomBarChartInterface {
  dataset: any[];
  chartSetting: any;
  question_id: string;
  normalized: boolean;
  loading: boolean;
  isSubChart?: boolean;
}

const CustomBarChart = (props: CustomBarChartInterface) => {
  const {
    dataset,
    chartSetting,
    question_id,
    loading,
    normalized,
    isSubChart = false,
  } = props;
  const hasMultipleSubCharts = chartSetting.series.length > 1;

  return (
    <div
      className={chartSetting.className}
      style={{
        width: chartSetting.layout === 'horizontal' ? '80%' : 'auto',
        margin: chartSetting.layout === 'horizontal' ? 'auto' : '',
      }}
      id={`chart-${question_id}`}
    >
      <h4 style={{ textAlign: 'center' }}>
        {normalized ? 'Relative ' : 'Absolute '}
        {chartSetting.heading}
      </h4>
      <BarChart
        dataset={dataset}
        {...chartSetting}
        series={chartSetting.series.map((s: Record<string, unknown>) => ({
          ...s,
          dataKey:
            normalized || hasMultipleSubCharts || isSubChart
              ? s.dataKey
              : 'count',
        }))}
        colors={chartSetting.colors ?? ['#e86161']}
        loading={loading}
      />
    </div>
  );
};

export default CustomBarChart;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ScatterChart } from '@mui/x-charts/ScatterChart';

interface CustomScatterInterface {
  dataset: any[];
  chartSetting: any;
  question_id: string;
  normalized?: boolean;
  loading: boolean;
}

const CustomScatterChart = ({
  dataset = [],
  chartSetting = {},
  question_id,
  normalized = false,
  loading,
}: CustomScatterInterface) => {
  return (
    <div
      className={chartSetting.className}
      style={{
        width: chartSetting.layout === 'horizontal' ? '80%' : 'auto',
        margin: chartSetting.layout === 'horizontal' ? 'auto' : '',
      }}
      id={`chart-${question_id}`}
    >
      {!chartSetting.noHeadingInSeries && (
        <h4 style={{ textAlign: 'center' }}>
          {normalized ? 'Relative ' : 'Absolute '}
          {chartSetting.heading}
        </h4>
      )}

      <ScatterChart
        dataset={dataset}
        {...chartSetting}
        series={chartSetting.series}
        grid={{ vertical: true, horizontal: true }}
        height={chartSetting.height ?? 360}
        margin={chartSetting.margin}
        loading={loading}
        slotProps={{
          legend: {
            labelStyle: { fontSize: 15 },
            itemMarkHeight: 14,
            itemMarkWidth: 14,
          },
        }}
      />
    </div>
  );
};

export default CustomScatterChart;

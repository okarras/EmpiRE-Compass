/* eslint-disable @typescript-eslint/no-explicit-any */
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import { createLabelFormatter } from '../../utils/chartUtils';

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
  const labelFormatter = createLabelFormatter(chartSetting, dataset.length);
  const xAxisWithFormatter = chartSetting.xAxis?.map((axis: any) => {
    const originalFormatter = axis.valueFormatter;
    const labelMap = axis.labelMap;

    return {
      ...axis,
      valueFormatter: originalFormatter
        ? (value: any, context: any) => {
            if (context?.location === 'tooltip') {
              return originalFormatter
                ? originalFormatter(value, context)
                : String(value);
            }
            const formatted = originalFormatter
              ? originalFormatter(value, context)
              : String(value);
            return labelFormatter(formatted);
          }
        : (value: any, context: any) => {
            if (context?.location === 'tooltip') {
              if (labelMap) {
                const key = String(Math.round(value));
                return labelMap[key] || String(value);
              }
              return String(value);
            }
            let displayValue = String(value);
            if (labelMap) {
              const key = String(Math.round(value));
              if (!labelMap[key]) {
                return '';
              }
              displayValue = labelMap[key];
            }
            return labelFormatter(displayValue);
          },
    };
  });

  const yAxisWithFormatter = chartSetting.yAxis?.map((axis: any) => {
    const originalFormatter = axis.valueFormatter;
    return {
      ...axis,
      valueFormatter: originalFormatter
        ? (value: any, context: any) => {
            if (context?.location === 'tooltip') {
              return originalFormatter
                ? originalFormatter(value, context)
                : String(value);
            }
            const formatted = originalFormatter
              ? originalFormatter(value, context)
              : String(value);
            return labelFormatter(formatted);
          }
        : (value: any, context: any) => {
            if (context?.location === 'tooltip') {
              return String(value);
            }
            return labelFormatter(value);
          },
    };
  });

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
          {!chartSetting.doesntHaveNormalization &&
            (normalized ? 'Relative ' : 'Absolute ')}
          {chartSetting.heading}
        </h4>
      )}

      <ScatterChart
        dataset={dataset}
        {...chartSetting}
        xAxis={xAxisWithFormatter}
        yAxis={yAxisWithFormatter}
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart';
import { createLabelFormatter } from '../../utils/chartUtils';

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

  const labelFormatter = createLabelFormatter(chartSetting, dataset.length);

  const xAxisWithFormatter = chartSetting.xAxis?.map((axis: any) => {
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
      <BarChart
        dataset={dataset}
        {...chartSetting}
        xAxis={xAxisWithFormatter}
        yAxis={yAxisWithFormatter}
        series={chartSetting.series.map((s: Record<string, unknown>) => ({
          ...s,
          dataKey:
            normalized || hasMultipleSubCharts || isSubChart
              ? s.dataKey
              : 'count',
        }))}
        colors={chartSetting.colors ?? ['#e86161']}
        loading={loading}
        slotProps={{
          legend: {
            hidden: isSubChart && chartSetting.hideDetailedChartLegend,
            labelStyle: {
              fontSize: 15, // or '10px'
            },
            itemMarkHeight: 15,
            itemMarkWidth: 15,
          },
        }}
      />
    </div>
  );
};

export default CustomBarChart;

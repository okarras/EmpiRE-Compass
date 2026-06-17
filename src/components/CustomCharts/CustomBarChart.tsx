/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import type { BarItemIdentifier } from '@mui/x-charts/models';
import { createLabelFormatter } from '../../utils/chartUtils';
import BarChartPapersDialog from './BarChartPapersDialog';

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

  const [papersDialog, setPapersDialog] = useState<{
    open: boolean;
    itemsInGroup: Record<string, unknown>[];
    barTitle: string;
  }>({ open: false, itemsInGroup: [], barTitle: '' });

  const mappedSeries = React.useMemo(() => {
    return chartSetting.series.map((s: any, index: number) => ({
      ...s,
      id: s.id ?? `series-${index}`,
      dataKey:
        normalized || hasMultipleSubCharts || isSubChart ? s.dataKey : 'count',
    }));
  }, [chartSetting.series, normalized, hasMultipleSubCharts, isSubChart]);

  const handleBarItemClick = useCallback(
    (
      _event: React.MouseEvent<SVGElement, MouseEvent>,
      item: BarItemIdentifier
    ) => {
      const row = dataset?.[item.dataIndex];
      if (!row || typeof row !== 'object') return;

      const recordRow = row as Record<string, unknown>;
      let itemsToUse = recordRow.itemsInGroup;

      // try using series specific items if they exist
      if (
        recordRow.itemsBySeries &&
        typeof recordRow.itemsBySeries === 'object'
      ) {
        const itemsBySeries = recordRow.itemsBySeries as Record<
          string,
          unknown[]
        >;
        const seriesKey =
          mappedSeries.find((s: any) => s.id === item.seriesId)?.dataKey ||
          item.seriesId;

        if (itemsBySeries[seriesKey as string]) {
          itemsToUse = itemsBySeries[seriesKey as string];
        }
      }

      if (!Array.isArray(itemsToUse) || itemsToUse.length === 0) return;

      const xKey = chartSetting.xAxis?.[0]?.dataKey ?? 'year';
      const barTitle =
        recordRow[xKey] != null
          ? String(recordRow[xKey])
          : `Item ${item.dataIndex}`;

      setPapersDialog({
        open: true,
        itemsInGroup: itemsToUse as Record<string, unknown>[],
        barTitle,
      });
    },
    [dataset, chartSetting.xAxis, mappedSeries]
  );

  const closePapersDialog = useCallback(() => {
    setPapersDialog((d) => ({ ...d, open: false }));
  }, []);

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
        series={mappedSeries}
        colors={chartSetting.colors ?? ['#e86161']}
        loading={loading}
        onItemClick={handleBarItemClick}
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
      <BarChartPapersDialog
        open={papersDialog.open}
        onClose={closePapersDialog}
        barTitle={papersDialog.barTitle}
        itemsInGroup={papersDialog.itemsInGroup}
      />
    </div>
  );
};

export default CustomBarChart;

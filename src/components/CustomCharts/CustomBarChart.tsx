/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import type { BarItemIdentifier } from '@mui/x-charts/models';
import {
  createLabelFormatter,
  calculateDynamicNormalizedDataset,
} from '../../utils/chartUtils';
import BarChartPapersDialog from './BarChartPapersDialog';

interface ChartDatasetRow {
  itemsInGroup?: Record<string, unknown>[];
  itemsBySeries?: Record<string, Record<string, unknown>[]>;
  [key: string]: unknown;
}

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

  const computedDataset = React.useMemo(() => {
    return calculateDynamicNormalizedDataset(
      dataset,
      chartSetting.series,
      normalized
    );
  }, [dataset, chartSetting.series, normalized]);

  const handleBarItemClick = useCallback(
    (
      _event: React.MouseEvent<SVGElement, MouseEvent>,
      item: BarItemIdentifier
    ) => {
      const row = computedDataset?.[item.dataIndex] as ChartDatasetRow;
      if (!row || typeof row !== 'object') return;

      let itemsToUse = row.itemsInGroup;

      // try using series specific items if they exist
      if (row.itemsBySeries && typeof row.itemsBySeries === 'object') {
        const itemsBySeries = row.itemsBySeries as Record<
          string,
          Record<string, unknown>[]
        >;
        const seriesKey =
          mappedSeries.find((s: any) => s.id === item.seriesId)?.dataKey ||
          item.seriesId;

        // Papers are stored under absolute keys, map normalized keys back to retrieve them.
        const absoluteKey =
          typeof seriesKey === 'string' && seriesKey.startsWith('normalized_')
            ? seriesKey.replace('normalized_', '')
            : seriesKey === 'normalizedRatio'
              ? 'count'
              : seriesKey;

        if (itemsBySeries[seriesKey as string]) {
          itemsToUse = itemsBySeries[seriesKey as string];
        } else if (itemsBySeries[absoluteKey as string]) {
          itemsToUse = itemsBySeries[absoluteKey as string];
        }
      }

      if (!Array.isArray(itemsToUse) || itemsToUse.length === 0) return;

      const xKey = chartSetting.xAxis?.[0]?.dataKey ?? 'year';
      const barTitle =
        row[xKey] != null ? String(row[xKey]) : `Item ${item.dataIndex}`;

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
        dataset={computedDataset}
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

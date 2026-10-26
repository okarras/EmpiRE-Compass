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

  const handleBarItemClick = useCallback(
    (
      _event: React.MouseEvent<SVGElement, MouseEvent>,
      item: BarItemIdentifier
    ) => {
      const row = dataset?.[item.dataIndex];
      if (!row || typeof row !== 'object') return;
      const itemsInGroup = (row as Record<string, unknown>).itemsInGroup;
      if (!Array.isArray(itemsInGroup) || itemsInGroup.length === 0) return;
      const xKey = chartSetting.xAxis?.[0]?.dataKey ?? 'year';
      const barTitle =
        (row as Record<string, unknown>)[xKey] != null
          ? String((row as Record<string, unknown>)[xKey])
          : `Item ${item.dataIndex}`;
      setPapersDialog({
        open: true,
        itemsInGroup: itemsInGroup as Record<string, unknown>[],
        barTitle,
      });
    },
    [dataset, chartSetting.xAxis]
  );

  const closePapersDialog = useCallback(() => {
    setPapersDialog((d) => ({ ...d, open: false }));
  }, []);

  const barSeries = chartSetting.series.map(
    (series: Record<string, unknown>, index: number) => ({
      ...series,
      id: series.id ?? index,
      dataKey:
        normalized || hasMultipleSubCharts || isSubChart
          ? series.dataKey
          : 'count',
    })
  );
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
        series={barSeries}
        colors={chartSetting.colors ?? ['#e86161']}
        loading={loading}
        onItemClick={handleBarItemClick}
        slotProps={{
          bar: ({ id, dataIndex }) => {
            const series = barSeries.find(
              (item: { id: unknown }) => item.id === id
            );
            const row = dataset[dataIndex];
            if (!series || !row) return {};

            const categoryKey =
              chartSetting.layout === 'horizontal'
                ? chartSetting.yAxis?.[0]?.dataKey
                : chartSetting.xAxis?.[0]?.dataKey;

            const value = row[series.dataKey];
            if (value == null) return {};

            const label =
              typeof series.label === 'function'
                ? series.label('tooltip')
                : series.label;

            const formattedValue = series.valueFormatter
              ? series.valueFormatter(value, { dataIndex })
              : String(value);

            const text = [row[categoryKey ?? 'year'], label, formattedValue]
              .filter((part) => part != null && part !== '')
              .join(' · ');

            return { children: <title>{text}</title> };
          },
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

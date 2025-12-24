import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
  VictoryAxis,
  VictoryBoxPlot,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryScatter,
  VictoryTooltip,
} from 'victory';
import { createLabelFormatter } from '../../utils/chartUtils';

type BoxItem = { label: string; values: number[] };

type AxisSetting = {
  dataKey?: string;
  label?: string;
};

type MarginSetting = Partial<{
  top: number;
  right: number;
  bottom: number;
  left: number;
}>;

type TextAnchor = 'start' | 'middle' | 'end' | 'inherit';

interface BoxPlotChartSetting {
  height?: number;
  width?: number;
  margin?: MarginSetting;
  barWidth?: number;
  showOutliers?: boolean;
  heading?: string;
  labelRotate?: number;
  labelAnchor?: TextAnchor;
  colors?: string[];
  xAxis?: AxisSetting[];
  yAxis?: AxisSetting[];
  series?: Array<{ dataKey?: string }>;
  maxLabelLength?: number | 'auto';
  layout?: string;
  sx?: Record<string, unknown>;
}

type RawDatum = Record<string, unknown>;

interface Props {
  dataset: RawDatum[];
  chartSetting?: BoxPlotChartSetting;
  question_id?: string;
  loading?: boolean;
}

const quantile = (a: number[], q: number) => {
  if (!a.length) return 0;
  const p = (a.length - 1) * q;
  const lo = Math.floor(p);
  const hi = Math.ceil(p);
  const w = p - lo;
  return hi === lo ? a[lo] : a[lo] * (1 - w) + a[hi] * w;
};

const summarize = (vals: number[]) => {
  const v = vals.filter(Number.isFinite).sort((x, y) => x - y);
  if (!v.length)
    return { min: 0, q1: 0, med: 0, q3: 0, max: 0, outliers: [] as number[] };
  const q1 = quantile(v, 0.25);
  const med = quantile(v, 0.5);
  const q3 = quantile(v, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const nonOut = v.filter((x) => x >= lower && x <= upper);
  return {
    min: nonOut.length ? Math.min(...nonOut) : v[0],
    q1,
    med,
    q3,
    max: nonOut.length ? Math.max(...nonOut) : v[v.length - 1],
    outliers: v.filter((x) => x < lower || x > upper),
  };
};

const finiteOrUndefined = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

type BoxDatum = {
  x: string;
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  color: string;
  outliers: number[];
};

type OutlierDatum = { x: string; y: number; color: string };

const CUSTOM_X_LABELS = [
  'Approach',
  'Evaluation',
  'NLP Task',
  'NLP Dataset',
  'Annotation',
];

export default function CustomBoxPlot({
  dataset = [],
  chartSetting,
  question_id = 'boxplot',
  loading = false,
}: Props) {
  const config: BoxPlotChartSetting = chartSetting ?? {};
  const labelKey = config.xAxis?.[0]?.dataKey ?? 'label';
  const valuesKey = config.series?.[0]?.dataKey ?? 'values';

  const series = useMemo<BoxItem[]>(() => {
    if (!Array.isArray(dataset) || dataset.length === 0) return [];
    const s0 = dataset[0] as RawDatum | undefined;
    if (
      s0 &&
      Array.isArray((s0 as { values?: unknown }).values) &&
      typeof (s0 as { label?: unknown }).label === 'string'
    ) {
      return dataset.map((s) => {
        const entry = s as { label?: unknown; values?: unknown };
        const values = Array.isArray(entry.values) ? entry.values : [];
        return {
          label: String(entry.label ?? ''),
          values: values.map(Number).filter(Number.isFinite),
        };
      });
    }
    return dataset
      .map((record) => {
        const dataRecord = record as RawDatum & {
          label?: unknown;
          values?: unknown;
        };
        const label =
          (dataRecord[labelKey] as unknown) ?? dataRecord.label ?? null;
        const values =
          (dataRecord[valuesKey] as unknown) ?? dataRecord.values ?? null;
        if (!label) return null;
        return {
          label: String(label),
          values: Array.isArray(values)
            ? values.map(Number).filter(Number.isFinite)
            : [],
        };
      })
      .filter((x): x is BoxItem => x !== null);
  }, [dataset, labelKey, valuesKey]);

  const containerHeight = finiteOrUndefined(config.height) ?? 400;
  const margin = {
    top: 40,
    left: 140,
    right: 0,
    bottom: 80,
    ...(config.margin ?? {}),
  };

  const boxSpacingMultiplier = 2.5;
  const nBoxes = Math.max(1, series.length);
  const computedFallbackWidth =
    margin.left +
    Math.max(1, nBoxes) * (48 * boxSpacingMultiplier) +
    margin.right;
  const widthValue = finiteOrUndefined(config.width);
  const containerTotalWidth =
    widthValue ??
    (typeof window !== 'undefined'
      ? Math.max(600, Math.min(window.innerWidth - 40, computedFallbackWidth))
      : computedFallbackWidth);

  const availablePlotWidth = Math.max(
    48,
    containerTotalWidth - (margin.left + margin.right)
  );
  const providedWidth = finiteOrUndefined(config.barWidth);

  const rawAutoBox = Math.max(
    6,
    Math.floor(availablePlotWidth / (nBoxes * boxSpacingMultiplier))
  );

  const effectiveBoxWidth: number = providedWidth ?? rawAutoBox;

  const effectiveShowOutliers: boolean = config.showOutliers ?? true;

  const spacing = effectiveBoxWidth * boxSpacingMultiplier;
  const plotWidth = Math.max(1, series.length) * spacing;
  const computedSvgW = margin.left + plotWidth + margin.right;
  const svgW = widthValue ?? computedSvgW;
  const svgH = containerHeight;

  const allValues = series.flatMap((s) => s.values);
  const dataMin = allValues.length ? Math.min(...allValues) : 0;
  const dataMax = allValues.length ? Math.max(...allValues) : 1;
  const [domainMin, domainMax] = useMemo(() => {
    if (!allValues.length) return [0, 1];
    if (dataMin === dataMax) {
      const delta = Math.abs(dataMin) || 1;
      return [dataMin - delta * 0.5, dataMax + delta * 0.5];
    }
    return [dataMin, dataMax];
  }, [allValues.length, dataMin, dataMax]);

  const colorPalette = useMemo<string[]>(
    () => (config.colors?.length ? config.colors : ['#e86161']),
    [config.colors]
  );

  const boxData = useMemo<BoxDatum[]>(() => {
    return series.map((s, idx) => {
      const stats = summarize(s.values);
      const color = colorPalette[idx % colorPalette.length];
      const tooltipLabel = `Min: ${stats.min.toFixed(2)}\nQ1: ${stats.q1.toFixed(2)}\nMedian: ${stats.med.toFixed(2)}\nQ3: ${stats.q3.toFixed(2)}\nMax: ${stats.max.toFixed(2)}`;

      return {
        x: s.label,
        label: tooltipLabel,
        min: stats.min,
        q1: stats.q1,
        median: stats.med,
        q3: stats.q3,
        max: stats.max,
        color,
        outliers: stats.outliers,
      };
    });
  }, [series, colorPalette]);

  const outlierData = useMemo<OutlierDatum[]>(() => {
    if (!effectiveShowOutliers) return [];
    return boxData.flatMap((datum) =>
      datum.outliers.map((value) => ({
        x: datum.x,
        y: value,
        color: datum.color,
      }))
    );
  }, [boxData, effectiveShowOutliers]);

  // Create a separate dataset for tooltips using the median point
  const tooltipData = useMemo(() => {
    return boxData.map((d) => ({
      x: d.x,
      y: d.median, // Position tooltip at the median
      label: d.label,
      color: d.color,
    }));
  }, [boxData]);

  if (loading)
    return <Box sx={{ p: 2, textAlign: 'center' }}>Loading boxplot...</Box>;
  if (!series.length)
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        No data available for boxplot
      </Box>
    );

  const rotateAngle = config.labelRotate ?? -25;
  const textAnchor = config.labelAnchor ?? 'end';
  const xAxisLabel = config.xAxis?.[0]?.label;
  const yAxisLabel = config.yAxis?.[0]?.label;

  const labelFormatter = createLabelFormatter(config as any, series.length);

  return (
    <Box
      id={`chart-${question_id}`}
      sx={{
        width: '100%',
        height: '100%',
        overflowX: 'auto',
        p: 2,
        background: 'white',
        borderRadius: 1,
      }}
    >
      {config.heading && (
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
          {config.heading}
        </Typography>
      )}

      <Box
        sx={{
          width: '100%',
          minWidth: computedSvgW,
        }}
      >
        <VictoryChart
          width={svgW}
          height={svgH}
          padding={margin}
          domain={{ y: [domainMin, domainMax] }}
          containerComponent={<VictoryContainer responsive={false} />}
          domainPadding={{ x: Math.max(12, spacing / 2), y: 12 }}
        >
          <VictoryAxis
            style={{
              axisLabel: { fontSize: 14, fontWeight: 600, padding: 40 },
              tickLabels: {
                angle: rotateAngle,
                textAnchor,
                fontSize: 11,
                padding: 20,
              },
              ticks: { size: 0 },
            }}
            tickValues={series.map((s) => s.label)}
            tickFormat={(tick: any, index: number) => {
              // Use custom labels if available for the index, otherwise fallback to formatter
              if (
                series.length === CUSTOM_X_LABELS.length &&
                index < CUSTOM_X_LABELS.length
              ) {
                return CUSTOM_X_LABELS[index];
              }
              return labelFormatter(tick);
            }}
            label={xAxisLabel}
            axisLabelComponent={<VictoryLabel dy={55} />}
          />
          <VictoryAxis
            dependentAxis
            tickCount={6}
            tickFormat={(tick: number) =>
              Number.isFinite(tick) ? labelFormatter(tick.toFixed(0)) : '0'
            }
            style={{
              axisLabel: { fontSize: 14, fontWeight: 600, padding: 50 },
              grid: { stroke: '#eee' },
              tickLabels: { fontSize: 11, padding: 6 },
            }}
            label={yAxisLabel}
            axisLabelComponent={<VictoryLabel dx={-50} angle={-90} />}
          />

          <VictoryBoxPlot
            data={boxData}
            boxWidth={effectiveBoxWidth}
            whiskerWidth={Math.max(2, Math.floor(effectiveBoxWidth * 0.4))}
            style={{
              min: { stroke: '#333', strokeWidth: 1 },
              max: { stroke: '#333', strokeWidth: 1 },
              median: {
                stroke: ({ datum }) => datum.color,
                strokeWidth: 2,
              },
              q1: {
                fill: '#fff',
                stroke: ({ datum }) => datum.color,
                strokeWidth: 1.5,
              },
              q3: {
                fill: '#fff',
                stroke: ({ datum }) => datum.color,
                strokeWidth: 1.5,
              },
            }}
          />

          {effectiveShowOutliers && outlierData.length > 0 && (
            <VictoryScatter
              data={outlierData}
              size={4}
              style={{
                data: {
                  fill: ({ datum }) => datum.color,
                  stroke: '#333',
                  strokeWidth: 1,
                },
              }}
            />
          )}

          {/* Transparent Scatter for Tooltips */}
          <VictoryScatter
            data={tooltipData}
            size={effectiveBoxWidth / 2} // Make touch target large enough (half box width)
            style={{
              data: {
                fill: 'transparent',
                strokeWidth: 0,
                cursor: 'pointer',
              },
            }}
            labels={({ datum }) => datum.label}
            labelComponent={
              <VictoryTooltip
                orientation="top"
                pointerLength={0}
                flyoutStyle={{
                  stroke: '#e86161',
                  fill: 'white',
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                }}
                style={{
                  fontSize: 10,
                  fill: '#333',
                  textAnchor: 'middle',
                }}
              />
            }
          />
        </VictoryChart>
      </Box>
    </Box>
  );
}

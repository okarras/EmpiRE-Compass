import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

type BoxItem = { label: string; values: number[] };

interface Props {
  dataset: any[];
  chartSetting?: any;
  question_id?: string;
  loading?: boolean;
}

const quantile = (a: number[], q: number) => {
  if (!a.length) return 0;
  const p = (a.length - 1) * q;
  const lo = Math.floor(p),
    hi = Math.ceil(p);
  const w = p - lo;
  return hi === lo ? a[lo] : a[lo] * (1 - w) + a[hi] * w;
};

const summarize = (vals: number[]) => {
  const v = vals.filter(Number.isFinite).sort((x, y) => x - y);
  if (!v.length)
    return { min: 0, q1: 0, med: 0, q3: 0, max: 0, outliers: [] as number[] };
  const q1 = quantile(v, 0.25),
    med = quantile(v, 0.5),
    q3 = quantile(v, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr,
    upper = q3 + 1.5 * iqr;
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

export default function CustomBoxPlot({
  dataset = [],
  chartSetting = {},
  question_id = 'boxplot',
  loading = false,
}: Props) {
  const labelKey = chartSetting?.xAxis?.[0]?.dataKey ?? 'label';
  const valuesKey = chartSetting?.series?.[0]?.dataKey ?? 'values';

  const series = useMemo<BoxItem[]>(() => {
    if (!Array.isArray(dataset) || dataset.length === 0) return [];
    const s0 = dataset[0];
    if (s0 && Array.isArray(s0.values) && typeof s0.label === 'string') {
      return dataset.map((s: any) => ({
        label: String(s.label),
        values: (s.values || []).map(Number).filter(Number.isFinite),
      }));
    }
    return dataset
      .map((r: any) => {
        const label = r?.[labelKey] ?? r?.label;
        const values = r?.[valuesKey] ?? r?.values;
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

  const containerHeight = Number.isFinite(chartSetting?.height)
    ? chartSetting.height
    : 400;
  const margin = {
    top: 40,
    left: 140,
    right: 0,
    bottom: 80,
    ...(chartSetting?.margin ?? {}),
  };

  const plotHeight = Math.max(
    40,
    containerHeight - (margin.top + margin.bottom)
  );

  const all = series.flatMap((s) => s.values);
  const dataMin = all.length ? Math.min(...all) : 0;
  const dataMax = all.length ? Math.max(...all) : 1;

  const boxSpacingMultiplier = 2.5;
  const nBoxes = Math.max(1, series.length);
  const computedFallbackWidth =
    margin.left +
    Math.max(1, nBoxes) * (48 * boxSpacingMultiplier) +
    margin.right;
  const containerTotalWidth = Number.isFinite(chartSetting?.width)
    ? chartSetting.width
    : typeof window !== 'undefined'
      ? Math.max(600, Math.min(window.innerWidth - 40, computedFallbackWidth))
      : computedFallbackWidth;

  const availablePlotWidth = Math.max(
    48,
    containerTotalWidth - (margin.left + margin.right)
  );
  const providedWidth = Number.isFinite(chartSetting?.barWidth)
    ? chartSetting.barWidth
    : undefined;

  const rawAutoBox = Math.max(
    6,
    Math.floor(availablePlotWidth / (nBoxes * boxSpacingMultiplier))
  );

  const effectiveBoxWidth: number = providedWidth ?? rawAutoBox;

  const effectiveShowOutliers: boolean = chartSetting?.showOutliers ?? true;

  const spacing = effectiveBoxWidth * boxSpacingMultiplier;
  const plotWidth = Math.max(1, series.length) * spacing;
  const computedSvgW = margin.left + plotWidth + margin.right;
  const svgW = Number.isFinite(chartSetting?.width)
    ? chartSetting.width
    : computedSvgW;
  const svgH = containerHeight;

  const valueToY = (v: number) => {
    if (dataMax === dataMin) return margin.top + plotHeight / 2;
    const t = (v - dataMin) / (dataMax - dataMin);
    return margin.top + (1 - t) * plotHeight;
  };

  if (loading)
    return <Box sx={{ p: 2, textAlign: 'center' }}>Loading boxplot...</Box>;
  if (!series.length)
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        No data available for boxplot
      </Box>
    );

  const labelY = margin.top + plotHeight + 16;
  const rotateAngle = chartSetting?.labelRotate ?? -25;
  const textAnchor = chartSetting?.labelAnchor ?? 'end';

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
      {chartSetting?.heading && (
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
          {chartSetting.heading}
        </Typography>
      )}

      <svg
        width={svgW}
        height={svgH}
        role="img"
        aria-label={chartSetting.heading ?? 'boxplot'}
        style={{ display: 'block', minWidth: computedSvgW }}
      >
        {/* y grid & ticks */}
        <g transform={`translate(${margin.left - 10}, ${margin.top})`}>
          {Array.from({ length: 6 }).map((_, i) => {
            const t = i / 5;
            const val = dataMin + (1 - t) * (dataMax - dataMin);
            const y = t * plotHeight;
            return (
              <g key={i}>
                <line x1={0} x2={plotWidth} y1={y} y2={y} stroke="#eee" />
                <text
                  x={-8}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fontSize={11}
                >
                  {Number.isFinite(val) ? val.toFixed(0) : '0'}
                </text>
              </g>
            );
          })}
        </g>

        {/* boxes */}
        <g>
          {series.map((s, i) => {
            const cx = margin.left + i * spacing + effectiveBoxWidth / 2;
            const left = cx - effectiveBoxWidth / 2;
            const right = cx + effectiveBoxWidth / 2;
            const sum = summarize(s.values);
            const yQ1 = valueToY(sum.q1);
            const yQ3 = valueToY(sum.q3);
            const yMed = valueToY(sum.med);
            const yMin = valueToY(sum.min);
            const yMax = valueToY(sum.max);
            const color =
              (chartSetting?.colors &&
                chartSetting.colors[i % chartSetting.colors.length]) ??
              '#e86161';

            return (
              <g key={s.label}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={yMax}
                  y2={yQ3}
                  stroke="#333"
                  strokeWidth={1}
                />
                <line
                  x1={cx}
                  x2={cx}
                  y1={yQ1}
                  y2={yMin}
                  stroke="#333"
                  strokeWidth={1}
                />
                <line
                  x1={left + effectiveBoxWidth * 0.15}
                  x2={right - effectiveBoxWidth * 0.15}
                  y1={yMax}
                  y2={yMax}
                  stroke="#333"
                />
                <line
                  x1={left + effectiveBoxWidth * 0.15}
                  x2={right - effectiveBoxWidth * 0.15}
                  y1={yMin}
                  y2={yMin}
                  stroke="#333"
                />
                <rect
                  x={left}
                  y={yQ3}
                  width={effectiveBoxWidth}
                  height={Math.max(2, yQ1 - yQ3)}
                  fill="white"
                  stroke={color}
                  strokeWidth={1.5}
                  rx={4}
                />
                <line
                  x1={left}
                  x2={right}
                  y1={yMed}
                  y2={yMed}
                  stroke={color}
                  strokeWidth={2}
                />
                {effectiveShowOutliers &&
                  sum.outliers.map((o, oi) => (
                    <circle
                      key={oi}
                      cx={cx}
                      cy={valueToY(o)}
                      r={3}
                      fill={color}
                      stroke="#333"
                    />
                  ))}
                <text
                  key={`lbl-${i}`}
                  x={cx}
                  y={labelY}
                  transform={`rotate(${rotateAngle} ${cx} ${labelY})`}
                  fontSize={11}
                  textAnchor={textAnchor}
                  alignmentBaseline="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* axis titles */}
        {chartSetting?.xAxis?.[0]?.label && (
          <text
            x={margin.left + plotWidth / 2}
            y={margin.top + plotHeight + 55}
            fontSize={14}
            fontWeight={600}
            textAnchor="middle"
          >
            {chartSetting.xAxis[0].label}
          </text>
        )}
        {chartSetting?.yAxis?.[0]?.label && (
          <text
            x={margin.left - 80}
            y={margin.top + plotHeight / 2}
            fontSize={14}
            fontWeight={600}
            textAnchor="middle"
            transform={`rotate(-90, ${margin.left - 80}, ${margin.top + plotHeight / 2})`}
          >
            {chartSetting.yAxis[0].label}
          </text>
        )}
      </svg>
    </Box>
  );
}

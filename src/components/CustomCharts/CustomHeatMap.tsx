import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface HeatDatum {
  xLabel: string;
  yLabel: string;
  value: number;
}

interface CustomHeatMapInterface {
  dataset: HeatDatum[];
  chartSetting?: any;
  question_id?: string;
  loading?: boolean;
  cellWidth?: number;
  cellHeight?: number;
  showValues?: boolean;
}

const LOW_COLOR = '#ffffff';
const HIGH_COLOR = '#e86161';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const lerpColor = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${lerp(A.r, B.r, t)}, ${lerp(A.g, B.g, t)}, ${lerp(A.b, B.b, t)})`;
};

export default function CustomHeatMap({
  dataset = [],
  chartSetting = {},
  question_id = 'heatmap',
  loading = false,
  cellWidth = 60,
  cellHeight = 36,
  showValues = true,
}: CustomHeatMapInterface) {
  const width = chartSetting.width ?? 900;
  const height = chartSetting.height ?? 480;
  const margin = {
    top: 40,
    right: 120,
    bottom: 120,
    left: 220,
    ...(chartSetting.margin ?? {}),
  };

  const { xLabels, yLabels, matrix, minValue, maxValue } = useMemo(() => {
    const xKey = chartSetting?.xAxis?.[0]?.dataKey ?? 'xLabel';
    const yKey = chartSetting?.yAxis?.[0]?.dataKey ?? 'yLabel';
    const vKey = chartSetting?.series?.[0]?.dataKey ?? 'count';

    const xs: string[] = [];
    const ys: string[] = [];
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    const map = new Map<string, number>();

    (dataset || []).forEach((d: Record<string, any>) => {
      const x = String(d[xKey] ?? d.xLabel ?? '').trim();
      const y = String(d[yKey] ?? d.yLabel ?? '').trim();
      if (!x || !y) return;
      if (!xSet.has(x)) {
        xSet.add(x);
        xs.push(x);
      }
      if (!ySet.has(y)) {
        ySet.add(y);
        ys.push(y);
      }
      const v = Number(d[vKey] ?? d.value ?? d.count ?? 0);
      map.set(`${y}||${x}`, Number.isFinite(v) ? v : 0);
    });

    let mn = Infinity,
      mx = -Infinity;
    const m = ys.map((y) =>
      xs.map((x) => {
        const v = map.get(`${y}||${x}`) ?? 0;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
        return v;
      })
    );

    if (mn === Infinity) mn = 0;
    if (mx === -Infinity) mx = 0;

    return { xLabels: xs, yLabels: ys, matrix: m, minValue: mn, maxValue: mx };
  }, [dataset, chartSetting]);

  const cols = xLabels.length;
  const rows = yLabels.length;
  const gridW = cols * cellWidth;
  const gridH = rows * cellHeight;
  const svgW = margin.left + gridW + margin.right;
  const svgH = margin.top + gridH + margin.bottom;

  const colorFor = (v: number) => {
    if (maxValue === minValue) return lerpColor(LOW_COLOR, HIGH_COLOR, 0.9);
    const t = (v - minValue) / (maxValue - minValue);
    return lerpColor(LOW_COLOR, HIGH_COLOR, Math.max(0, Math.min(1, t)));
  };

  if (loading)
    return <Box sx={{ textAlign: 'center', p: 2 }}>Loading heatmap...</Box>;
  if (!dataset || dataset.length === 0 || rows === 0 || cols === 0)
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        No data available for heatmap
      </Box>
    );

  return (
    <Box
      className={chartSetting.className}
      id={`chart-${question_id}`}
      sx={{
        width: '100%',
        height: chartSetting.height,
        p: 2,
        background: 'white',
        borderRadius: 1,
        overflow: 'auto',
      }}
    >
      {chartSetting.heading && (
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
          {chartSetting.heading}
        </Typography>
      )}

      <svg
        width={Math.min(svgW, width)}
        height={svgH}
        role="img"
        aria-label={chartSetting.heading ?? 'heatmap'}
      >
        {/* Y labels */}
        <g transform={`translate(${margin.left - 8}, ${margin.top})`}>
          {yLabels.map((y, yi) => (
            <text
              key={y}
              x={-12}
              y={yi * cellHeight + cellHeight / 2}
              textAnchor="end"
              alignmentBaseline="middle"
              style={{ fontSize: 12 }}
            >
              {y}
            </text>
          ))}
        </g>

        {/* X labels (rotated) */}
        <g transform={`translate(${margin.left}, ${margin.top + gridH + 4})`}>
          {xLabels.map((x, xi) => {
            const cx = xi * cellWidth + cellWidth / 2;
            return (
              <text
                key={`x-${xi}`}
                x={cx}
                y={8}
                textAnchor="end"
                transform={`rotate(-45, ${cx}, 8)`}
                style={{ fontSize: 11 }}
              >
                {x}
              </text>
            );
          })}
        </g>

        {/* cells */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {yLabels.map((_, yi) =>
            xLabels.map((__, xi) => {
              const x = xi * cellWidth;
              const y = yi * cellHeight;
              const v = matrix[yi]?.[xi] ?? 0;
              return (
                <g key={`c-${yi}-${xi}`}>
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill={colorFor(v)}
                    stroke="#eee"
                  />
                  {showValues && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontSize={11}
                      fill={v > (minValue + maxValue) / 2 ? 'white' : 'black'}
                      style={{ fontWeight: 600 }}
                    >
                      {Number.isFinite(v)
                        ? Math.abs(v) >= 100
                          ? Math.round(v)
                          : Number(v).toFixed(0)
                        : '0'}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </g>

        {/* legend */}
        <g transform={`translate(${margin.left + gridW + 20}, ${margin.top})`}>
          {Array.from({ length: 40 }).map((_, i) => {
            const t = i / 39;
            const y = i * (gridH / 40);
            return (
              <rect
                key={i}
                x={0}
                y={y}
                width={18}
                height={gridH / 40}
                fill={lerpColor(LOW_COLOR, HIGH_COLOR, 1 - t)}
              />
            );
          })}
          <text x={26} y={0} fontSize={11}>
            {maxValue.toFixed(2)}
          </text>
          <text x={26} y={gridH} fontSize={11} textAnchor="start">
            {minValue.toFixed(2)}
          </text>
          <text x={0} y={-12} fontSize={12} fontWeight={600}>
            Value
          </text>
        </g>
      </svg>
    </Box>
  );
}

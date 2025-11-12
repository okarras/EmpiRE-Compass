import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

interface HeatDatum {
  xLabel: string;
  yLabel: string;
  value: number;
}

interface ChartSettingMinimal {
  className?: string;
  heading?: string;
  height?: number;
  width?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

interface CustomHeatMapInterface {
  dataset: HeatDatum[];
  chartSetting: ChartSettingMinimal;
  question_id: string;
  loading?: boolean;
  normalized?: 'none' | 'global' | 'row';
  showValues?: boolean;
  cellWidth?: number;
  cellHeight?: number;
}

const HIGHLIGHT_COLOR = '#e86161';
const LOW_COLOR = '#ffffff';

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const lerpColor = (aHex: string, bHex: string, t: number) => {
  const A = hexToRgb(aHex);
  const B = hexToRgb(bHex);
  return `rgb(${lerp(A.r, B.r, t)}, ${lerp(A.g, B.g, t)}, ${lerp(A.b, B.b, t)})`;
};

export default function CustomHeatMap(props: CustomHeatMapInterface) {
  const {
    dataset = [],
    chartSetting = {},
    question_id = 'heatmap',
    loading = false,
    normalized = 'none',
    showValues = true,
    cellWidth = 60,
    cellHeight = 36,
  } = props;

  const height = chartSetting.height ?? 480;
  const width = chartSetting.width ?? 900;
  const margin = {
    top: 40,
    right: 120,
    bottom: 120,
    left: 220,
    ...(chartSetting.margin ?? {}),
  };

  // Build labels and matrix
  const { xLabels, yLabels, matrix, total } = useMemo(() => {
    const xs: string[] = [];
    const ys: string[] = [];
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    dataset.forEach((d) => {
      const x = String(d.xLabel ?? '').trim();
      const y = String(d.yLabel ?? '').trim();
      if (x && !xSet.has(x)) {
        xSet.add(x);
        xs.push(x);
      }
      if (y && !ySet.has(y)) {
        ySet.add(y);
        ys.push(y);
      }
    });

    const map = new Map<string, number>();
    dataset.forEach((d) => {
      const x = String(d.xLabel ?? '').trim();
      const y = String(d.yLabel ?? '').trim();
      if (!x || !y) return;
      map.set(`${y}||${x}`, Number(d.value ?? 0));
    });

    const m: number[][] = [];
    let tot = 0;
    for (let yi = 0; yi < ys.length; yi++) {
      m[yi] = [];
      for (let xi = 0; xi < xs.length; xi++) {
        const key = `${ys[yi]}||${xs[xi]}`;
        const v = map.has(key) ? (map.get(key) as number) : 0;
        m[yi][xi] = v;
        tot += v;
      }
    }
    return { xLabels: xs, yLabels: ys, matrix: m, total: tot };
  }, [dataset]);

  const { displayMatrix, minValue, maxValue } = useMemo(() => {
    if (!matrix || matrix.length === 0)
      return { displayMatrix: matrix, minValue: 0, maxValue: 0 };
    const dm = matrix.map((row) =>
      row.map((v) => {
        if (normalized === 'none') return v;
        if (normalized === 'global') return total > 0 ? (v / total) * 100 : 0;
        const s = row.reduce((a, b) => a + b, 0);
        return s > 0 ? (v / s) * 100 : 0;
      })
    );
    let mn = Infinity,
      mx = -Infinity;
    dm.forEach((r) =>
      r.forEach((n) => {
        if (n < mn) mn = n;
        if (n > mx) mx = n;
      })
    );
    if (mn === Infinity) mn = 0;
    if (mx === -Infinity) mx = 0;
    return { displayMatrix: dm, minValue: mn, maxValue: mx };
  }, [matrix, normalized, total]);

  const cols = xLabels.length;
  const rows = yLabels.length;

  const gridWidth = cols * cellWidth;
  const gridHeight = rows * cellHeight;
  const svgWidth = margin.left + gridWidth + margin.right;
  const svgHeight = margin.top + gridHeight + margin.bottom;

  const valueAt = (r: number, c: number) =>
    displayMatrix[r] ? (displayMatrix[r][c] ?? 0) : 0;

  const colorFor = (v: number) => {
    if (maxValue === minValue)
      return lerpColor(LOW_COLOR, HIGHLIGHT_COLOR, 0.9);
    const t = (v - minValue) / (maxValue - minValue);
    return lerpColor(LOW_COLOR, HIGHLIGHT_COLOR, Math.max(0, Math.min(1, t)));
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
        width: chartSetting.width ? chartSetting.width : '100%',
        height: chartSetting.height ?? svgHeight,
        backgroundColor: 'white',
        borderRadius: 2,
        p: 2,
        overflow: 'auto',
      }}
    >
      {chartSetting.heading && (
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
          {chartSetting.heading}
        </Typography>
      )}

      <svg
        width={Math.min(svgWidth, width)}
        height={svgHeight}
        role="img"
        aria-label={chartSetting.heading}
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
        <g
          transform={`translate(${margin.left}, ${margin.top + gridHeight + 4})`}
        >
          {xLabels.map((x, xi) => {
            const xCenter = xi * cellWidth + cellWidth / 2;
            return (
              <text
                key={`x-${xi}`}
                x={xCenter}
                y={8}
                textAnchor="end"
                transform={`rotate(-45, ${xCenter}, 8)`}
                style={{
                  fontSize: 11,
                  textAnchor: 'end',
                }}
              >
                {x}
              </text>
            );
          })}
        </g>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {yLabels.map((_, yi) =>
            xLabels.map((__, xi) => {
              const x = xi * cellWidth;
              const y = yi * cellHeight;
              const val = valueAt(yi, xi);
              const fill = colorFor(val);
              return (
                <g key={`cell-${yi}-${xi}`}>
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill={fill}
                    stroke="#eee"
                  />
                  {showValues && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontSize={11}
                      fill={val > (minValue + maxValue) / 2 ? 'white' : 'black'}
                      style={{ fontWeight: 600 }}
                    >
                      {Number.isFinite(val)
                        ? Math.abs(val) >= 100
                          ? Math.round(val)
                          : Number(val).toFixed(0)
                        : '0'}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </g>

        <g
          transform={`translate(${margin.left + gridWidth + 20}, ${margin.top})`}
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const t = i / 39;
            const y = i * (gridHeight / 40);
            return (
              <rect
                key={i}
                x={0}
                y={y}
                width={18}
                height={gridHeight / 40}
                fill={lerpColor(LOW_COLOR, HIGHLIGHT_COLOR, 1 - t)}
              />
            );
          })}
          <text x={26} y={0} fontSize={11} alignmentBaseline="hanging">
            {maxValue.toFixed(2)}
          </text>
          <text
            x={26}
            y={gridHeight}
            fontSize={11}
            textAnchor="start"
            alignmentBaseline="baseline"
          >
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

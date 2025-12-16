import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { ResponsiveHeatMap, HeatMapDatum } from '@nivo/heatmap';
import { createLabelFormatter } from '../../utils/chartUtils';

interface HeatDatum {
  xLabel: string;
  yLabel: string;
  value: number;
}

interface CustomHeatMapInterface {
  dataset: HeatDatum[];
  chartSetting?: {
    xAxis?: Array<{ dataKey?: string; label?: string }>;
    yAxis?: Array<{ dataKey?: string; label?: string }>;
    series?: Array<{ dataKey?: string }>;
    width?: number;
    height?: number;
    className?: string;
    heading?: string;
    maxLabelLength?: number | 'auto';
    layout?: string;
    margin?: Record<string, unknown>;
  };
  question_id?: string;
  loading?: boolean;
  cellWidth?: number;
  cellHeight?: number;
  showValues?: boolean;
}

// Custom tooltip component with multiline support
interface TooltipProps {
  cell: {
    serieId: string | number;
    data: HeatMapDatum;
    formattedValue: string | number | null;
    color: string;
  };
}

const HeatMapTooltip = ({ cell }: TooltipProps) => {
  return (
    <Box
      sx={{
        background: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '300px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          marginBottom: '8px',
          color: '#333',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
        }}
      >
        {String(cell.serieId)}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          marginBottom: '8px',
          color: '#555',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
        }}
      >
        {String(cell.data.x)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            backgroundColor: cell.color,
            borderRadius: '3px',
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: '#333',
          }}
        >
          Value: {cell.formattedValue}
        </Typography>
      </Box>
    </Box>
  );
};

export default function CustomHeatMap({
  dataset = [],
  chartSetting = {},
  question_id = 'heatmap',
  loading = false,
}: CustomHeatMapInterface) {
  const { heatMapData, minValue, maxValue } = useMemo(() => {
    const xKey = chartSetting?.xAxis?.[0]?.dataKey ?? 'xLabel';
    const yKey = chartSetting?.yAxis?.[0]?.dataKey ?? 'yLabel';
    const vKey = chartSetting?.series?.[0]?.dataKey ?? 'count';

    const xs: string[] = [];
    const ys: string[] = [];
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    const map = new Map<string, number>();

    if (!Array.isArray(dataset)) {
      return { heatMapData: [], minValue: 0, maxValue: 0 };
    }

    dataset.forEach((d) => {
      const item = d as unknown as Record<string, unknown>;
      const x = String(item[xKey] ?? item.xLabel ?? '').trim();
      const y = String(item[yKey] ?? item.yLabel ?? '').trim();
      if (!x || !y) return;
      if (!xSet.has(x)) {
        xSet.add(x);
        xs.push(x);
      }
      if (!ySet.has(y)) {
        ySet.add(y);
        ys.push(y);
      }
      const v = Number(item[vKey] ?? item.value ?? item.count ?? 0);
      map.set(`${y}||${x}`, Number.isFinite(v) ? v : 0);
    });

    let mn = Infinity,
      mx = -Infinity;

    // Create data array for Nivo HeatMap - correct structure
    const data = ys.map((y) => {
      const rowData = xs.map((x) => {
        const v = map.get(`${y}||${x}`) ?? 0;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
        return { x, y: v };
      });
      return {
        id: y,
        data: rowData,
      };
    });

    if (mn === Infinity) mn = 0;
    if (mx === -Infinity) mx = 0;

    return {
      heatMapData: data,
      minValue: mn,
      maxValue: mx,
    };
  }, [dataset, chartSetting]);

  const height = chartSetting.height ?? 600;

  const labelFormatter = createLabelFormatter(
    chartSetting as any,
    dataset.length
  );

  if (loading)
    return <Box sx={{ textAlign: 'center', p: 2 }}>Loading heatmap...</Box>;

  // Defensive checks - ensure we have valid data structure
  if (
    !dataset ||
    dataset.length === 0 ||
    !Array.isArray(heatMapData) ||
    heatMapData.length === 0 ||
    !heatMapData[0] ||
    !heatMapData[0].data ||
    !Array.isArray(heatMapData[0].data) ||
    heatMapData[0].data.length === 0
  ) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        No data available for heatmap
      </Box>
    );
  }

  // Calculate dynamic margins based on data size
  const xLabels = heatMapData[0]?.data?.length ?? 0;
  const yLabels = heatMapData.length ?? 0;

  // Adjust margins based on number of labels
  const leftMargin = Math.max(250, Math.min(400, yLabels * 12));
  const bottomMargin = Math.max(150, Math.min(250, xLabels * 8));
  const rightMargin = 120;
  const topMargin = 60; // Increased to prevent overlap with rotated labels

  return (
    <Box
      className={chartSetting.className}
      id={`chart-${question_id}`}
      sx={{
        width: '100%',
        height: height,
        p: 2,
        background: 'white',
        borderRadius: 1,
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {chartSetting.heading && (
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            mb: 2,
            fontWeight: 600,
            fontSize: '1.25rem',
          }}
        >
          {chartSetting.heading}
        </Typography>
      )}

      <Box
        sx={{
          width: '100%',
          height: height - (chartSetting.heading ? 120 : 40),
          minHeight: 400,
          position: 'relative',
          margin: {
            top: topMargin,
          },
        }}
      >
        <ResponsiveHeatMap
          data={heatMapData}
          margin={{
            top: 140,
            right: rightMargin,
            bottom: bottomMargin,
            left: leftMargin,
          }}
          valueFormat={(value) =>
            Number.isFinite(value) ? value.toFixed(2) : '0.00'
          }
          colors={{
            type: 'sequential',
            scheme: 'reds',
            minValue: minValue,
            maxValue: maxValue,
          }}
          emptyColor="#f5f5f5"
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.6]],
          }}
          borderWidth={1}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 2.5]],
          }}
          tooltip={HeatMapTooltip}
          axisTop={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: -60,
            legend: chartSetting?.xAxis?.[0]?.label ?? '',
            legendOffset: -80,
            legendPosition: 'middle',
            tickValues: undefined, // Let nivo auto-calculate
            format: (value: string) => labelFormatter(value),
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: 0,
            legend: chartSetting?.yAxis?.[0]?.label ?? '',
            legendPosition: 'middle',
            legendOffset: -Math.max(120, leftMargin - 50),
            format: (value: string) => labelFormatter(value),
          }}
          axisRight={null}
          axisBottom={null}
          legends={[
            {
              anchor: 'right',
              translateX: 50,
              translateY: 0,
              length: 250,
              thickness: 12,
              direction: 'column',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 5,
              tickOverlap: false,
              tickFormat: (value) => Number(value).toFixed(1),
              title: 'Value',
              titleAlign: 'start',
              titleOffset: 8,
            },
          ]}
          theme={{
            axis: {
              ticks: {
                text: {
                  fontSize: 11,
                  fill: '#666',
                  fontFamily: 'inherit',
                },
              },
              legend: {
                text: {
                  fontSize: 13,
                  fill: '#333',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                },
              },
            },
            labels: {
              text: {
                fontSize: 10,
                fontWeight: 500,
                fontFamily: 'inherit',
              },
            },
            legends: {
              text: {
                fontSize: 11,
                fill: '#666',
                fontFamily: 'inherit',
              },
              title: {
                text: {
                  fontSize: 12,
                  fill: '#333',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                },
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}

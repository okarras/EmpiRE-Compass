import { PieChart } from '@mui/x-charts/PieChart';
import { Box, Typography } from '@mui/material';
import { ChartSetting } from '../../constants/queries_chart_info';

interface PieDataItem {
  id: string;
  label: string;
  value: number;
}

interface CustomPieChartInterface {
  dataset: PieDataItem[];
  chartSetting: ChartSetting;
  question_id: string;
}

const CustomPieChart = (props: CustomPieChartInterface) => {
  const { dataset, chartSetting, question_id } = props;

  if (!dataset || dataset.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography>No data available for pie chart</Typography>
      </Box>
    );
  }

  // Default colors if not provided
  const defaultColors = [
    '#e86161', // primary red
    '#4c72b0', // blue
    '#55a868', // green
    '#dd8452', // orange
    '#8172b3', // purple
    '#937860', // brown
    '#da8bc3', // pink
    '#8c8c8c', // gray
    '#ccb974', // yellow
    '#64b5cd', // light blue
  ];

  // Calculate total for percentage calculation
  const total = dataset.reduce((sum, item) => sum + item.value, 0);

  // Calculate chart dimensions
  const chartHeight = chartSetting.height - 60 || 340;
  const legendHeight = 60; // Height reserved for legend
  const pieHeight = chartHeight - legendHeight;

  return (
    <Box
      className={chartSetting.className}
      id={`chart-${question_id}`}
      sx={{
        width: '100%',
        height: chartSetting.height || 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 2,
        p: 2,
        '& .MuiChartsLegend-root': {
          flexWrap: 'wrap',
          gap: 0.5,
          justifyContent: 'center',
          '& .MuiChartsLegend-label': {
            fontSize: '0.65rem',
            fill: 'text.primary',
          },
          '& .MuiChartsLegend-row': {
            marginRight: '4px',
          },
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          textAlign: 'center',
          color: 'text.primary',
          fontWeight: 600,
          fontSize: { xs: '1rem', sm: '1.25rem' },
        }}
      >
        {chartSetting.heading}
      </Typography>
      <PieChart
        series={[
          {
            data: dataset.map((item, index) => ({
              ...item,
              color:
                chartSetting.colors?.[index] ||
                defaultColors[index % defaultColors.length],
            })),
            innerRadius: 0.6,
            paddingAngle: 1,
            cornerRadius: 4,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 0.6, additionalRadius: -30, color: 'gray' },
            valueFormatter: (item) => {
              return `${item.value}`;
            },
            arcLabel: (item) => {
              const percentage = (item.value / total) * 100;
              return percentage > 5 ? `${item.value}` : '';
            },
            arcLabelMinAngle: 20,
          },
        ]}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'bottom', horizontal: 'middle' },
            padding: 0,
            itemMarkWidth: 6,
            itemMarkHeight: 6,
            markGap: 3,
            itemGap: 4,
            hidden: true,
          },
        }}
        height={pieHeight}
        margin={{
          top: 10,
          bottom: legendHeight / 2,
          left: 20,
          right: 20,
        }}
        sx={{
          [`& .MuiChartsLegend-mark`]: {
            rx: 3,
            ry: 3,
          },
        }}
      />
    </Box>
  );
};

export default CustomPieChart;

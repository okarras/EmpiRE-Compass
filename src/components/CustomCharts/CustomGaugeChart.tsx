// CustomGaugeChart.tsx
import { Gauge } from '@mui/x-charts/Gauge';
import { Box, Typography } from '@mui/material';

interface CustomGaugeChartProps {
  label: string;
  value: number;
}

const CustomGaugeChart = ({ label, value }: CustomGaugeChartProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 300,
        height: 240,
        backgroundColor: 'white',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: 1,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
      >
        {label}
      </Typography>
      <Gauge
        value={value}
        startAngle={-110}
        endAngle={110}
        text={`${value}`}
        sx={{ width: '100%' }}
      />
    </Box>
  );
};

export default CustomGaugeChart;

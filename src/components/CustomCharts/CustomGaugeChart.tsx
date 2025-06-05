import {
  Gauge,
} from '@mui/x-charts/Gauge';
import { Box, Typography } from '@mui/material';

interface CustomGaugeChartProps {
  label: string;
  value: number;
  maxValue?: number;
  // showNeedle?: boolean;
}

const CustomGaugeChart = ({ label, value, maxValue }: CustomGaugeChartProps) => {
  const effectiveMax = maxValue ?? value;

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
        value={(value / effectiveMax) * 100}
        startAngle={-110}
        endAngle={110}
        text={({ value, valueMax }) =>
          value === valueMax ? `${value}` : `${value} / ${valueMax}`
        }
        sx={{ width: '100%' }}
        // showNeedle={showNeedle}
      />
    </Box>
  );
};

export default CustomGaugeChart;

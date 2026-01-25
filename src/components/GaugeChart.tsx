import { Box, Typography, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  link?: string;
  color?: string;
}

export default function GaugeChart({
  value,
  max,
  label,
  color = '#e86161',
  link,
}: GaugeChartProps) {
  const theme = useTheme();

  // Normalize value to be within 0-max
  const normalizedValue = Math.min(Math.max(0, value), max);

  const data = [
    { name: 'Value', value: normalizedValue },
    { name: 'Remaining', value: max - normalizedValue },
  ];

  const percentage = max > 0 ? Math.round((normalizedValue / max) * 100) : 0;

  const handleClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        width: '100%',
        p: 2,
        cursor: link ? 'pointer' : 'default',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: link ? 'translateY(-4px)' : 'none',
        },
      }}
      onClick={handleClick}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill={theme.palette.grey[200]} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <Box
        sx={{
          position: 'absolute',
          top: '65%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={700} color="text.primary">
          {percentage}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value.toLocaleString()} / {max.toLocaleString()}
        </Typography>
      </Box>

      <Typography
        variant="h6"
        fontWeight={600}
        color="text.primary"
        sx={{ mt: -2, mb: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
}

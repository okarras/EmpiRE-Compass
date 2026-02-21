import { Box, Paper, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface KPICardProps {
  label: string;
  value: number;
  icon?: ReactElement;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function KPICard({
  label,
  value,
  icon,
  trend,
}: KPICardProps): ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 200,
        backgroundColor: '#ffffff',
      }}
    >
      {icon && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: 'rgba(232, 97, 97, 0.1)',
            color: '#e86161',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      )}

      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {value.toLocaleString()}
        </Typography>
        {trend && (
          <Typography
            variant="caption"
            color={trend.isPositive ? 'success.main' : 'error.main'}
            fontWeight={600}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

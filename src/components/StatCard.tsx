// components/StatCard.tsx
import { Box, Paper, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
}

export default function StatCard({
  icon: Icon,
  value,
  label,
}: StatCardProps): ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        width: 160,
        textAlign: 'center',
        backgroundColor: '#eceff1',
        color: '#c0392b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          p: 1.5,
          mb: 1.5,
        }}
      >
        <Icon fontSize="large" />
      </Box>
      <Typography variant="h6" fontWeight={700}>
        {value.toLocaleString()}
      </Typography>
      <Typography variant="subtitle2" color="#c0392b">
        {label}
      </Typography>
    </Paper>
  );
}

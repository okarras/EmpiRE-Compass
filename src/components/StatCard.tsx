import { Box, Paper, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface StatCardProps {
  children: ReactElement;
  value?: number;
  label: string;
  link?: string;
}

export default function StatCard({
  children,
  value,
  label,
  link,
}: StatCardProps): ReactElement {
  const handleClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 4,
        width: 150,
        textAlign: 'center',
        backgroundColor: '#ffffff',
        color: '#c0392b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: link ? 'pointer' : 'default',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: link ? 'translateY(-4px)' : 'none',
          boxShadow: link
            ? '0px 6px 20px rgba(0, 0, 0, 0.08)'
            : 'none',
        },
      }}
      onClick={handleClick}
    >
      <Box
        sx={{
          backgroundColor: '#f5f6fa',
          borderRadius: '50%',
          p: 2,
          mb: 2,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        {children}
      </Box>

      {value !== undefined && (
        <Typography variant="h6" fontWeight={700}>
          {value.toLocaleString()}
        </Typography>
      )}
      <Typography
        variant="subtitle2"
        fontWeight={600}
        color="text.primary"
        sx={{ mt: 1 }}
      >
        {label}
      </Typography>
    </Paper>
  );
}

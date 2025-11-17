import { Box, Typography, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box
      sx={{
        mt: { xs: 6, sm: 8, md: 10 },
        pt: { xs: 3, sm: 4 },
        pb: { xs: 2, sm: 3 },
        width: '100%',
      }}
    >
      <Divider sx={{ mb: { xs: 2, sm: 3 } }} />
      <Typography
        variant="body2"
        align="center"
        sx={{
          color: 'text.secondary',
          fontSize: { xs: '0.875rem', sm: '0.9375rem' },
        }}
      >
        © 2025 EmpiRE-Compass – Advancing Open Science in RE
      </Typography>
    </Box>
  );
};

export default Footer;

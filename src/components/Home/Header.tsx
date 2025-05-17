import { Box, Typography } from '@mui/material';

const Header = () => {
  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        mb: { xs: 4, sm: 5, md: 6 },
        px: { xs: 2, sm: 4, md: 6 }
      }}
    >
      <Typography
        variant="h2"
        component="h1"
        gutterBottom
        sx={{
          color: '#e86161',
          fontWeight: 800,
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          letterSpacing: '-0.02em',
          mb: 3,
        }}
      >
        EmpiRE-Compass
      </Typography>
      <Typography 
        variant="h5" 
        color="text.secondary" 
        sx={{ 
          mb: 3,
          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
          lineHeight: 1.5,
          maxWidth: '800px',
          mx: 'auto'
        }}
      >
        A Community-Maintainable Knowledge Graph Dashboard for Empirical
        Research in Requirements Engineering
      </Typography>
    </Box>
  );
};

export default Header; 
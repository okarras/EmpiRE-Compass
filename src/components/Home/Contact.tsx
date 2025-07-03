import { Box, Paper, Typography } from '@mui/material';

const Contact = () => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: '#e86161',
          fontWeight: 700,
          mb: 3,
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
        }}
      >
        Contact
      </Typography>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor: 'rgba(232, 97, 97, 0.05)',
          borderRadius: 2,
          border: '1px solid rgba(232, 97, 97, 0.1)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: '#e86161',
            fontWeight: 600,
          }}
        >
          Dr. rer. nat. Oliver Karras
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1rem', sm: '1.1rem' },
            lineHeight: 1.7,
            '& > span': {
              display: 'block',
              mb: 1,
            },
          }}
        >
          <span>
            Researcher and Data Scientist - Open Research Knowledge Graph
          </span>
          <span>
            TIB - Leibniz Information Centre for Science and Technology
          </span>
          <span>Welfengarten 1B</span>
          <span>30167 Hannover</span>
          <span>
            <Box component="strong" sx={{ color: '#e86161', mr: 1 }}>
              Email:
            </Box>
            <a
              href="mailto:oliver.karras@tib.eu"
              style={{ color: '#e86161', textDecoration: 'none' }}
            >
              oliver.karras@tib.eu
            </a>
          </span>
        </Typography>
      </Box>
    </Paper>
  );
};

export default Contact;

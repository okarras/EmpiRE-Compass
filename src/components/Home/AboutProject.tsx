import { Box, Paper, Typography } from '@mui/material';

const AboutProject = () => {
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
        About the Project
      </Typography>
      <Typography 
        paragraph
        sx={{ 
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.7,
          color: 'text.primary',
          mb: 3
        }}
      >
        EmpiRE-Compass is a dashboard for visualizing and analyzing data
        from KG-EmpiRE, a community-maintainable knowledge graph of
        empirical research in requirements engineering. The project
        currently contains data from over 680 papers published in the
        research track of the IEEE International Conference on
        Requirements Engineering from 1994 to 2022.
      </Typography>
      <Typography 
        paragraph
        sx={{ 
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.7,
          mb: 2
        }}
      >
        The knowledge graph organizes scientific data using a defined
        template across six key themes:
      </Typography>
      <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
        <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
          {[
            'Research Paradigm',
            'Research Design',
            'Research Method',
            'Data Collection',
            'Data Analysis',
            'Bibliographic Metadata',
          ].map((theme) => (
            <Typography 
              component="li" 
              key={theme} 
              sx={{ 
                mb: 1.5,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                display: 'flex',
                alignItems: 'center',
                '&:before': {
                  content: '""',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#e86161',
                  borderRadius: '50%',
                  display: 'inline-block',
                  mr: 2
                }
              }}
            >
              {theme}
            </Typography>
          ))}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AboutProject; 
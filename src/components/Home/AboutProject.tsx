import { Box, Paper, Typography } from '@mui/material';
import { AboutProjectContent } from '../../firestore/CRUDHomeContent';

interface AboutProjectProps {
  content: AboutProjectContent;
}

const AboutProject = ({ content }: AboutProjectProps) => {
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
        {content.title}
      </Typography>

      <Box dangerouslySetInnerHTML={{ __html: content.content }} />

      <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
        <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
          {content.themes.map((theme) => (
            <Box dangerouslySetInnerHTML={{ __html: theme }} />
          ))}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AboutProject;

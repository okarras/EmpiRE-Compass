import { Box, Divider, Paper, Typography } from '@mui/material';
import { AboutProjectContent } from '../../firestore/CRUDHomeContent';

interface AboutProjectProps {
  content: AboutProjectContent;
}

const AboutProject = ({ content }: AboutProjectProps) => {
  const embedUrl = `https://av.tib.eu/player/72249`;

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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

      <Box
        sx={{
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.7,
          mb: 3,
        }}
        dangerouslySetInnerHTML={{ __html: content.content }}
      />

      <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
        <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
          {content.themes.map((theme) => (
            <Typography
              component="li"
              key={theme}
              sx={{
                mb: 1.5,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                display: 'flex',
                alignItems: 'center',
                '&:before': {
                  content: '"🏷️"',
                  display: 'inline-block',
                  mr: 1.5,
                },
              }}
            >
              <Box dangerouslySetInnerHTML={{ __html: theme }} />
            </Typography>
          ))}
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography
        variant="h5"
        sx={{
          color: '#e86161',
          fontWeight: 600,
          mb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        Dashboard Demonstration
      </Typography>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 aspect ratio
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px solid #000',
        }}
      >
        <iframe
          src={embedUrl}
          title="EmpiRE-Compass Tool Demonstration"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            aspectRatio: '16 / 9',
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </Box>
    </Paper>
  );
};

export default AboutProject;

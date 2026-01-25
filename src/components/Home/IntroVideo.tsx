import { Box, Paper, Typography } from '@mui/material';

const IntroVideo = () => {
  // Use embed URL format for video-only display (without TIB portal chrome)
  const embedUrl = `https://av.tib.eu/player/72249`;

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
        Tool Demonstration
      </Typography>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 aspect ratio
          borderRadius: 2,
          overflow: 'hidden',
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
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </Box>
    </Paper>
  );
};

export default IntroVideo;

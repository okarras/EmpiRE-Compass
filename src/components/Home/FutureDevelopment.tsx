import { Box, Paper, Typography } from '@mui/material';
import { FutureDevelopmentContent } from '../../firestore/CRUDHomeContent';

interface FutureDevelopmentProps {
  content: FutureDevelopmentContent;
}

const FutureDevelopment = ({ content }: FutureDevelopmentProps) => {
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
      <Typography
        paragraph
        sx={{
          fontSize: { xs: '1rem', sm: '1.1rem' },
          lineHeight: 1.7,
          mb: 3,
        }}
      >
        {content.intro}
      </Typography>
      <Box sx={{ pl: { xs: 2, sm: 3, md: 4 } }}>
        <Typography component="ul" sx={{ listStyle: 'none', p: 0 }}>
          {content.phases.map((item, index) => (
            <Typography
              component="li"
              key={index}
              sx={{
                mb: 3,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.7,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                component="strong"
                sx={{
                  color: '#e86161',
                  mb: 1,
                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                }}
              >
                {item.phase}
              </Box>
              {item.goal}
            </Typography>
          ))}
        </Typography>
      </Box>
    </Paper>
  );
};

export default FutureDevelopment;

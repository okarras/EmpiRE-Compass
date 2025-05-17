import { Box, Typography } from '@mui/material';
import StatCard from '../StatCard';
import tibLogo from '../../assets/TIB.png';
import orkgLogo from '../../assets/ORKG.png';
import orkgaskLogo from '../../assets/ORKGask.png';

const Partners = () => {
  return (
    <Box sx={{ mt: 8 }}>
      <Typography
        variant="h6"
        align="center"
        sx={{
          mb: 4,
          color: 'text.secondary',
          fontSize: { xs: '1.1rem', sm: '1.2rem' },
        }}
      >
        Project Partners & Resources
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          gap: { xs: 3, sm: 6, md: 8 },
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          label="TIB"
          link="https://www.tib.eu/de/forschung-entwicklung/open-research-knowledge-graph"
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <img
              src={tibLogo}
              alt="TIB Logo"
              style={{
                width: '45px',
                height: '45px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </StatCard>
        <StatCard label="ORKG" link="https://orkg.org/class/C27001">
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <img
              src={orkgLogo}
              alt="ORKG Logo"
              style={{
                width: '45px',
                height: '45px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </StatCard>
        <StatCard
          label="ORKG Ask"
          link="https://ask.orkg.org/search?query=what%20is%20empirical%20research"
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <img
              src={orkgaskLogo}
              alt="ORKGask Logo"
              style={{
                width: '45px',
                height: '45px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </StatCard>
      </Box>
    </Box>
  );
};

export default Partners; 
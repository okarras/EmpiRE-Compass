import { Box, Typography } from '@mui/material';
import StatCard from '../StatCard';
import { PartnersContent } from '../../firestore/CRUDHomeContent';

// Import logos for fallback/mapping
import tibLogo from '../../assets/TIB.png';
import orkgLogo from '../../assets/ORKG.png';
import orkgaskLogo from '../../assets/ORKGask.png';
import KGEmpireLogo from '../../assets/KGEmpire.png';

interface PartnersProps {
  content: PartnersContent;
}

// Map logo URLs to actual imports (for static assets)
const logoMap: Record<string, string> = {
  '/src/assets/TIB.png': tibLogo,
  '/src/assets/ORKG.png': orkgLogo,
  '/src/assets/ORKGask.png': orkgaskLogo,
  '/src/assets/KGEmpire.png': KGEmpireLogo,
};

const Partners = ({ content }: PartnersProps) => {
  const getLogoSrc = (logoUrl: string) => {
    // If it's a mapped static asset, use the import
    if (logoMap[logoUrl]) {
      return logoMap[logoUrl];
    }
    // Otherwise, use the URL directly (for external URLs or uploaded images)
    return logoUrl;
  };

  return (
    <Box
      sx={{
        mt: { xs: 6, sm: 8 },
        px: { xs: 1, sm: 0 },
      }}
    >
      <Typography
        variant="h6"
        align="center"
        sx={{
          mb: { xs: 3, sm: 4 },
          color: 'text.secondary',
          fontSize: { xs: '1.125rem', sm: '1.2rem' },
          fontWeight: 600,
        }}
      >
        {content.title}
      </Typography>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(auto-fit, minmax(200px, 1fr))',
            sm: 'repeat(auto-fit, minmax(180px, 1fr))',
          },
          gap: { xs: 2.5, sm: 3, md: 4 },
          justifyItems: 'center',
        }}
      >
        {content.partners.map((partner, index) => (
          <StatCard key={index} label={partner.label} link={partner.link}>
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
                src={getLogoSrc(partner.logoUrl)}
                alt={`${partner.label} Logo`}
                style={{
                  width: '45px',
                  height: '45px',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </StatCard>
        ))}
      </Box>
    </Box>
  );
};

export default Partners;

import { useState } from 'react';
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
  // Track failed image loads to prevent infinite retries
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const isOnlineUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const getLogoSrc = (logoUrl: string) => {
    // If it's a mapped static asset, use the import
    if (logoMap[logoUrl]) {
      return logoMap[logoUrl];
    }
    // For online URLs or other paths, use directly
    return logoUrl;
  };

  const handleImageError = (logoUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(logoUrl));
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
        {content.partners.map((partner, index) => {
          const logoSrc = getLogoSrc(partner.logoUrl);
          const hasError = failedImages.has(partner.logoUrl);

          return (
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
                  minWidth: '45px',
                  minHeight: '45px',
                }}
              >
                {!hasError ? (
                  <img
                    src={logoSrc}
                    alt={`${partner.label} Logo`}
                    onError={() => handleImageError(partner.logoUrl)}
                    style={{
                      width: '45px',
                      height: '45px',
                      objectFit: 'contain',
                    }}
                    crossOrigin={
                      isOnlineUrl(partner.logoUrl) ? 'anonymous' : undefined
                    }
                  />
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}
                  >
                    {partner.label}
                  </Typography>
                )}
              </Box>
            </StatCard>
          );
        })}
      </Box>
    </Box>
  );
};

export default Partners;

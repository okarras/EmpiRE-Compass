import { Typography } from '@mui/material';
import { Box } from '@mui/system';

const Header = () => {
  return (
    <Box
      sx={{
        width: '90%',
        backgroundColor: '#e86161',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '8px',
      }}
    >
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
        EmpiRE-Compass Dashboard
      </Typography>
    </Box>
  );
};

export default Header;

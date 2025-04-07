import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import MenuDrawer from './MenuDrawer';

const Header = () => {
  const [open, setOpen] = useState(false);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#e86161',
        padding: { xs: '8px', sm: '12px', md: '16px' },
        width: '88%',
        margin: '0 auto', // Center the AppBar
        boxShadow: 'none', // Remove shadow for a cleaner look
        borderRadius: '8px', // Rounded corners
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingX: { xs: 2, sm: 3 }, // Horizontal padding for responsiveness
        }}
        id="back-to-top-anchor"
      >
        {/* Menu Icon */}
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setOpen(!open)}
          sx={{ mr: 1 }} // Adds spacing between the icon and text
        >
          <MenuIcon />
        </IconButton>
        {/* Dashboard Title */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '16px', sm: '20px', md: '24px' },
            whiteSpace: 'nowrap', // Prevents text wrapping
          }}
        >
          EmpiRE-Compass Dashboard
        </Typography>
        <MenuDrawer open={open} handleDrawerClose={handleDrawerClose} />
      </Toolbar>
    </AppBar>
  );
};

export default Header;

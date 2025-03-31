import {
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const Header = () => {
  return (
    <Box sx={{
      width: '92%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    }}>
      <AppBar
        position="static"
        sx={{
          width: '100%',
          backgroundColor: '#e86161',
          padding: '16px',
          display: 'flex',
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EmpiRE-Compass Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;

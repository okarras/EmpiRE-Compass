import { Box, Fab } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import ScrollTop from '../components/ScrollTop';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';


const Layout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0,
      }}
    >
      <Header />
      <Outlet />
      <ScrollTop>
        <Fab size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Box>
  );
};

export default Layout;

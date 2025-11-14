import { Box, Fab } from '@mui/material';
import { Outlet, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import MenuDrawer from '../components/MenuDrawer';
import ScrollTop from '../components/ScrollTop';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { fetchQuestionsFromFirebase } from '../store/slices/questionSlice';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';

const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };
  const { templateId } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (templateId) {
      dispatch(fetchQuestionsFromFirebase(templateId));
    }
  }, [templateId, dispatch]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Header handleDrawerOpen={handleDrawerOpen} />
      <MenuDrawer open={drawerOpen} handleDrawerClose={handleDrawerClose} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          ...(drawerOpen && {
            transition: (theme) =>
              theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }),
            marginLeft: '280px',
          }),
        }}
      >
        <Outlet />
      </Box>

      <ScrollTop>
        <Fab
          size="small"
          aria-label="scroll back to top"
          sx={{
            backgroundColor: '#e86161',
            color: 'white',
            '&:hover': {
              backgroundColor: '#d45555',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Box>
  );
};

export default Layout;

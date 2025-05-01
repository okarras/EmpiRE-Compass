import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import {
  Drawer,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { queries } from '../constants/queries_chart_info';
import { useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';

const drawerWidth = 280;

interface MenuDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

function MenuDrawer({ open, handleDrawerClose }: MenuDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleListItemClick = (id: number) => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    const element = document.getElementById(`question-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    handleDrawerClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDrawerClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDrawerClose]);

  return (
    <Drawer
      anchor="left"
      open={open}
      variant="persistent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          p: 1,
        }}
      >
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItem
          onClick={() => {
            navigate('/statistics');
            handleDrawerClose();
          }}
          sx={{
            px: 3,
            py: 1.5,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <Typography variant="subtitle1" sx={{ color: '#c0392b', fontWeight: 600 }}>
            📊 Statistics
          </Typography>
        </ListItem>
        <Divider sx={{ my: 1 }} />
        {queries.map((query) => (
          <Tooltip title={query.dataAnalysisInformation.question} placement="right" arrow key={query.id}>
            <ListItem
              onClick={() => handleListItemClick(query.id)}
              sx={{
                px: 3,
                py: 1.5,
                cursor: 'pointer',
                borderLeft: '4px solid transparent',
                '&:hover': {
                  backgroundColor: '#f9f9f9',
                  borderLeft: '4px solid #e86161',
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    noWrap
                    variant="body2"
                    sx={{ color: '#444', fontSize: 14 }}
                  >
                    {`${query.id}. ${query.dataAnalysisInformation.question}`}
                  </Typography>
                }
              />
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Drawer>
  );
}

export default MenuDrawer;

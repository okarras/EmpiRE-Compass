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
  ListItemIcon,
} from '@mui/material';
import { queries } from '../constants/queries_chart_info';
import { useNavigate, useLocation } from 'react-router';
import { useEffect } from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HomeIcon from '@mui/icons-material/Home';

const drawerWidth = 280;

interface MenuDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

function MenuDrawer({ open, handleDrawerClose }: MenuDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleListItemClick = (id: number) => {
    navigate(`/questions/${id}`);
    handleDrawerClose();
  };

  const isCurrentPath = (path: string) => location.pathname === path;

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
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '4px 0 8px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease-in-out',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: '#e86161',
          color: 'white',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Navigation
        </Typography>
        <IconButton onClick={handleDrawerClose} sx={{ color: 'white' }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <List sx={{ p: 2 }}>
        {/* Home Link */}
        <ListItem
          onClick={() => {
            navigate('/');
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/') ? 'rgba(232, 97, 97, 0.08)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(232, 97, 97, 0.05)',
            },
          }}
        >
          <ListItemIcon>
            <HomeIcon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/') ? 600 : 500,
                }}
              >
                Home
              </Typography>
            }
          />
        </ListItem>

        {/* Statistics Link */}
        <ListItem
          onClick={() => {
            navigate('/statistics');
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/statistics') ? 'rgba(232, 97, 97, 0.08)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(232, 97, 97, 0.05)',
            },
          }}
        >
          <ListItemIcon>
            <BarChartIcon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/statistics') ? 600 : 500,
                }}
              >
                Statistics
              </Typography>
            }
          />
        </ListItem>

        {/* All Questions Link */}
        <ListItem
          onClick={() => {
            navigate('/allquestions');
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/allquestions') ? 'rgba(232, 97, 97, 0.08)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(232, 97, 97, 0.05)',
            },
          }}
        >
          <ListItemIcon>
            <QuestionAnswerIcon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/allquestions') ? 600 : 500,
                }}
              >
                All Questions
              </Typography>
            }
          />
        </ListItem>

        <Divider sx={{ my: 2 }} />

        {/* Questions List */}
        <Typography
          variant="overline"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            pl: 2,
            display: 'block',
            mb: 1,
          }}
        >
          Research Questions
        </Typography>
        
        {queries.map((query) => (
          <Tooltip
            title={query.dataAnalysisInformation.question}
            placement="right"
            arrow
            key={query.id}
          >
            <ListItem
              onClick={() => handleListItemClick(query.id)}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                backgroundColor: isCurrentPath(`/questions/${query.id}`) 
                  ? 'rgba(232, 97, 97, 0.08)' 
                  : 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(232, 97, 97, 0.05)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.primary',
                      fontWeight: isCurrentPath(`/questions/${query.id}`) ? 600 : 400,
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
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

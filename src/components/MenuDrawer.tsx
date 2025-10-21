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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HomeIcon from '@mui/icons-material/Home';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { templateConfig } from '../constants/template_config';

const templates = templateConfig;

const drawerWidth = 280;

interface MenuDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

function MenuDrawer({ open, handleDrawerClose }: MenuDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTemplate, setSelectedTemplate] =
    useState<keyof typeof templates>('R186491');

  useEffect(() => {
    if (selectedTemplate === 'R186491' || selectedTemplate === 'R1544125') {
      setSelectedTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);
  const currentQueries = templates[selectedTemplate]?.queries ?? [];

  // Read template from URL on mount
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const templateFromUrl = pathSegments[0];
    if (templateFromUrl && templateFromUrl in templates) {
      setSelectedTemplate(templateFromUrl as keyof typeof templates);
    }
  }, [location.pathname]);

  const handleTemplateChange = (
    event: SelectChangeEvent<keyof typeof templates>
  ) => {
    const newTemplate = event.target.value as keyof typeof templates;
    setSelectedTemplate(newTemplate);

    // Navigate to new template, preserving the rest of the path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    pathSegments[0] = newTemplate;
    navigate(`/${pathSegments.join('/')}`);
  };

  const handleListItemClick = (id: number) => {
    navigate(`/${selectedTemplate}/questions/${id}`);
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
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: 4,
          transition: 'transform 0.3s ease-in-out',
        },
      }}
    >
      {/* Top header bar */}
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

      {/* Templates dropdown */}
      <Box
        sx={{
          px: 2,
          pt: 3, // extra space above
          pb: 1,
          backgroundColor: 'transparent',
        }}
      >
        <FormControl
          fullWidth
          size="small"
          sx={{
            borderRadius: 1,
            '& .MuiInputLabel-root': {
              color: '#e86161',
              fontWeight: 600,
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#e86161',
              },
              '&:hover fieldset': {
                borderColor: '#e86161',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#e86161',
              },
              '& .MuiSelect-select': {
                color: '#e86161',
                fontWeight: 600,
              },
            },
          }}
        >
          <InputLabel id="templates-select-label">Templates</InputLabel>
          <Select
            labelId="templates-select-label"
            value={selectedTemplate}
            label="Templates"
            onChange={handleTemplateChange}
            size="small"
            id="menu-drawer-templates-select"
          >
            <MenuItem value="R186491">{templates.R186491.title}</MenuItem>
            <MenuItem value="R1544125">{templates.R1544125.title}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <List sx={{ p: 2 }}>
        {/* Home Link */}
        <ListItem
          onClick={() => {
            navigate(`/${selectedTemplate}/`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
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
            navigate(`/${selectedTemplate}/statistics`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/statistics')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
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
            navigate(`/${selectedTemplate}/allquestions`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/allquestions')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
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

        {/* Dynamic Question Link */}
        <ListItem
          onClick={() => {
            navigate(`/${selectedTemplate}/dynamic-question`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/dynamic-question')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
          }}
        >
          <ListItemIcon>
            <PsychologyIcon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/dynamic-question') ? 600 : 500,
                }}
              >
                Dynamic Question
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

        {currentQueries.map((query) => (
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
                backgroundColor: isCurrentPath(
                  `/${selectedTemplate}/questions/${query.id}`
                )
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
                      fontWeight: isCurrentPath(
                        `/${selectedTemplate}/questions/${query.id}`
                      )
                        ? 600
                        : 400,
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

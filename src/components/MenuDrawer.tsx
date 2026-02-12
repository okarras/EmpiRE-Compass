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
import { useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HomeIcon from '@mui/icons-material/Home';
import PsychologyIcon from '@mui/icons-material/Psychology';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import TemplateManagement, {
  QuestionData,
} from '../firestore/TemplateManagement';
import BackupIcon from '@mui/icons-material/Backup';
import StorageIcon from '@mui/icons-material/Storage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import { useAuthData } from '../auth/useAuthData';
import Groups3Icon from '@mui/icons-material/Groups3';

const drawerWidth = 280;

interface MenuDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

function MenuDrawer({ open, handleDrawerClose }: MenuDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthData();

  const [selectedTemplate, setSelectedTemplate] = useState<string>('R186491');
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [templateTitle, setTemplateTitle] = useState<string>('');

  useEffect(() => {
    //TODO: we should fetch data once and use that everywhere else
    const fetchTemplateData = async () => {
      try {
        const templateData =
          await TemplateManagement.getTemplate(selectedTemplate);
        if (templateData) {
          setTemplateTitle(templateData.title);
        }

        const questionsData =
          await TemplateManagement.getAllQuestions(selectedTemplate);
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching template data:', error);
      }
    };

    fetchTemplateData();
  }, [selectedTemplate]);

  // Read template from URL on mount
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const templateFromUrl = pathSegments[0];
    if (templateFromUrl) {
      setSelectedTemplate(templateFromUrl);
    }
  }, [location.pathname]);

  const handleListItemClick = (id: number) => {
    navigate(`/${selectedTemplate}/questions/${id}`);
    handleDrawerClose();
  };

  const isCurrentPath = (path: string) => {
    // Handle home route
    if (path === '/') {
      const homePath = `/${selectedTemplate}/`;
      return (
        location.pathname === homePath ||
        location.pathname === `/${selectedTemplate}`
      );
    }
    const fullPath = `/${selectedTemplate}${path}`;
    return (
      location.pathname === fullPath ||
      location.pathname.startsWith(fullPath + '/')
    );
  };

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
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Overview and project introduction
              </Typography>
            }
          />
        </ListItem>

        {/* Team Link */}
        <ListItem
          onClick={() => {
            navigate(`/${selectedTemplate}/team`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/team')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
          }}
        >
          <ListItemIcon>
            <PeopleIcon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/team') ? 600 : 500,
                }}
              >
                Team
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Project team and contributors
              </Typography>
            }
          />
        </ListItem>

        {/* News Link */}
        <ListItem
          onClick={() => {
            navigate(`/${selectedTemplate}/news`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/news')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
          }}
        >
          <ListItemIcon>
            <ArticleIcon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/news') ? 600 : 500,
                }}
              >
                News
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Latest updates and announcements
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
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Data visualizations and metrics
              </Typography>
            }
          />
        </ListItem>

        {/* Community Questions Link */}
        <ListItem
          onClick={() => {
            navigate(`/${selectedTemplate}/community-questions`);
            handleDrawerClose();
          }}
          sx={{
            mb: 1,
            borderRadius: 2,
            backgroundColor: isCurrentPath('/community-questions')
              ? 'rgba(232, 97, 97, 0.08)'
              : 'transparent',
            '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
          }}
        >
          <ListItemIcon>
            <Groups3Icon sx={{ color: '#e86161' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#e86161',
                  fontWeight: isCurrentPath('/community-questions') ? 600 : 500,
                }}
              >
                Community Questions
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Questions from the community
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
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                AI-powered question generation
              </Typography>
            }
          />
        </ListItem>

        {/* All Questions Link (Empirical/Curated) */}
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
                {templateTitle || 'Loading...'} Questions
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Curated research questions
              </Typography>
            }
          />
        </ListItem>

        <Divider sx={{ my: 2 }} />

        {/* Admin Section */}
        {user?.is_admin && (
          <>
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
              Admin Tools
            </Typography>

            {/* Admin Dashboard Link */}
            <ListItem
              onClick={() => {
                navigate(`/${selectedTemplate}/admin`);
                handleDrawerClose();
              }}
              sx={{
                mb: 1,
                borderRadius: 2,
                backgroundColor: isCurrentPath(`/${selectedTemplate}/admin`)
                  ? 'rgba(232, 97, 97, 0.08)'
                  : 'transparent',
                '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon sx={{ color: '#e86161' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#e86161',
                      fontWeight: isCurrentPath(`/${selectedTemplate}/admin`)
                        ? 600
                        : 500,
                    }}
                  >
                    Dashboard
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    Admin overview and controls
                  </Typography>
                }
              />
            </ListItem>

            {/* Data Management Link */}
            <ListItem
              onClick={() => {
                navigate(`/${selectedTemplate}/admin/data`);
                handleDrawerClose();
              }}
              sx={{
                mb: 1,
                borderRadius: 2,
                backgroundColor: isCurrentPath(
                  `/${selectedTemplate}/admin/data`
                )
                  ? 'rgba(232, 97, 97, 0.08)'
                  : 'transparent',
                '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
              }}
            >
              <ListItemIcon>
                <StorageIcon sx={{ color: '#e86161' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#e86161',
                      fontWeight: isCurrentPath(
                        `/${selectedTemplate}/admin/data`
                      )
                        ? 600
                        : 500,
                    }}
                  >
                    Data Management
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    Import and manage data
                  </Typography>
                }
              />
            </ListItem>

            {/* Admin Backup Link */}
            <ListItem
              onClick={() => {
                navigate(`/${selectedTemplate}/admin/backup`);
                handleDrawerClose();
              }}
              sx={{
                mb: 1,
                borderRadius: 2,
                backgroundColor: isCurrentPath(
                  `/${selectedTemplate}/admin/backup`
                )
                  ? 'rgba(232, 97, 97, 0.08)'
                  : 'transparent',
                '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
              }}
            >
              <ListItemIcon>
                <BackupIcon sx={{ color: '#e86161' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#e86161',
                      fontWeight: isCurrentPath(
                        `/${selectedTemplate}/admin/backup`
                      )
                        ? 600
                        : 500,
                    }}
                  >
                    Backup
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    Backup and restore data
                  </Typography>
                }
              />
            </ListItem>

            {/* Home Content Management Link */}
            <ListItem
              onClick={() => {
                navigate(`/${selectedTemplate}/admin/home-content`);
                handleDrawerClose();
              }}
              sx={{
                mb: 1,
                borderRadius: 2,
                backgroundColor: isCurrentPath(
                  `/${selectedTemplate}/admin/home-content`
                )
                  ? 'rgba(232, 97, 97, 0.08)'
                  : 'transparent',
                '&:hover': { backgroundColor: 'rgba(232, 97, 97, 0.05)' },
              }}
            >
              <ListItemIcon>
                <EditIcon sx={{ color: '#e86161' }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#e86161',
                      fontWeight: isCurrentPath(
                        `/${selectedTemplate}/admin/home-content`
                      )
                        ? 600
                        : 500,
                    }}
                  >
                    Home Content
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    Edit home page content
                  </Typography>
                }
              />
            </ListItem>

            <Divider sx={{ my: 2 }} />
          </>
        )}

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

        {questions.map((question) => (
          <Tooltip
            title={question.dataAnalysisInformation.question}
            placement="right"
            arrow
            key={question.id}
          >
            <ListItem
              onClick={() => handleListItemClick(question.id)}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                backgroundColor: isCurrentPath(
                  `/${selectedTemplate}/questions/${question.id}`
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
                        `/${selectedTemplate}/questions/${question.id}`
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
                    {`${question.id}. ${question.dataAnalysisInformation.question}`}
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

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  useTheme as useMuiTheme,
  useMediaQuery,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
// import LightModeIcon from '@mui/icons-material/LightMode';
// import DarkModeIcon from '@mui/icons-material/DarkMode';
import GitHubIcon from '@mui/icons-material/GitHub';
import BookIcon from '@mui/icons-material/Book';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import { queries } from '../constants/queries_chart_info';
// import { useTheme } from '../contexts/ThemeContext';
import LoginORKG from './LoginORKG';
import { templateConfig } from '../constants/template_config';
import { useState, useEffect } from 'react';

interface HeaderProps {
  handleDrawerOpen: () => void;
}

const templates = templateConfig;

const Header = ({ handleDrawerOpen }: HeaderProps) => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  // const { mode, toggleColorMode } = useTheme();

  const [selectedTemplate, setSelectedTemplate] =
    useState<keyof typeof templates>('R186491');

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

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    if (paths.length > 0) {
      // Add template name as first breadcrumb
      const templateId = paths[0];
      const templateName = templates[templateId]?.title || 'Template';
      breadcrumbs.push({
        path: `/${templateId}/`,
        label: templateName,
      });

      // Add remaining path segments
      paths.slice(1).forEach((path, index) => {
        let fullPath = '/' + paths.slice(0, index + 2).join('/');
        let label = path.charAt(0).toUpperCase() + path.slice(1);

        // Handle specific route names
        if (path === 'allquestions') {
          label = `${templateName} Questions`;
        } else if (path === 'statistics') {
          label = 'Statistics';
        } else if (path === 'dynamic-question') {
          label = 'Dynamic Question';
        } else if (path === 'graph') {
          label = 'Graph Schema';
        } else if (path === 'questions' && paths[index + 2]) {
          const questionId = parseInt(paths[index + 2]);
          const question = queries.find((q) => q.id === questionId);
          if (question) {
            label = `All Questions`;
            fullPath = `/${templateId}/allquestions`;
          }
        }

        breadcrumbs.push({ path: fullPath, label });
      });
    }

    return breadcrumbs;
  };
  const redirectToGitHub = () => {
    window.open('https://github.com/okarras/empire-Compass/', '_blank');
  };

  const redirectToStorybook = () => {
    // TODO: Replace with your actual Chromatic Storybook URL after deployment
    // Example: https://64a1b2c3d4e5f6789012345.chromatic.com
    // To deploy: npm run deploy:chromatic (requires CHROMATIC_PROJECT_TOKEN)
    window.open(
      'https://empire-compass-storybooks.vercel.app/?path=/docs/layout-menudrawer--docs',
      '_blank'
    );
  };

  const redirectToArchitecture = () => {
    // Navigate to the in-app JSON graph view
    const paths = location.pathname.split('/').filter(Boolean);
    const templateId = paths[0] || 'R186491';
    window.location.href = `/${templateId}/graph`;
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
          py: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            size="small"
            sx={{
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <MenuIcon sx={{ fontSize: '1.5rem' }} />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#e86161',
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '-0.02em',
              '&:hover': {
                opacity: 0.85,
              },
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            EmpiRE-Compass
          </Typography>

          {!isMobile && (
            <Breadcrumbs
              separator={
                <NavigateNextIcon
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              }
              aria-label="breadcrumb"
              sx={{
                '& .MuiBreadcrumbs-li': {
                  display: 'flex',
                  alignItems: 'center',
                },
                maxWidth: { sm: 300, md: 400 },
                overflow: 'hidden',
                ml: 2,
              }}
            >
              {getBreadcrumbs().map((breadcrumb, index) => {
                const isLast = index === getBreadcrumbs().length - 1;
                return isLast ? (
                  <Typography
                    key={breadcrumb.path}
                    color="text.primary"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {breadcrumb.label}
                  </Typography>
                ) : (
                  <Link
                    key={breadcrumb.path}
                    component={RouterLink}
                    to={breadcrumb.path}
                    color="text.secondary"
                    sx={{
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#e86161',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {breadcrumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}
        >
          <LoginORKG />

          {/* Templates dropdown */}
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 140, sm: 180 },
              '& .MuiInputLabel-root': {
                fontSize: '0.8125rem',
                fontWeight: 500,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'text.secondary',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#e86161',
                  borderWidth: 1.5,
                },
                '& .MuiSelect-select': {
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  py: 1,
                },
              },
            }}
          >
            <InputLabel id="header-templates-select-label">Template</InputLabel>
            <Select
              labelId="header-templates-select-label"
              value={selectedTemplate}
              label="Template"
              onChange={handleTemplateChange}
              size="small"
              id="header-templates-select"
            >
              <MenuItem value="R186491" sx={{ fontSize: '0.875rem' }}>
                {templates.R186491.title}
              </MenuItem>
              <MenuItem value="R1544125" sx={{ fontSize: '0.875rem' }}>
                {templates.R1544125.title}
              </MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Tooltip title="Components">
              <IconButton
                onClick={redirectToStorybook}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <BookIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Graph">
              <IconButton
                onClick={redirectToArchitecture}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <AccountTreeIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="GitHub">
              <IconButton
                onClick={redirectToGitHub}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'text.primary',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <GitHubIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

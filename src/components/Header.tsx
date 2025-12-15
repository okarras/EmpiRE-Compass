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
import ApiIcon from '@mui/icons-material/Api';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import { queries } from '../constants/queries_chart_info';
// import { useTheme } from '../contexts/ThemeContext';
import LoginORKG from './LoginORKG';
import { templateConfig } from '../constants/template_config';
import { useState, useEffect } from 'react';
import CRUDHomeContent, { Template } from '../firestore/CRUDHomeContent';
import { toast } from 'react-hot-toast';

interface HeaderProps {
  handleDrawerOpen: () => void;
}

const Header = ({ handleDrawerOpen }: HeaderProps) => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  // const { mode, toggleColorMode } = useTheme();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('R186491');

  // Load templates from Firebase
  useEffect(() => {
    const loadTemplates = async () => {
      const content = await CRUDHomeContent.getHomeContent();
      if (content.templates && content.templates.length > 0) {
        setTemplates(content.templates);
      } else {
        // Fallback to default templates
        setTemplates(CRUDHomeContent.defaultHomeContent.templates);
      }
    };
    loadTemplates();
  }, []);

  // Read template from URL on mount
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const templateFromUrl = pathSegments[0];
    if (templateFromUrl && templates.some((t) => t.id === templateFromUrl)) {
      setSelectedTemplate(templateFromUrl);
    }
  }, [location.pathname, templates]);

  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    const newTemplate = event.target.value;
    setSelectedTemplate(newTemplate);
    toast.success(`Theme changed to ${templateConfig[newTemplate]?.title}`);

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
      const template = templates.find((t) => t.id === templateId);
      const templateName =
        template?.title || templateConfig[templateId]?.title || 'Theme';
      breadcrumbs.push({
        path: `/${templateId}/`,
        label: templateName,
      });

      // Add remaining path segments
      paths.slice(1).forEach((path, index) => {
        const actualIndex = index + 1; // Actual index in paths array
        const fullPath = '/' + paths.slice(0, index + 2).join('/');
        let label = path.charAt(0).toUpperCase() + path.slice(1);

        // Handle specific route names
        if (path === 'allquestions') {
          label = `All Questions`;
        } else if (path === 'statistics') {
          label = 'Statistics';
        } else if (path === 'team') {
          label = 'Team';
        } else if (path === 'dynamic-question') {
          label = 'Dynamic Question';
        } else if (path === 'schema') {
          label = 'Schema';
        } else if (path === 'questions') {
          // Show 'All Questions' for the questions segment
          label = 'All Questions';
          // If there's a question ID after, adjust the path to point to allquestions
          if (paths[actualIndex + 1]) {
            const adjustedPath =
              '/' + paths.slice(0, actualIndex).join('/') + '/allquestions';
            breadcrumbs.push({ path: adjustedPath, label });
            return; // Skip adding the actual questions path, we'll handle the ID next
          }
        } else if (actualIndex > 0 && paths[actualIndex - 1] === 'questions') {
          // This is a question ID following 'questions'
          const questionId = parseInt(path);
          const question = queries.find((q) => q.id === questionId);
          if (question) {
            label = `Question ${questionId}`;
          } else {
            label = `Question ${path}`;
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
    // Navigate to the in-app JSON schema view
    const paths = location.pathname.split('/').filter(Boolean);
    const templateId = paths[0] || 'R186491';
    window.location.href = `/${templateId}/schema`;
  };

  const redirectToSwagger = () => {
    window.open('https://empirecompassbackend.vercel.app/api-docs/', '_blank');
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
          minHeight: { xs: 64, sm: 72 },
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 1 },
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: { xs: 'flex-start', md: 'space-between' },
          gap: { xs: 1.75, md: 0 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: { xs: '100%', md: 'auto' },
            gap: { xs: 1, md: 1.5 },
            flex: { md: '1 1 auto' },
          }}
        >
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
            to={`/${selectedTemplate}/`}
            sx={{
              flexGrow: { xs: 1, sm: 0 },
              textDecoration: 'none',
              color: '#e86161',
              fontWeight: 600,
              fontSize: { xs: '1.2rem', sm: '1.25rem' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              letterSpacing: '-0.02em',
              textAlign: { xs: 'center', sm: 'left' },
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
          sx={{
            width: { xs: '100%', md: 'auto' },
            display: { xs: 'grid', md: 'flex' },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fit, minmax(200px, 1fr))',
              md: 'unset',
            },
            justifyItems: { xs: 'center', md: 'unset' },
            alignItems: 'center',
            gap: { xs: 1.25, md: 2 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
              width: { xs: '100%', md: 'auto' },
            }}
          >
            <LoginORKG />
          </Box>

          {/* Templates dropdown */}
          <FormControl
            size="small"
            fullWidth={isMobile}
            sx={{
              minWidth: { xs: '100%', md: 200 },
              '& .MuiInputLabel-root': {
                fontSize: '0.8125rem',
                fontWeight: 500,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                backgroundColor: { xs: 'background.default', sm: 'inherit' },
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
            <InputLabel id="header-templates-select-label">Theme</InputLabel>
            <Select
              labelId="header-templates-select-label"
              value={selectedTemplate}
              label="Theme"
              onChange={handleTemplateChange}
              size="small"
              id="header-templates-select"
            >
              {templates.map((template) => (
                <MenuItem
                  key={template.id}
                  value={template.id}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {template.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'flex-end',
            width: 'auto',
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
          <Tooltip title="API Docs">
            <IconButton
              onClick={redirectToSwagger}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ApiIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Schema">
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;

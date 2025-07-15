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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import GitHubIcon from '@mui/icons-material/GitHub';
import BookIcon from '@mui/icons-material/Book';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { queries } from '../constants/queries_chart_info';
import { useTheme } from '../contexts/ThemeContext';
import ApiIcon from '@mui/icons-material/Api';
interface HeaderProps {
  handleDrawerOpen: () => void;
}

const Header = ({ handleDrawerOpen }: HeaderProps) => {
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const location = useLocation();
  const { mode, toggleColorMode } = useTheme();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ path: '/', label: 'Home' }];

    if (paths.length > 0) {
      paths.forEach((path, index) => {
        const fullPath = '/' + paths.slice(0, index + 1).join('/');
        let label = path.charAt(0).toUpperCase() + path.slice(1);

        if (path === 'questions' && paths[index + 1]) {
          const questionId = parseInt(paths[index + 1]);
          const question = queries.find((q) => q.id === questionId);
          if (question) {
            label = `Question ${questionId}`;
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

  const openApiSettings = () => {
    console.log('openApiSettings');
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
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(232, 97, 97, 0.08)',
              },
            }}
          >
            <MenuIcon sx={{ color: '#e86161' }} />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#e86161',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              mr: 3,
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            EmpiRE-Compass
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

          <Tooltip
            title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          >
            <IconButton
              onClick={toggleColorMode}
              color="inherit"
              sx={{
                ml: 2,
                '&:hover': {
                  backgroundColor: 'rgba(232, 97, 97, 0.08)',
                },
              }}
            >
              {mode === 'light' ? (
                <DarkModeIcon sx={{ color: 'text.primary' }} />
              ) : (
                <LightModeIcon sx={{ color: 'text.primary' }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="View Design System & Components">
            <IconButton
              onClick={redirectToStorybook}
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(232, 97, 97, 0.08)',
                },
              }}
            >
              <BookIcon sx={{ color: 'text.primary' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Check out the source code on GitHub`}>
            <IconButton
              onClick={redirectToGitHub}
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(232, 97, 97, 0.08)',
                },
              }}
            >
              <GitHubIcon sx={{ color: 'text.primary' }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'right',
                  display: 'block',
                  mt: 1,
                  opacity: 0.7,
                }}
              >
                v{import.meta.env.VITE_APP_VERSION}
              </Typography>
            </IconButton>
          </Tooltip>
          <Tooltip title="Select AI Model and provide API Key">
            <IconButton color="inherit" onClick={() => openApiSettings()}>
              <ApiIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

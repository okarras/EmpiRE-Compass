import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { queries } from '../constants/queries_chart_info';

interface HeaderProps {
  handleDrawerOpen: () => void;
}

const Header = ({ handleDrawerOpen }: HeaderProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { path: '/', label: 'Home' },
    ];

    if (paths.length > 0) {
      paths.forEach((path, index) => {
        const fullPath = '/' + paths.slice(0, index + 1).join('/');
        let label = path.charAt(0).toUpperCase() + path.slice(1);

        if (path === 'questions' && paths[index + 1]) {
          const questionId = parseInt(paths[index + 1]);
          const question = queries.find(q => q.id === questionId);
          if (question) {
            label = `Question ${questionId}`;
          }
        }

        breadcrumbs.push({ path: fullPath, label });
      });
    }

    return breadcrumbs;
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
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

        {!isMobile && (
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;

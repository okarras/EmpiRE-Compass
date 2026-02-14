import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import {
  Drawer,
  Box,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BarChart,
  QuestionAnswer,
  Home,
  Psychology,
  People,
  Article,
  Backup,
  Storage,
  AdminPanelSettings,
  Edit,
  MenuBook,
  Groups3,
} from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import TemplateManagement, {
  type QuestionData,
} from '../firestore/TemplateManagement';
import { useAuthData } from '../auth/useAuthData';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAWER_WIDTH = 280;

const ACCENT_COLOR = '#e86161';
const ACTIVE_BG = 'rgba(232, 97, 97, 0.08)';
const HOVER_BG = 'rgba(232, 97, 97, 0.05)';

const listItemStyles: SxProps<Theme> = {
  mb: 1,
  borderRadius: 2,
  '&:hover': { backgroundColor: HOVER_BG },
};

const sectionHeaderStyles: SxProps<Theme> = {
  color: 'text.secondary',
  fontWeight: 600,
  pl: 2,
  display: 'block',
  mb: 1,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItemConfig {
  path: string;
  label: string;
  tooltip: string;
  Icon: React.ComponentType<{ sx?: SxProps<Theme> }>;
}

interface MenuDrawerProps {
  open: boolean;
  handleDrawerClose: () => void;
}

// ---------------------------------------------------------------------------
// Navigation Items Config
// ---------------------------------------------------------------------------

const GENERAL_NAV_ITEMS: NavItemConfig[] = [
  {
    path: '/',
    label: 'Project Overview',
    tooltip: 'Details of the project',
    Icon: Home,
  },
  {
    path: '/team',
    label: 'Team & Publications',
    tooltip: 'Project team and published papers',
    Icon: People,
  },
  {
    path: '/news',
    label: 'New',
    tooltip: 'Latest updates',
    Icon: Article,
  },
  {
    path: '/statistics',
    label: 'Statistics',
    tooltip: 'KG Statistics',
    Icon: BarChart,
  },
];

const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  {
    path: '/admin',
    label: 'Dashboard',
    tooltip: 'Admin overview and controls',
    Icon: AdminPanelSettings,
  },
  {
    path: '/admin/data',
    label: 'Data Management',
    tooltip: 'Import and manage data',
    Icon: Storage,
  },
  {
    path: '/admin/backup',
    label: 'Backup',
    tooltip: 'Backup and restore data',
    Icon: Backup,
  },
  {
    path: '/admin/home-content',
    label: 'Home Content',
    tooltip: 'Edit home page content',
    Icon: Edit,
  },
  {
    path: '/admin/news',
    label: 'News Management',
    tooltip: 'Create and manage news announcements',
    Icon: Article,
  },
  {
    path: '/admin/papers',
    label: 'Papers',
    tooltip: 'Manage published papers',
    Icon: MenuBook,
  },
];

const COMMUNITY_NAV_ITEMS: NavItemConfig[] = [
  {
    path: '/community-questions',
    label: 'Community Questions',
    tooltip: 'Questions from the community',
    Icon: Groups3,
  },
  {
    path: '/dynamic-question',
    label: 'Dynamic Question',
    tooltip: 'AI-supported question generation',
    Icon: Psychology,
  },
];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  children: React.ReactNode;
}

function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <Typography variant="overline" sx={sectionHeaderStyles}>
      {children}
    </Typography>
  );
}

interface NavItemProps {
  path: string;
  label: string;
  tooltip: string;
  Icon: React.ComponentType<{ sx?: SxProps<Theme> }>;
  templateId: string;
  isCurrentPath: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

function NavItem({
  path,
  label,
  tooltip,
  Icon,
  templateId,
  isCurrentPath,
  onNavigate,
}: NavItemProps) {
  const fullPath = path === '/' ? `/${templateId}/` : `/${templateId}${path}`;
  const isActive = path === '/' ? isCurrentPath('/') : isCurrentPath(path);

  return (
    <Tooltip title={tooltip} placement="right" arrow>
      <ListItem
        onClick={() => onNavigate(fullPath)}
        sx={{
          ...listItemStyles,
          backgroundColor: isActive ? ACTIVE_BG : 'transparent',
        }}
      >
        <ListItemIcon>
          <Icon sx={{ color: ACCENT_COLOR }} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="subtitle1"
              sx={{ color: ACCENT_COLOR, fontWeight: isActive ? 600 : 500 }}
            >
              {label}
            </Typography>
          }
        />
      </ListItem>
    </Tooltip>
  );
}

interface QuestionNavItemProps {
  question: QuestionData;
  isCurrentPath: (path: string) => boolean;
  onQuestionClick: (id: number) => void;
}

function QuestionNavItem({
  question,
  isCurrentPath,
  onQuestionClick,
}: QuestionNavItemProps) {
  const path = `/questions/${question.id}`;
  const isActive = isCurrentPath(path);

  return (
    <Tooltip
      title={question.dataAnalysisInformation.question}
      placement="right"
      arrow
    >
      <ListItem
        onClick={() => onQuestionClick(question.id)}
        sx={{
          mb: 0.5,
          borderRadius: 2,
          backgroundColor: isActive ? ACTIVE_BG : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: HOVER_BG,
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
                fontWeight: isActive ? 600 : 400,
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
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function MenuDrawer({ open, handleDrawerClose }: MenuDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthData();

  const [selectedTemplate, setSelectedTemplate] = useState('R186491');
  const [questions, setQuestions] = useState<QuestionData[]>([]);

  // Sync template from URL
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const templateFromUrl = pathSegments[0];
    if (templateFromUrl) {
      setSelectedTemplate(templateFromUrl);
    }
  }, [location.pathname]);

  // Fetch template data
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        const questionsData =
          await TemplateManagement.getAllQuestions(selectedTemplate);
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching template data:', error);
      }
    };
    fetchTemplateData();
  }, [selectedTemplate]);

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDrawerClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDrawerClose]);

  const isCurrentPath = (path: string): boolean => {
    if (path === '/') {
      return (
        location.pathname === `/${selectedTemplate}/` ||
        location.pathname === `/${selectedTemplate}`
      );
    }
    const fullPath = `/${selectedTemplate}${path}`;
    return (
      location.pathname === fullPath ||
      location.pathname.startsWith(`${fullPath}/`)
    );
  };

  const handleNavigate = (fullPath: string) => {
    navigate(fullPath);
    handleDrawerClose();
  };

  const handleQuestionClick = (id: number) => {
    navigate(`/${selectedTemplate}/questions/${id}`);
    handleDrawerClose();
  };

  const renderNavItems = (items: NavItemConfig[]) =>
    items.map(({ path, label, tooltip, Icon }) => (
      <NavItem
        key={path}
        path={path}
        label={label}
        tooltip={tooltip}
        Icon={Icon}
        templateId={selectedTemplate}
        isCurrentPath={isCurrentPath}
        onNavigate={handleNavigate}
      />
    ));

  return (
    <Drawer
      anchor="left"
      open={open}
      variant="persistent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: 4,
          transition: 'transform 0.3s ease-in-out',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: ACCENT_COLOR,
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
        {/* General */}
        <SectionHeader>General</SectionHeader>
        {renderNavItems(GENERAL_NAV_ITEMS)}

        {/* Admin (guarded) */}
        {user?.is_admin && (
          <>
            <Divider sx={{ my: 2 }} />
            <SectionHeader>Admin</SectionHeader>
            {renderNavItems(ADMIN_NAV_ITEMS)}
          </>
        )}

        {/* Community */}
        <Divider sx={{ my: 2 }} />
        <SectionHeader>Community</SectionHeader>
        {renderNavItems(COMMUNITY_NAV_ITEMS)}

        {/* Curated Questions */}
        <Divider sx={{ my: 2 }} />
        <SectionHeader>Curated Questions</SectionHeader>
        <Tooltip title="All curated questions" placement="right" arrow>
          <ListItem
            onClick={() => handleNavigate(`/${selectedTemplate}/allquestions`)}
            sx={{
              ...listItemStyles,
              backgroundColor: isCurrentPath('/allquestions')
                ? ACTIVE_BG
                : 'transparent',
            }}
          >
            <ListItemIcon>
              <QuestionAnswer sx={{ color: ACCENT_COLOR }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: ACCENT_COLOR,
                    fontWeight: isCurrentPath('/allquestions') ? 600 : 500,
                  }}
                >
                  All Questions
                </Typography>
              }
            />
          </ListItem>
        </Tooltip>

        {questions.map((question) => (
          <QuestionNavItem
            key={question.id}
            question={question}
            isCurrentPath={isCurrentPath}
            onQuestionClick={handleQuestionClick}
          />
        ))}
      </List>
    </Drawer>
  );
}

export default MenuDrawer;

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Dialog,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Paper,
  Slide,
  Zoom,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useAIAssistantContext } from '../../context/AIAssistantContext';
import AIAssistant from './AIAssistant';
import { useLocation } from 'react-router-dom';

const Transition = React.forwardRef(function Transition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
  ref: React.Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const ProjectOverview = () => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      background: 'rgba(255,255,255,0.95)',
      borderRadius: 2,
      border: '1px solid #eee',
      mb: 2,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <SmartToyIcon sx={{ color: '#e86161' }} />
      <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 700 }}>
        Welcome to EmpiRE-Compass!
      </Typography>
    </Box>
    <Typography sx={{ mb: 2 }}>
      <b>EmpiRE-Compass</b> is a community-maintainable knowledge graph
      dashboard for empirical research in Requirements Engineering. Explore
      research questions, analyze data, and get AI-powered insights.
    </Typography>
    <Typography sx={{ mb: 1 }}>
      <b>Helpful Links:</b>
    </Typography>
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      <li>
        <a
          href="https://github.com/okarras/empire-Compass"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Repository
        </a>
      </li>
      <li>
        <a
          href="https://mybinder.org/v2/gh/okarras/EmpiRE-Analysis/HEAD?labpath=%2Fempire-analysis.ipynb"
          target="_blank"
          rel="noopener noreferrer"
        >
          Run Analysis in Binder
        </a>
      </li>
      <li>
        <a href="https://orkg.org/" target="_blank" rel="noopener noreferrer">
          Open Research Knowledge Graph (ORKG)
        </a>
      </li>
    </ul>
    <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.95rem' }}>
      Use the navigation menu to explore research questions or ask the AI
      assistant about the project!
    </Typography>
  </Paper>
);

const FloatingAIAssistant: React.FC = () => {
  const { isOpen, toggleAssistant, currentQuery, currentData, setContext } =
    useAIAssistantContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isExpanded, setIsExpanded] = useState(isMobile);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const location = useLocation();

  // Update context on route change
  useEffect(() => {
    if (location.pathname === '/') {
      setContext(null, null); // overview mode
    }
  }, [location.pathname, setContext]);

  // Set initial position when dialog opens or expands
  useEffect(() => {
    if (isOpen) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (isExpanded) {
        // When expanded, position at (0,0) to take full viewport
        setPosition({ x: 0, y: 0 });
      } else {
        // When not expanded, position in bottom-right corner
        setPosition({
          x: viewportWidth - 400 - 24,
          y: viewportHeight - 400 - 24,
        });
      }
    }
  }, [isOpen, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return; // Disable dragging when expanded
    if (e.target instanceof HTMLElement && e.target.closest('.dialog-header')) {
      e.preventDefault();
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isExpanded) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate new position
    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;

    // Constrain to viewport bounds
    newX = Math.max(0, Math.min(newX, viewportWidth - 400));
    newY = Math.max(0, Math.min(newY, viewportHeight - 400));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isExpanded]);

  return (
    <>
      <Zoom in={!isOpen}>
        <Fab
          color="primary"
          onClick={toggleAssistant}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#e86161',
            '&:hover': {
              backgroundColor: '#d45151',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(232, 97, 97, 0.3)',
            zIndex: 1200,
          }}
        >
          <SmartToyIcon />
        </Fab>
      </Zoom>

      <Dialog
        open={isOpen}
        onClose={toggleAssistant}
        TransitionComponent={Transition}
        hideBackdrop
        disableEnforceFocus
        disableAutoFocus
        disablePortal
        disableScrollLock
        PaperProps={{
          ref: dialogRef,
          sx: {
            position: 'fixed',
            left: isExpanded ? position.x : position.x - 180,
            top: isExpanded ? position.y : position.y - 350,
            right: isExpanded ? 0 : 0,
            width: isExpanded ? '100vw' : 600,
            height: isExpanded ? '100vh' : 800,
            maxHeight: isMobile ? '80vh' : 'none',
            margin: 0,
            borderRadius: isExpanded ? 0 : '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            cursor: isDragging ? 'grabbing' : 'default',
            zIndex: 1200,
            resize: isExpanded ? 'none' : 'both',
            minWidth: isExpanded ? '100vw' : 300,
            minHeight: isExpanded ? '100vh' : 300,
            '& .MuiDialog-paper': {
              margin: 0,
            },
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'background.paper',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Header */}
          <Box
            className="dialog-header"
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#e86161',
              color: 'white',
              cursor: isExpanded ? 'default' : 'grab',
              userSelect: 'none',
              '&:active': {
                cursor: isExpanded ? 'default' : 'grabbing',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Research Assistant
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isMobile && (
                <Tooltip title={isExpanded ? 'Shrink' : 'Expand'}>
                  <IconButton
                    onClick={handleExpand}
                    size="small"
                    sx={{ color: 'white' }}
                  >
                    {isExpanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Close">
                <IconButton
                  onClick={toggleAssistant}
                  size="small"
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {currentQuery && currentData ? (
              <AIAssistant query={currentQuery} questionData={currentData} />
            ) : (
              <ProjectOverview />
            )}
          </Box>
        </Paper>
      </Dialog>
    </>
  );
};

export default FloatingAIAssistant;

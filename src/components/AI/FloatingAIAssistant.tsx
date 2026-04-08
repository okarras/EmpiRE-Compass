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
  Button,
  Link,
  Card,
  CardContent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { useAIAssistantContext } from '../../context/AIAssistantContext';
import type {
  PaperInfoItem,
  RelatedPaperInAsk,
} from '../../context/AIAssistantContext';
import AIAssistant from './AIAssistant';
import { useLocation } from 'react-router-dom';

const ORKG_ASK_ITEM_URL = 'https://ask.orkg.org/item/';

function formatAuthors(authors: PaperInfoItem['authors']): string {
  if (!authors || !Array.isArray(authors)) return '';
  return authors
    .map((a) =>
      typeof a === 'string' ? a : ((a as { name?: string })?.name ?? '')
    )
    .filter(Boolean)
    .join(', ');
}

const RelatedPapersSlider: React.FC<{
  papers: RelatedPaperInAsk[];
}> = ({ papers }) => {
  const [index, setIndex] = useState(0);
  const canPrev = index > 0;
  const canNext = index < papers.length - 1;
  const rp = papers[index];
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 600, mb: 1.5, color: '#e86161' }}
      >
        Related papers in ORKG Ask ({index + 1} / {papers.length})
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={!canPrev}
          aria-label="Previous paper"
        >
          <ChevronLeftIcon />
        </IconButton>
        <Card
          component={Link}
          href={`${ORKG_ASK_ITEM_URL}${rp.id}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            flex: 1,
            minWidth: 0,
            textDecoration: 'none',
            color: 'inherit',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: 4 },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}
            >
              {rp.title || `Paper ${rp.id}`}
            </Typography>
            {rp.year && (
              <Typography variant="caption" color="text.secondary">
                {rp.year}
              </Typography>
            )}
            {rp.abstract && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '0.8rem',
                }}
              >
                {rp.abstract}
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{ mt: 1, display: 'block', color: '#e86161' }}
            >
              Open in ORKG Ask →
            </Typography>
          </CardContent>
        </Card>
        <IconButton
          size="small"
          onClick={() => setIndex((i) => Math.min(papers.length - 1, i + 1))}
          disabled={!canNext}
          aria-label="Next paper"
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

const PaperInfoView: React.FC<{
  item: PaperInfoItem;
  orkgResourceUri?: string | null;
  onClose: () => void;
}> = ({ item, orkgResourceUri, onClose }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      background: 'rgba(255,255,255,0.95)',
      borderRadius: 2,
      border: '1px solid #eee',
    }}
  >
    <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 700, mb: 2 }}>
      {item.title ?? 'Paper'}
    </Typography>
    {item.authors && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <b>Authors:</b> {formatAuthors(item.authors)}
      </Typography>
    )}
    {(item.year ?? item.date_published) && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <b>Year:</b> {String(item.year ?? item.date_published ?? '')}
      </Typography>
    )}
    {item.doi && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <b>DOI:</b>{' '}
        <Link
          href={`https://doi.org/${item.doi}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.doi}
        </Link>
      </Typography>
    )}
    {orkgResourceUri && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <b>ORKG:</b>{' '}
        <Link href={orkgResourceUri} target="_blank" rel="noopener noreferrer">
          View in ORKG
        </Link>
      </Typography>
    )}
    {item.abstract && (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 1, color: '#e86161' }}
        >
          Abstract
        </Typography>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            color: 'text.secondary',
          }}
        >
          {item.abstract}
        </Typography>
      </Box>
    )}
    {item.relatedPapersInAsk && item.relatedPapersInAsk.length > 0 && (
      <RelatedPapersSlider papers={item.relatedPapersInAsk} />
    )}
    <Box sx={{ mt: 2 }}>
      <Button variant="outlined" onClick={onClose}>
        Close
      </Button>
    </Box>
  </Paper>
);

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
  const {
    isOpen,
    toggleAssistant,
    currentQuery,
    currentData,
    setContext,
    paperInfo,
    orkgResourceUri,
    setPaperInfo,
    isExpanded,
    setIsExpanded,
  } = useAIAssistantContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // const [isExpanded, setIsExpanded] = useState(isMobile);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const location = useLocation();

  // Update context on route change
  useEffect(() => {
    if (location.pathname === '/') {
      setContext(null, null);
      setPaperInfo(null);
    }
  }, [location.pathname, setContext, setPaperInfo]);

  const getViewport = () => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const getCollapsedSize = () => {
    const { width: viewportWidth, height: viewportHeight } = getViewport();
    const width = Math.max(
      320,
      Math.min(600, viewportWidth ? viewportWidth - 32 : 600)
    );
    const height = Math.max(
      480,
      Math.min(720, viewportHeight ? viewportHeight - 64 : 720)
    );
    return { width, height };
  };

  // Set initial position when dialog opens or expands
  useEffect(() => {
    if (isOpen) {
      const { width: viewportWidth, height: viewportHeight } = getViewport();
      const { width, height } = getCollapsedSize();

      if (isExpanded || isMobile) {
        // When expanded, position at (0,0) to take full viewport
        setPosition({ x: 0, y: 0 });
      } else {
        // When not expanded, position in bottom-right corner
        setPosition({
          x: Math.max(16, viewportWidth - width - 24),
          y: Math.max(16, viewportHeight - height - 24),
        });
      }
    }
  }, [isOpen, isExpanded, isMobile]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCloseDialog = () => {
    setPaperInfo(null);
    toggleAssistant();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded || isMobile) return; // Disable dragging when expanded or on mobile
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
    if (!isDragging || isExpanded || isMobile) return;

    const { width: viewportWidth, height: viewportHeight } = getViewport();
    const { width, height } = getCollapsedSize();

    // Calculate new position
    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;

    // Constrain to viewport bounds
    newX = Math.max(16, Math.min(newX, viewportWidth - width - 16));
    newY = Math.max(16, Math.min(newY, viewportHeight - height - 16));

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
        onClose={() => {}}
        TransitionComponent={Transition}
        fullScreen={isMobile || isExpanded}
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        disablePortal
        disableScrollLock
        slotProps={{
          root: { sx: { pointerEvents: 'none' } },
          backdrop: {
            sx: {
              backgroundColor: 'transparent',
              pointerEvents: 'none',
            },
          },
        }}
        sx={{
          pointerEvents: 'none',
          '& .MuiDialog-paper': {
            pointerEvents: 'auto',
          },
        }}
        PaperProps={{
          ref: dialogRef,
          sx: () => {
            const base = {
              pointerEvents: 'auto' as const,
            };
            if (isMobile || isExpanded) {
              return {
                ...base,
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                borderRadius: 0,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                cursor: isDragging ? 'grabbing' : 'default',
                zIndex: 1200,
                pointerEvents: 'auto',
              };
            }

            const { width, height } = getCollapsedSize();
            const { width: viewportWidth, height: viewportHeight } =
              getViewport();
            const clampedX = Math.max(
              16,
              Math.min(position.x, viewportWidth - width - 16)
            );
            const clampedY = Math.max(
              16,
              Math.min(position.y, viewportHeight - height - 16)
            );

            return {
              ...base,
              position: 'fixed',
              left: clampedX,
              top: clampedY,
              width,
              height,
              margin: 0,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease',
              cursor: isDragging ? 'grabbing' : 'default',
              zIndex: 1200,
            };
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
                  onClick={handleCloseDialog}
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
            {paperInfo ? (
              <PaperInfoView
                item={paperInfo}
                orkgResourceUri={orkgResourceUri}
                onClose={() => setPaperInfo(null)}
              />
            ) : currentQuery && currentData ? (
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

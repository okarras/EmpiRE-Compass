import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TemplateQuestionaire from './TemplateQuestionaire';
import empiricalResearchTemplate from '../templates/empirical_research_questionaire.json';
import { useLocation } from 'react-router-dom';
import PdfViewer from './PdfViewer';

type ViewerState = {
  pdfUrl?: string | null;
  filename?: string;
  template?: string;
};

const MIN_LEFT_PX = 240;
const MIN_RIGHT_PX = 300;

const ContributeViewer: React.FC = () => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('md'));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const location = useLocation();
  const locState = (location.state || {}) as ViewerState;
  const [templateSpec, setTemplateSpec] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // layout
  const [leftWidthPx, setLeftWidthPx] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const rightCmdRef = useRef<{ goToPage?: (p: number) => void } | null>(null);
  const pdfUrl = locState.pdfUrl ?? localPdfUrl ?? null;

  useEffect(() => {
    setTemplateSpec(empiricalResearchTemplate);
  }, []);

  useEffect(() => {
    const calcInitial = () => {
      const root = containerRef.current;
      if (!root) return;
      const total = root.clientWidth;
      const defaultPx = isSm
        ? Math.max(MIN_LEFT_PX, total)
        : Math.max(MIN_LEFT_PX, Math.round(total * 0.4));
      setLeftWidthPx(defaultPx);
    };
    calcInitial();
    window.addEventListener('resize', calcInitial);
    return () => window.removeEventListener('resize', calcInitial);
  }, [isSm]);

  useEffect(() => {
    const calcWidth = () => {
      const el = rightRef.current;
      if (!el) return;
      setPageWidth(Math.max(300, el.clientWidth - 32));
    };
    calcWidth();
    window.addEventListener('resize', calcWidth);
    return () => window.removeEventListener('resize', calcWidth);
  }, [leftWidthPx]);

  // dragging logic
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const root = containerRef.current;
      if (!root) return;
      const clientX =
        e instanceof TouchEvent
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
      const rect = root.getBoundingClientRect();
      const newLeft = clientX - rect.left;
      const total = rect.width;
      const minLeft = MIN_LEFT_PX;
      const maxLeft = Math.max(total - MIN_RIGHT_PX, minLeft + 50);
      const clamped = Math.max(minLeft, Math.min(newLeft, maxLeft));
      setLeftWidthPx(clamped);
      const el = rightRef.current;
      if (el) setPageWidth(Math.max(300, el.clientWidth - 32));
      e.preventDefault();
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, []);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const leftStyle =
    leftWidthPx != null
      ? { width: `${leftWidthPx}px`, minWidth: `${MIN_LEFT_PX}px` }
      : { width: { xs: '100%', md: '45%' } };

  // function LeftPanel can call to instruct RightViewer
  const handleGoToPage = (pageNum: number) => {
    if (rightCmdRef.current?.goToPage) rightCmdRef.current.goToPage(pageNum);
  };

  return (
    <Paper
      ref={containerRef}
      elevation={1}
      square
      sx={{
        display: 'flex',
        gap: 2,
        height: 'calc(100vh - 65px)',
        p: 2,
        minHeight: 0,
        flexDirection: 'row',
      }}
    >
      {/* Left pane */}
      <Box
        sx={{
          ...leftStyle,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'auto',
          pr: { xs: 0, md: 1 },
          minHeight: 0,
        }}
      >
        <TemplateQuestionaire
          templateSpec={templateSpec}
          answers={answers}
          setAnswers={setAnswers}
        />
      </Box>

      {/* Drag handle with full vertical divider */}
      <Box
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        sx={{
          width: 10,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'col-resize',
          position: 'relative',
          zIndex: 30,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            transform: 'translateX(-50%)',
          },
          '&:hover::before': {
            backgroundColor: 'rgba(0,0,0,0.4)',
          },
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 48,
            borderRadius: 2,
            backgroundColor: 'rgba(0,0,0,0.75)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 0.5,
            transition: 'transform 0.2s ease, background-color 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.9)',
              transform: 'scale(1.05)',
            },
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 14, color: 'white' }} />
          <ChevronRightIcon sx={{ fontSize: 14, color: 'white' }} />
        </Box>
      </Box>

      {/* Right pane */}
      <Box
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <PdfViewer
          refContainer={rightRef}
          pdfUrl={pdfUrl}
          pageWidth={pageWidth}
          registerCommands={(cmds) => {
            rightCmdRef.current = cmds;
          }}
        />
      </Box>
    </Paper>
  );
};

export default ContributeViewer;

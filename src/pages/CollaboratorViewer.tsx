import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Paper,
  Typography,
  useTheme,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLocation } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type ViewerState = {
  pdfUrl?: string | null;
  filename?: string;
  template?: string;
};

const MIN_LEFT_PX = 240; // min width for left column
const MIN_RIGHT_PX = 300; // min width for right column (pdf)

const CollaboratorViewer: React.FC = () => {
  const location = useLocation();
  const themeMUI = useTheme();
  const isSm = useMediaQuery(themeMUI.breakpoints.down('md'));
  const state = (location.state || {}) as ViewerState;
  const pdfUrl = state.pdfUrl ?? null;
  const template = state.template ?? 'R186491';

  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageWidth, setPageWidth] = useState<number | null>(null);

  const containerOuterRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const [leftWidthPx, setLeftWidthPx] = useState<number | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const calcInitial = () => {
      const root = containerOuterRef.current;
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
      const width = Math.max(300, el.clientWidth - 32);
      setPageWidth(width);
    };
    calcWidth();
    window.addEventListener('resize', calcWidth);
    return () => window.removeEventListener('resize', calcWidth);
  }, [leftWidthPx, pdfUrl]);

  useEffect(() => {
    setNumPages(null);
    setLoading(false);
  }, [pdfUrl]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const root = containerOuterRef.current;
      if (!root) return;
      let clientX: number;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = (e as MouseEvent).clientX;
      }
      const rect = root.getBoundingClientRect();
      const newLeft = clientX - rect.left;
      const total = rect.width;
      const minLeft = MIN_LEFT_PX;
      const maxLeft = Math.max(total - MIN_RIGHT_PX, minLeft + 50);
      const clamped = Math.max(minLeft, Math.min(newLeft, maxLeft));
      setLeftWidthPx(clamped);
      const rightEl = rightRef.current;
      if (rightEl) {
        setPageWidth(Math.max(300, rightEl.clientWidth - 32));
      }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (leftWidthPx == null) return;
    const root = containerOuterRef.current;
    if (!root) return;
    const step = 16; // px
    if (e.key === 'ArrowLeft') {
      const newLeft = Math.max(MIN_LEFT_PX, leftWidthPx - step);
      setLeftWidthPx(newLeft);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      const total = root.clientWidth;
      const maxLeft = Math.max(total - MIN_RIGHT_PX, MIN_LEFT_PX + 50);
      const newLeft = Math.min(maxLeft, leftWidthPx + step);
      setLeftWidthPx(newLeft);
      e.preventDefault();
    }
  };

  const leftStyle =
    leftWidthPx != null
      ? { width: `${leftWidthPx}px`, minWidth: `${MIN_LEFT_PX}px` }
      : { width: { xs: '100%', md: '45%' } };

  return (
    <Paper
      elevation={1}
      square
      ref={containerOuterRef}
      sx={{
        display: 'flex',
        gap: 2,
        height: 'calc(100vh - 65px)',
        p: 2,
        minHeight: 0,
        flexDirection: 'row',
      }}
    >
      {/* Left column */}
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
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: themeMUI.palette.primary.main }}>
              <UploadFileIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Template & Questions
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Using: {template}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            1. Main contribution
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Describe the main contribution of the paper.
          </Typography>
          <Button size="small" variant="contained" sx={{ mt: 2 }}>
            Ask LLM
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            2. Datasets used
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            List datasets used by the authors.
          </Typography>
          <Button size="small" variant="contained" sx={{ mt: 2 }}>
            Ask LLM
          </Button>
        </Paper>

        <Box sx={{ flexGrow: 1 }} />
      </Box>

      {/* Draggable handle */}
      <Box
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onKeyDown={handleKeyDown}
        sx={{
          width: 20,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'col-resize',
          position: 'relative',
          zIndex: 30,
          background:
            'linear-gradient(to right, transparent 45%, rgba(0,0,0,0.12) 50%, transparent 55%)',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            background:
              'linear-gradient(to right, transparent 40%, rgba(0,0,0,0.3) 50%, transparent 60%)',
          },
          '&:focus': {
            outline: `2px solid ${themeMUI.palette.primary.light}`,
            outlineOffset: 2,
          },
          // center the floating pill
          '& .handlePill': {
            width: 8,
            height: 48,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.75)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            paddingTop: 2,
            paddingBottom: 2,
          },
          '&:hover .handlePill': {
            backgroundColor: 'rgba(0,0,0,0.9)',
            transform: 'translateY(-1px)',
          },
          ':focus': {
            outline: `2px solid ${themeMUI.palette.primary.light}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          className="handlePill"
          sx={{ color: 'common.white', opacity: 0.95 }}
        >
          <ChevronLeftIcon fontSize="small" sx={{ fontSize: 14 }} />
          <ChevronRightIcon fontSize="small" sx={{ fontSize: 14 }} />
        </Box>
      </Box>

      {/* Right: PDF viewer */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {!pdfUrl ? (
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              minHeight: 0,
            }}
          >
            <Typography color="text.secondary">
              No PDF available. Upload one from the Collaborate page.
            </Typography>
          </Paper>
        ) : (
          <Box
            ref={rightRef}
            sx={{
              flex: 1,
              height: '100%',
              overflow: 'auto',
              position: 'relative',
              minHeight: 0,
            }}
          >
            {loading && (
              <Box
                sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
              >
                <CircularProgress size={28} />
              </Box>
            )}

            <Document
              file={pdfUrl}
              onLoadSuccess={(pdf: PDFDocumentProxy) => {
                setNumPages(pdf.numPages);
                setLoading(false);
              }}
              onLoadError={(err) => {
                console.error('PDF load error:', err);
                setLoading(false);
              }}
              onLoadProgress={() => setLoading(true)}
            >
              {numPages &&
                pageWidth &&
                Array.from({ length: numPages }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <Box
                      key={`page_wrapper_${pageNumber}`}
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        position: 'relative',
                      }}
                    >
                      <Page
                        key={`page_${pageNumber}`}
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={true}
                      />
                    </Box>
                  );
                })}
            </Document>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default CollaboratorViewer;

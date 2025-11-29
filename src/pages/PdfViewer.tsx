import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowUp,
  KeyboardArrowDown,
  Remove,
  Add,
} from '@mui/icons-material';
import { Document, Page } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { pdfTextExtractor } from '../utils/pdf';

type Props = {
  refContainer: React.RefObject<HTMLDivElement>;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  registerCommands?: (cmds: { goToPage: (p: number) => void }) => void;
  onTextExtracted?: (text: string) => void;
  onExtractionError?: (error: Error) => void;
  highlights?: Record<number, Rect[]>;
};

type Rect = { left: number; top: number; width: number; height: number };

const PdfViewer: React.FC<Props> = ({
  refContainer,
  pdfUrl,
  pageWidth,
  registerCommands,
  onTextExtracted,
  onExtractionError,
  highlights: externalHighlights,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pageInputValue, setPageInputValue] = useState('1');
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scale = zoom / 100;

  const goToPage = (p: number) => {
    if (!numPages || p < 1 || p > numPages) return;
    setCurrentPage(p);
    setPageInputValue(String(p));
    const el = pageRefs.current[p];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum)) goToPage(pageNum);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  useEffect(() => {
    if (!numPages || !refContainer.current) return;

    const container = refContainer.current;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestPage = 1;
      let closestDistance = Infinity;

      Object.entries(pageRefs.current).forEach(([pageNum, el]) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const pageCenter = rect.top + rect.height / 2;
        const distance = Math.abs(pageCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = parseInt(pageNum, 10);
        }
      });

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
        setPageInputValue(String(closestPage));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages, currentPage, refContainer]);

  useEffect(() => {
    if (registerCommands) {
      registerCommands({ goToPage });
    }
  }, [registerCommands, numPages]);

  useEffect(() => {
    setNumPages(null);
    setLoading(false);
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfUrl || !onTextExtracted) return;
    let cancelled = false;
    (async () => {
      try {
        const text = await pdfTextExtractor.extractFullText(pdfUrl);
        if (!cancelled && onTextExtracted) onTextExtracted(text);
      } catch (err) {
        if (!cancelled && onExtractionError) {
          onExtractionError(
            err instanceof Error ? err : new Error('Failed to extract PDF text')
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, onTextExtracted, onExtractionError]);

  if (!pdfUrl) {
    return (
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Typography color="text.secondary">No PDF available.</Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Toolbar */}
      {numPages && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: 0.5,
            px: 1,
            minHeight: 32,
          }}
        >
          {/* Page Navigation */}
          <Tooltip title="Previous Page">
            <span>
              <IconButton
                size="small"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                sx={{ p: 0.25 }}
              >
                <KeyboardArrowUp fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next Page">
            <span>
              <IconButton
                size="small"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= (numPages || 1)}
                sx={{ p: 0.25 }}
              >
                <KeyboardArrowDown fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Box
            component="form"
            onSubmit={handlePageInputSubmit}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <TextField
              size="small"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              slotProps={{
                htmlInput: {
                  style: { textAlign: 'center', padding: '2px 4px', width: 30 },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { backgroundColor: 'transparent' },
              }}
            />
            <Typography variant="body2" color="text.secondary">
              / {numPages}
            </Typography>
          </Box>

          <Tooltip title="Zoom Out">
            <span>
              <IconButton
                size="small"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                sx={{ p: 0.25 }}
              >
                <Remove fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Zoom In">
            <span>
              <IconButton
                size="small"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                sx={{ p: 0.25 }}
              >
                <Add fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: 40, textAlign: 'center' }}
          >
            {zoom}%
          </Typography>
        </Box>
      )}

      {/* PDF Container */}
      <Box
        ref={refContainer}
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {loading && (
          <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={(pdf: PDFDocumentProxy) => {
            setNumPages(pdf.numPages);
            setLoading(false);
          }}
          onLoadError={() => setLoading(false)}
          onLoadProgress={() => setLoading(true)}
        >
          {numPages &&
            pageWidth &&
            Array.from({ length: numPages }, (_, i) => {
              const pageNumber = i + 1;
              const estimatedPageHeight = pageWidth * 1.414;
              const scaledHeight = estimatedPageHeight * scale;
              const extraHeight = scaledHeight - estimatedPageHeight;

              return (
                <Box
                  key={pageNumber}
                  data-page={pageNumber}
                  ref={(el) => {
                    pageRefs.current[pageNumber] = el as HTMLDivElement | null;
                  }}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: 1,
                    position: 'relative',
                    mb: extraHeight > 0 ? `${extraHeight}px` : 0,
                  }}
                >
                  <Box
                    sx={{
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      position: 'relative',
                    }}
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={pageWidth}
                      renderTextLayer
                      renderAnnotationLayer
                    />
                    {/* Highlights */}
                    {externalHighlights?.[pageNumber]?.map((r, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          position: 'absolute',
                          left: r.left - 16,
                          top: r.top,
                          width: r.width,
                          height: r.height,
                          bgcolor: 'rgba(255,235,59,0.45)',
                          borderRadius: '2px',
                          pointerEvents: 'none',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
        </Document>
      </Box>
    </Box>
  );
};

export default PdfViewer;

import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Paper,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type ViewerState = {
  pdfUrl?: string | null;
  filename?: string;
  template?: string;
};

const CollaboratorViewer: React.FC = () => {
  const location = useLocation();
  const themeMUI = useTheme();
  const state = (location.state || {}) as ViewerState;
  const pdfUrl = state.pdfUrl ?? null;
  const template = state.template ?? 'R186491';

  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const calcWidth = () => {
      const el = containerRef.current;
      if (!el) return;
      const width = Math.max(300, el.clientWidth - 32);
      setPageWidth(width);
    };
    calcWidth();
    window.addEventListener('resize', calcWidth);
    return () => window.removeEventListener('resize', calcWidth);
  }, []);

  // reset when pdf changes
  useEffect(() => {
    setNumPages(null);
    setLoading(false);
  }, [pdfUrl]);

  return (
    <Paper
      elevation={1}
      square
      sx={{
        display: 'flex',
        gap: 2,
        height: '100%',
        p: 2,
      }}
    >
      {/* Left column (unchanged) */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'auto',
          pr: { xs: 0, md: 1 },
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

      {/* Right: PDF viewer */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
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
            }}
          >
            <Typography color="text.secondary">
              No PDF available. Upload one from the Collaborate page.
            </Typography>
          </Paper>
        ) : (
          // Container ref must be the element used to compute page width
          <Box
            ref={containerRef}
            sx={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              position: 'relative',
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

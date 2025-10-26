import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { Document, Page } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { findMatchesInDocument } from './PdfHighlights';

type Props = {
  refContainer: React.RefObject<HTMLDivElement>;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  registerCommands?: (cmds: { goToPage: (p: number) => void }) => void;
};

type Rect = { left: number; top: number; width: number; height: number };

const PdfViewer: React.FC<Props> = ({
  refContainer,
  pdfUrl,
  pageWidth,
  registerCommands,
}) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [pdfDoc, setPdfDoc] = React.useState<PDFDocumentProxy | null>(null);
  const [highlights, setHighlights] = React.useState<Record<number, Rect[]>>(
    {}
  );

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (registerCommands) {
      registerCommands({
        goToPage: (p: number) => {
          const el = pageRefs.current[p];
          if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('pdf-highlight-flash');
            setTimeout(() => el.classList.remove('pdf-highlight-flash'), 800);
          }
        },
      });
    }
  }, [registerCommands]);

  useEffect(() => {
    setNumPages(null);
    setLoading(false);
    setPdfDoc(null);
    setHighlights({});
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfDoc || !pageWidth) return;

    let cancelled = false;

    (async () => {
      try {
        const map = await findMatchesInDocument(pdfDoc, pageWidth, 'UGEN-V', {
          caseInsensitive: true,
        });

        if (!cancelled) {
          setHighlights(map);
        }
      } catch (err) {
        console.error('Error generating highlights', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageWidth]);

  useEffect(() => {
    const styleId = 'pdf-highlight-flash-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .pdf-highlight-flash {
        animation: pdfFlash 0.8s ease-in-out;
      }
      @keyframes pdfFlash {
        0% { box-shadow: 0 0 0 4px rgba(255,235,59,0.0); }
        30% { box-shadow: 0 0 8px 8px rgba(255,235,59,0.45); }
        100% { box-shadow: none; }
      }
    `;
    document.head.appendChild(style);
  }, []);

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
        <Typography color="text.secondary">
          No PDF available. Upload one elsewhere.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      ref={refContainer}
      sx={{ flex: 1, height: '100%', overflow: 'auto', position: 'relative' }}
    >
      {loading && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      <Document
        file={pdfUrl}
        onLoadSuccess={(pdf: PDFDocumentProxy) => {
          setNumPages(pdf.numPages);
          setPdfDoc(pdf);
          setLoading(false);
        }}
        onLoadError={(err) => {
          console.error('PDF load error', err);
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
                ref={(el) => {
                  pageRefs.current[pageNumber] = el as HTMLDivElement | null;
                }}
                data-page={pageNumber}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                  position: 'relative',
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />

                {/* Highlight overlays for this page */}
                {/* {(highlights[pageNumber] || []).map((r, idx) => (
                  <Box
                    key={`hl_${pageNumber}_${idx}`}
                    sx={{
                      position: 'absolute',
                      left: r.left,
                      top: r.top,
                      width: r.width,
                      height: r.height,
                      pointerEvents: 'none',
                      bgcolor: 'rgba(255,235,59,0.45)', // translucent yellow
                      borderRadius: '2px',
                      mixBlendMode: 'multiply',
                    }}
                  />
                ))} */}
              </Box>
            );
          })}
      </Document>
    </Box>
  );
};

export default PdfViewer;

import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
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
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (registerCommands) {
      registerCommands({
        goToPage: (p: number) => {
          if (!numPages || p < 1 || p > numPages) {
            console.warn(
              `Invalid page number: ${p}. Valid range is 1-${numPages || 'unknown'}`
            );
            return;
          }

          const el = pageRefs.current[p];
          if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('pdf-highlight-flash');
            setTimeout(() => el.classList.remove('pdf-highlight-flash'), 800);
          }
        },
      });
    }
  }, [registerCommands, numPages]);

  useEffect(() => {
    setNumPages(null);
    setLoading(false);
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdfUrl || !onTextExtracted) {
      console.log(
        '[PdfViewer] Skipping extraction - missing pdfUrl or onTextExtracted callback',
        { pdfUrl: !!pdfUrl, onTextExtracted: !!onTextExtracted }
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const extractedText = await pdfTextExtractor.extractFullText(pdfUrl);

        if (!cancelled && onTextExtracted) {
          onTextExtracted(extractedText);
        }
      } catch (err) {
        console.error('[PdfViewer] Error extracting PDF text:', err);
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
                {externalHighlights &&
                  (externalHighlights[pageNumber] || []).map((r, idx) => (
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
                  ))}
              </Box>
            );
          })}
      </Document>
    </Box>
  );
};

export default PdfViewer;

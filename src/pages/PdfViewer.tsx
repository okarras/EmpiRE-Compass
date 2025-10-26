import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { Document, Page } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

type Props = {
  refContainer: React.RefObject<HTMLDivElement>;
  pdfUrl?: string | null;
  pageWidth?: number | null;
  registerCommands?: (cmds: { goToPage: (p: number) => void }) => void;
};
const PdfViewer: React.FC<Props> = ({
  refContainer,
  pdfUrl,
  pageWidth,
  registerCommands,
}) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
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
  }, [pdfUrl]);

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
                  renderTextLayer={false}
                  renderAnnotationLayer={true}
                />
              </Box>
            );
          })}
      </Document>
    </Box>
  );
};

export default PdfViewer;

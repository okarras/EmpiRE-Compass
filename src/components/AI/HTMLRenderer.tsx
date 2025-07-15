import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import DOMPurify from 'dompurify';

interface HTMLRendererProps {
  html: string;
  title?: string;
  type?: 'chart' | 'description' | 'interpretation';
  onHistoryClick?: React.ReactNode;
  useIframe?: boolean;
}

const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  html,
  title,
  type = 'description',
  onHistoryClick,
  useIframe = false,
}) => {
  // Sanitize HTML content
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'div',
      'span',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'blockquote',
      'code',
      'pre',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'img',
      'canvas',
      'svg',
      'g',
      'path',
      'circle',
      'rect',
      'line',
      'text',
      'script', // Allow scripts for charts
    ],
    ALLOWED_ATTR: [
      'class',
      'id',
      'style',
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'width',
      'height',
      'data-*',
      'aria-*',
      'viewBox',
      'xmlns',
      'd',
      'fill',
      'stroke',
      'stroke-width',
      'x',
      'y',
      'cx',
      'cy',
      'r',
      'x1',
      'y1',
      'x2',
      'y2',
      'type', // For script tags
    ],
    ALLOW_DATA_ATTR: true,
    ADD_TAGS: ['canvas', 'svg'],
    ADD_ATTR: ['target', 'onclick'], // Be careful with onclick
  });
  console.log('sanitizedHtml', sanitizedHtml);

  const renderContent = () => {
    if (useIframe || type === 'chart') {
      // For chart HTML, render in an iframe for better isolation
      return (
        <Box
          sx={{
            width: '100%',
            height: '500px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
        >
          <iframe
            srcDoc={html}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'transparent',
            }}
            title={title || 'AI Generated Chart'}
            sandbox="allow-scripts allow-same-origin"
            scrolling="no"
          />
        </Box>
      );
    } else {
      // For descriptions and interpretations, render directly
      return (
        <Box
          sx={{
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: '#e86161',
              fontWeight: 600,
              marginBottom: 1,
              marginTop: 2,
            },
            '& h1': { fontSize: '1.5rem' },
            '& h2': { fontSize: '1.3rem' },
            '& h3': { fontSize: '1.1rem' },
            '& p': {
              marginBottom: 1.5,
              lineHeight: 1.6,
            },
            '& ul, & ol': {
              marginBottom: 1.5,
              paddingLeft: 2,
            },
            '& li': {
              marginBottom: 0.5,
            },
            '& strong, & b': {
              fontWeight: 600,
            },
            '& em, & i': {
              fontStyle: 'italic',
            },
            '& blockquote': {
              borderLeft: '4px solid #e86161',
              paddingLeft: 2,
              marginLeft: 0,
              marginRight: 0,
              marginBottom: 1.5,
              fontStyle: 'italic',
              backgroundColor: 'rgba(232, 97, 97, 0.02)',
              padding: 1,
              borderRadius: 1,
            },
            '& code': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '2px 4px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& pre': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: 1.5,
            },
            '& th, & td': {
              border: '1px solid rgba(0, 0, 0, 0.1)',
              padding: 1,
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: 'rgba(232, 97, 97, 0.1)',
              fontWeight: 600,
            },
            '& a': {
              color: '#e86161',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      );
    }
  };

  if (!html) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        backgroundColor:
          type === 'chart' ? 'transparent' : 'rgba(232, 97, 97, 0.02)',
        border: type === 'chart' ? 'none' : '1px solid rgba(232, 97, 97, 0.1)',
        borderRadius: type === 'chart' ? 0 : 2,
      }}
    >
      {title && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#e86161', fontWeight: 600 }}>
            {title}
          </Typography>
          {onHistoryClick && <Box sx={{ ml: 'auto' }}>{onHistoryClick}</Box>}
        </Box>
      )}
      {renderContent()}
    </Paper>
  );
};

export default HTMLRenderer;

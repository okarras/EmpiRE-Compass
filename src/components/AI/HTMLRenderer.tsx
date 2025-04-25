import { Box } from '@mui/material';

interface HTMLRendererProps {
  content: string;
}

const HTMLRenderer: React.FC<HTMLRendererProps> = ({ content }) => {
  return (
    <Box
      sx={{
        '& h1': {
          color: '#e86161',
          fontWeight: 700,
          marginBottom: 2,
          marginTop: 2,
          fontSize: { xs: '1.5rem', sm: '1.75rem' },
        },
        '& h2': {
          color: '#e86161',
          fontWeight: 600,
          marginBottom: 2,
          marginTop: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        },
        '& h3': {
          color: '#e86161',
          fontWeight: 600,
          marginBottom: 1.5,
          marginTop: 1.5,
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
        },
        '& p': {
          marginBottom: 1.5,
          marginTop: 1.5,
          lineHeight: 1.7,
          fontSize: '0.95rem',
        },
        '& ul, & ol': {
          marginBottom: 1.5,
          marginTop: 1.5,
          paddingLeft: 3,
          '& li': {
            marginBottom: 1,
          },
        },
        '& code': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: '2px 4px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.9em',
        },
        '& pre': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
          marginBottom: 2,
          marginTop: 2,
          '& code': {
            backgroundColor: 'transparent',
            padding: 0,
          },
        },
        '& blockquote': {
          borderLeft: '4px solid #e86161',
          backgroundColor: 'rgba(232, 97, 97, 0.05)',
          margin: '16px 0',
          padding: 2,
          fontStyle: 'italic',
          color: 'text.secondary',
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 2,
          marginTop: 2,
          '& th, & td': {
            border: '1px solid rgba(0, 0, 0, 0.1)',
            padding: 1,
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: 'rgba(232, 97, 97, 0.05)',
            fontWeight: 600,
          },
        },
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default HTMLRenderer; 
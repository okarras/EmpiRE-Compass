import React from 'react';
import { Box } from '@mui/material';

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ content, isUser }) => {
  return (
    <Box
      sx={{
        '& p': {
          margin: '0.5rem 0',
          lineHeight: 1.5,
        },
        '& ul, & ol': {
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
          paddingLeft: '1.5rem',
        },
        '& li': {
          marginBottom: '0.25rem',
        },
        '& a': {
          color: isUser ? 'white' : 'primary.main',
          textDecoration: 'underline',
          '&:hover': {
            textDecoration: 'none',
          },
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          margin: '0.5rem 0',
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'divider',
          margin: '1rem 0',
          padding: '0.5rem 0 0.5rem 1rem',
          fontStyle: 'italic',
        },
        '& code': {
          fontFamily: 'monospace',
          backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          padding: '0.2rem 0.4rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '1rem',
          '& th, & td': {
            border: '1px solid',
            borderColor: isUser ? 'rgba(255, 255, 255, 0.2)' : 'divider',
            padding: '0.5rem',
            textAlign: 'left',
          },
          '& th': {
            backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          },
        },
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default MessageContent; 
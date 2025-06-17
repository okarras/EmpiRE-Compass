import React from 'react';
import { Box, Typography } from '@mui/material';

interface ReasoningSectionProps {
  reasoning: string;
  isUser: boolean;
}

const ReasoningSection: React.FC<ReasoningSectionProps> = ({ reasoning, isUser }) => {
  return (
    <Box
      sx={{
        mt: 2,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        AI Reasoning:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
          mt: 1,
        }}
      >
        {reasoning}
      </Typography>
    </Box>
  );
};

export default ReasoningSection; 
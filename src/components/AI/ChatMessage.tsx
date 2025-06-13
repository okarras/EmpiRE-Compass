import { Box, Avatar, Paper } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import HTMLRenderer from './HTMLRenderer';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  reasoning?: string;
  showReasoning?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  isUser,
  reasoning,
  showReasoning = true,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          maxWidth: '80%',
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? 'primary.main' : '#e86161',
            width: 32,
            height: 32,
          }}
        >
          {isUser ? <PersonIcon /> : <SmartToyIcon />}
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {reasoning && !isUser && showReasoning && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'rgba(232, 97, 97, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(232, 97, 97, 0.1)',
                fontSize: '0.875rem',
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              <strong>Reasoning:</strong> {reasoning}
            </Paper>
          )}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: isUser ? 'primary.main' : 'background.paper',
              color: isUser ? 'white' : 'text.primary',
              borderRadius: 2,
              border: isUser ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <HTMLRenderer content={content} />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatMessage;

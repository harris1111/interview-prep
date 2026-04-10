import { Box, Typography, Paper, alpha } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { InterviewMessage } from '../../services/interview-service';
import { ScoreBadge } from './score-badge';

interface MessageBubbleProps {
  message: InterviewMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'USER';
  const isSystem = message.role === 'SYSTEM';

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontStyle: 'italic',
            color: 'text.secondary',
            bgcolor: alpha('#64748B', 0.06),
            px: 2.5,
            py: 1,
            borderRadius: 2,
            fontSize: '0.8125rem',
          }}
        >
          {message.content}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        sx={{
          maxWidth: '70%',
          px: 2.5,
          py: 1.5,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          border: isUser ? 'none' : '1px solid',
          borderColor: isUser ? 'transparent' : 'divider',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          >
            {isUser ? 'You' : 'Interviewer'}
          </Typography>
          {!isUser && message.score !== null && message.score !== undefined && (
            <ScoreBadge score={message.score} feedback={message.feedback} />
          )}
        </Box>

        {isUser ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {message.content}
          </Typography>
        ) : (
          <Box
            sx={{
              '& p': { my: 1 },
              '& p:first-of-type': { mt: 0 },
              '& p:last-of-type': { mb: 0 },
              '& ul, & ol': { my: 1, pl: 2 },
              '& code': {
                bgcolor: alpha('#64748B', 0.1),
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.85em',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              },
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        )}

        {isStreaming && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 8,
              height: 16,
              bgcolor: 'primary.main',
              ml: 0.5,
              borderRadius: 0.5,
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0 },
              },
            }}
          />
        )}

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            opacity: 0.5,
            fontSize: '0.675rem',
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
}

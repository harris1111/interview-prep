import { Box, Typography, Chip, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { InterviewMessage } from '../../services/interview-service';

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
            bgcolor: 'grey.50',
            px: 2,
            py: 1,
            borderRadius: 1,
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
        elevation={1}
        sx={{
          maxWidth: '70%',
          px: 2,
          py: 1.5,
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          position: 'relative',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 0.5,
            opacity: 0.8,
            fontWeight: 600,
          }}
        >
          {isUser ? 'You' : 'Interviewer'}
        </Typography>

        {isUser ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
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
                bgcolor: 'rgba(0,0,0,0.1)',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.9em',
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
              bgcolor: 'currentColor',
              ml: 0.5,
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0 },
              },
            }}
          />
        )}

        {message.answerScore !== null && (
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Chip
              label={`Score: ${message.answerScore}/10`}
              size="small"
              color={message.answerScore >= 7 ? 'success' : message.answerScore >= 5 ? 'warning' : 'error'}
              sx={{ mr: 1 }}
            />
            {message.feedback && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                {message.feedback}
              </Typography>
            )}
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            opacity: 0.6,
            fontSize: '0.7rem',
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
}

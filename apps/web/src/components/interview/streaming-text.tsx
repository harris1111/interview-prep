import ReactMarkdown from 'react-markdown';
import { Box } from '@mui/material';

interface StreamingTextProps {
  content: string;
  showCursor?: boolean;
}

export function StreamingText({ content, showCursor = true }: StreamingTextProps) {
  return (
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
      <ReactMarkdown>{content}</ReactMarkdown>
      {showCursor && (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: 8,
            height: 16,
            bgcolor: 'text.primary',
            ml: 0.5,
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0 },
            },
          }}
        />
      )}
    </Box>
  );
}

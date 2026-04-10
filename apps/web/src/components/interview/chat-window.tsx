import { useEffect, useRef } from 'react';
import { Paper } from '@mui/material';
import { MessageBubble } from './message-bubble';
import { InterviewMessage } from '../../services/interview-service';

interface ChatWindowProps {
  messages: InterviewMessage[];
  streamedContent?: string;
  isStreaming?: boolean;
}

export function ChatWindow({ messages, streamedContent, isStreaming }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent]);

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 3,
        bgcolor: 'background.default',
        borderRadius: 2,
      }}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isStreaming && streamedContent && (
        <MessageBubble
          message={{
            id: 'streaming',
            sessionId: '',
            roundNumber: 0,
            role: 'ASSISTANT',
            content: streamedContent,
            answerScore: null,
            feedback: null,
            createdAt: new Date().toISOString(),
          }}
          isStreaming
        />
      )}

      <div ref={messagesEndRef} />
    </Paper>
  );
}

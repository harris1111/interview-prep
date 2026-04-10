import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
} from '@mui/material';
import { Send, Cancel } from '@mui/icons-material';
import { interviewService, InterviewSession, InterviewMessage } from '../../services/interview-service';
import { useLlmStream } from '../../hooks/use-llm-stream';
import { ChatWindow } from '../../components/interview/chat-window';
import { RoundSidebar } from '../../components/interview/round-sidebar';

export function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryDialog, setSummaryDialog] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null,
  });

  const { isStreaming, streamedContent, startStream, cancelStream, resetStream } = useLlmStream();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  useEffect(() => {
    if (session) {
      const activeRound = session.rounds?.find((r) => r.status === 'IN_PROGRESS');
      if (activeRound) {
        setCurrentRound(activeRound.roundNumber);
        loadMessages(activeRound.roundNumber);
      }
    }
  }, [session]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await interviewService.getSession(id!);
      setSession(data);

      if (data.status === 'COMPLETED') {
        navigate(`/interview/${id}/review`);
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roundNumber: number) => {
    try {
      const msgs = await interviewService.getMessages(id!, roundNumber);
      setMessages(msgs);
    } catch (err: any) {
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || sending || isStreaming || !session) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);
    resetStream();

    const tempUserMsg: InterviewMessage = {
      id: `temp-${Date.now()}`,
      roundId: '',
      role: 'USER',
      content: userMessage,
      score: null,
      feedback: null,
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      await startStream(session.id, currentRound, userMessage);
      await loadMessages(currentRound);
      await loadSession();
    } catch (err: any) {
      setError('Failed to send message');
    } finally {
      setSending(false);
      resetStream();
    }
  };

  const handleCompleteRound = async () => {
    if (!session) return;

    try {
      setCompleting(true);
      const roundData = await interviewService.completeRound(session.id, currentRound);
      
      setSummaryDialog({
        open: true,
        data: roundData,
      });

      await loadSession();
    } catch (err: any) {
      setError('Failed to complete round');
    } finally {
      setCompleting(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!session) return;

    try {
      setCompleting(true);
      await interviewService.completeInterview(session.id);
      navigate(`/interview/${session.id}/review`);
    } catch (err: any) {
      setError('Failed to finish interview');
      setCompleting(false);
    }
  };

  const handleRoundSelect = useCallback((roundNumber: number) => {
    setCurrentRound(roundNumber);
    loadMessages(roundNumber);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  const handleCloseSummary = () => {
    setSummaryDialog({ open: false, data: null });
    
    const nextRound = session?.rounds?.find((r) => r.status === 'PENDING');
    if (nextRound) {
      handleRoundSelect(nextRound.roundNumber);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Session not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <RoundSidebar
        rounds={session.rounds || []}
        activeRoundNumber={currentRound}
        onRoundSelect={handleRoundSelect}
        onCompleteRound={handleCompleteRound}
        onFinishInterview={handleFinishInterview}
        isCompleting={completing}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ChatWindow
          messages={messages}
          streamedContent={streamedContent}
          isStreaming={isStreaming}
        />

        <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your response... (Ctrl+Enter to send)"
              disabled={isStreaming || sending}
              inputRef={inputRef}
            />
            
            {isStreaming ? (
              <IconButton color="error" onClick={cancelStream}>
                <Cancel />
              </IconButton>
            ) : (
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!input.trim() || sending}
              >
                {sending ? <CircularProgress size={24} /> : <Send />}
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {isStreaming ? 'Processing...' : sending ? 'Sending...' : 'Press Ctrl+Enter to send'}
          </Typography>
        </Box>
      </Box>

      <Dialog open={summaryDialog.open} onClose={handleCloseSummary} maxWidth="sm" fullWidth>
        <DialogTitle>Round Completed</DialogTitle>
        <DialogContent>
          {summaryDialog.data && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Score: {summaryDialog.data.score}/10
              </Typography>
              
              {summaryDialog.data.observations && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Observations:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {summaryDialog.data.observations}
                  </Typography>
                </Box>
              )}

              {summaryDialog.data.recommendations && summaryDialog.data.recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  {summaryDialog.data.recommendations.map((rec: string, idx: number) => (
                    <Chip key={idx} label={rec} size="small" sx={{ m: 0.5 }} />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSummary} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

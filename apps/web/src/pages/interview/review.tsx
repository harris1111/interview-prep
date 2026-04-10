import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { interviewService, InterviewSession, InterviewMessage } from '../../services/interview-service';
import { MessageBubble } from '../../components/interview/message-bubble';
import { OverallSummary } from '../../components/interview/overall-summary';
import { RoundSummaryCard } from '../../components/interview/round-summary-card';

export function InterviewReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messagesMap, setMessagesMap] = useState<Map<number, InterviewMessage[]>>(new Map());
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReview();
    }
  }, [id]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const sessionData = await interviewService.getSession(id!);

      if (sessionData.status !== 'COMPLETED') {
        navigate(`/interview/${id}`);
        return;
      }

      setSession(sessionData);

      const msgMap = new Map<number, InterviewMessage[]>();
      if (sessionData.rounds) {
        for (const round of sessionData.rounds) {
          const msgs = await interviewService.getMessages(id!, round.roundNumber);
          msgMap.set(round.roundNumber, msgs);
        }
      }
      setMessagesMap(msgMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Session not found</Alert>
      </Container>
    );
  }

  const currentRound = session.rounds?.[activeTab];
  const currentMessages = currentRound ? messagesMap.get(currentRound.roundNumber) || [] : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/interview/history')} sx={{ mb: 2 }}>
        Back to History
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overall Summary */}
      {session.overallFeedback && (
        <OverallSummary
          overallScore={session.overallScore || 0}
          summary={(session.overallFeedback as any).summary || ''}
          strengths={(session.overallFeedback as any).strengths || []}
          weaknesses={(session.overallFeedback as any).weaknesses || []}
          readinessLevel={(session.overallFeedback as any).readinessLevel || 'needs_practice'}
          topRecommendations={(session.overallFeedback as any).topRecommendations || []}
        />
      )}

      {session.rounds && session.rounds.length > 0 && (
        <Card>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            {session.rounds.map((round) => (
              <Tab
                key={round.id}
                label={
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2">Round {round.roundNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {round.topicFocus}
                    </Typography>
                    {round.score !== null && (
                      <Chip label={`${round.score}/10`} size="small" sx={{ ml: 1, height: 18 }} />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>

          <CardContent>
            {currentRound && (
              <>
                {/* Round Summary Card */}
                {currentRound.feedback && (
                  <RoundSummaryCard
                    averageScore={(currentRound.feedback as any).averageScore || currentRound.score || 0}
                    summary={(currentRound.feedback as any).summary || ''}
                    strengths={(currentRound.feedback as any).strengths || []}
                    improvements={(currentRound.feedback as any).improvements || []}
                  />
                )}

                <Typography variant="h6" gutterBottom>
                  Round {currentRound.roundNumber}: {currentRound.topicFocus}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={`Score: ${currentRound.score}/10`} color="primary" />
                  <Chip label={currentRound.status} size="small" />
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              Conversation History
            </Typography>

            <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
              {currentMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

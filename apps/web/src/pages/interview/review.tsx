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
  Grid,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import { ArrowBack, EmojiEvents, TrendingUp, TrendingDown } from '@mui/icons-material';
import { interviewService, InterviewSession, InterviewMessage } from '../../services/interview-service';
import { MessageBubble } from '../../components/interview/message-bubble';

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

  const getReadinessColor = (level: string | null) => {
    switch (level) {
      case 'READY':
        return 'success';
      case 'ALMOST_READY':
        return 'warning';
      case 'NEEDS_IMPROVEMENT':
        return 'error';
      default:
        return 'default';
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                <EmojiEvents sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
                {session.scenario?.name || 'Interview Review'}
              </Typography>
              {session.scenario?.career && (
                <Chip label={session.scenario.career.name} color="primary" size="small" sx={{ mr: 1 }} />
              )}
              <Chip
                label={session.readinessLevel?.replace('_', ' ') || 'N/A'}
                color={getReadinessColor(session.readinessLevel) as any}
                size="small"
              />
            </Box>
            <Typography variant="h3" color="primary">
              {session.overallScore}/10
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {session.strengths && session.strengths.length > 0 && (
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ fontSize: 20, mr: 0.5, color: 'success.main' }} />
                    Strengths
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {session.strengths.map((strength, idx) => (
                      <Chip key={idx} label={strength} size="small" color="success" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {session.weaknesses && session.weaknesses.length > 0 && (
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ fontSize: 20, mr: 0.5, color: 'error.main' }} />
                    Areas for Improvement
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {session.weaknesses.map((weakness, idx) => (
                      <Chip key={idx} label={weakness} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {session.recommendations && session.recommendations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  {session.recommendations.map((rec, idx) => (
                    <Typography component="li" key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {rec}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

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
                      {round.roundName}
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
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Round {currentRound.roundNumber}: {currentRound.roundName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={`Score: ${currentRound.score}/10`} color="primary" />
                  <Chip label={currentRound.status} size="small" />
                </Box>

                {currentRound.observations && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Observations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentRound.observations}
                    </Typography>
                  </Paper>
                )}

                {currentRound.recommendations && currentRound.recommendations.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Round Recommendations
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {currentRound.recommendations.map((rec, idx) => (
                        <Chip key={idx} label={rec} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
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

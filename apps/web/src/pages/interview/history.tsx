import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, PlayArrow } from '@mui/icons-material';
import { interviewService, InterviewSession } from '../../services/interview-service';

export function InterviewHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await interviewService.getMySessions();
      setSessions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'ABANDONED':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleViewSession = (session: InterviewSession) => {
    if (session.status === 'COMPLETED') {
      navigate(`/interview/${session.id}/review`);
    } else if (session.status === 'IN_PROGRESS') {
      navigate(`/interview/${session.id}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Interview History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your past and ongoing interview sessions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} label="Filter by Status">
            <MenuItem value="all">All Sessions</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="ABANDONED">Abandoned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredSessions.map((session) => (
          <Grid item xs={12} md={6} key={session.id}>
            <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.light' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">
                    {session.scenario?.name || 'Interview Session'}
                  </Typography>
                  <Chip
                    label={session.status.replace('_', ' ')}
                    color={getStatusColor(session.status) as any}
                    size="small"
                  />
                </Box>

                {session.scenario?.career && (
                  <Chip label={session.scenario.career.name} size="small" color="primary" sx={{ mb: 1 }} />
                )}

                <Typography variant="body2" color="text.secondary" paragraph>
                  Started: {new Date(session.createdAt).toLocaleString()}
                </Typography>

                {session.status === 'COMPLETED' && session.overallScore !== null && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Overall Score: {session.overallScore}/10
                    </Typography>
                    {session.overallFeedback && (session.overallFeedback as any).readinessLevel && (
                      <Chip
                        label={(session.overallFeedback as any).readinessLevel}
                        size="small"
                        color={
                          (session.overallFeedback as any).readinessLevel === 'interview_ready'
                            ? 'success'
                            : (session.overallFeedback as any).readinessLevel === 'mostly_ready'
                            ? 'info'
                            : (session.overallFeedback as any).readinessLevel === 'needs_practice'
                            ? 'warning'
                            : 'error'
                        }
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                )}

                {session.status === 'IN_PROGRESS' && session.rounds && (
                  <Typography variant="body2" color="text.secondary">
                    Progress: {session.rounds.filter((r) => r.status === 'COMPLETED').length} / {session.rounds.length} rounds
                  </Typography>
                )}
              </CardContent>

              <CardActions>
                {session.status === 'COMPLETED' ? (
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewSession(session)}
                    fullWidth
                  >
                    View Review
                  </Button>
                ) : session.status === 'IN_PROGRESS' ? (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => handleViewSession(session)}
                    fullWidth
                  >
                    Continue
                  </Button>
                ) : null}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredSessions.length === 0 && !loading && (
        <Alert severity="info">
          {filter === 'all'
            ? 'No interview sessions yet. Start your first interview!'
            : `No ${filter.toLowerCase().replace('_', ' ')} sessions.`}
        </Alert>
      )}
    </Container>
  );
}

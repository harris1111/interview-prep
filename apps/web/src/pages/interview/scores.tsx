import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { interviewService, InterviewSession } from '../../services/interview-service';

export function InterviewScoresPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerFilter, setCareerFilter] = useState<string>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (careerFilter === 'all') {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(
        sessions.filter((s) => s.scenario?.career?.id === careerFilter)
      );
    }
  }, [careerFilter, sessions]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await interviewService.getMySessions();
      // Only show completed sessions with scores
      const completedSessions = data.filter(
        (s) => s.status === 'COMPLETED' && s.overallScore !== null
      );
      setSessions(completedSessions);
      setFilteredSessions(completedSessions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return 'grey';
    if (score >= 7) return 'success';
    if (score >= 4) return 'warning';
    return 'error';
  };

  const getReadinessColor = (level: string | null): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    if (!level) return 'default';
    switch (level) {
      case 'interview_ready':
        return 'success';
      case 'mostly_ready':
        return 'info';
      case 'needs_practice':
        return 'warning';
      case 'not_ready':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatReadinessLevel = (level: string | null): string => {
    if (!level) return 'N/A';
    return level
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const uniqueCareers = Array.from(
    new Set(sessions.map((s) => s.scenario?.career?.id).filter(Boolean))
  ).map((id) => {
    const session = sessions.find((s) => s.scenario?.career?.id === id);
    return {
      id: id!,
      name: session?.scenario?.career?.name || 'Unknown',
    };
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Interview Scores
        </Typography>

        {uniqueCareers.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Career</InputLabel>
            <Select
              value={careerFilter}
              label="Filter by Career"
              onChange={(e) => setCareerFilter(e.target.value)}
            >
              <MenuItem value="all">All Careers</MenuItem>
              {uniqueCareers.map((career) => (
                <MenuItem key={career.id} value={career.id}>
                  {career.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredSessions.length === 0 ? (
        <Alert severity="info">
          No completed interviews with scores yet. Complete an interview to see your scores here.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session) => {
            const overallFeedback = session.overallFeedback as any;
            const readinessLevel = overallFeedback?.readinessLevel || null;

            return (
              <Grid item xs={12} md={6} key={session.id}>
                <Card>
                  <CardActionArea onClick={() => navigate(`/interview/${session.id}/review`)}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {session.scenario?.name || 'Interview'}
                          </Typography>
                          <Chip
                            label={session.scenario?.career?.name || 'Unknown'}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={formatReadinessLevel(readinessLevel)}
                            color={getReadinessColor(readinessLevel)}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="h3"
                            color={`${getScoreColor(session.overallScore)}.main`}
                            sx={{ fontWeight: 700 }}
                          >
                            {session.overallScore?.toFixed(1) || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            / 10
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Completed: {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'N/A'}
                      </Typography>

                      {overallFeedback?.summary && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {overallFeedback.summary}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}

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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { PlayArrow, Psychology } from '@mui/icons-material';
import { interviewService, Scenario } from '../../services/interview-service';
import { cvService, CvAnalysis } from '../../services/cv-service';

export function InterviewStartPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [cvAnalyses, setCvAnalyses] = useState<CvAnalysis[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scenariosData, cvsData] = await Promise.all([
        interviewService.getScenarios(),
        cvService.getMyCvs(),
      ]);

      setScenarios(scenariosData);
      
      const completedAnalyses = cvsData
        .filter((cv) => cv.analysis?.status === 'COMPLETED')
        .map((cv) => cv.analysis!);
      setCvAnalyses(completedAnalyses);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (scenarioId: string) => {
    try {
      setStarting(true);
      const session = await interviewService.startInterview(
        scenarioId,
        selectedCvId || undefined,
      );
      navigate(`/interview/${session.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start interview');
      setStarting(false);
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
        <Typography variant="h4" gutterBottom>
          <Psychology sx={{ verticalAlign: 'middle', mr: 1 }} />
          Start Mock Interview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a scenario and practice your interview skills with AI
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {cvAnalyses.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Link CV Analysis (Optional)</InputLabel>
            <Select
              value={selectedCvId}
              onChange={(e) => setSelectedCvId(e.target.value)}
              label="Link CV Analysis (Optional)"
            >
              <MenuItem value="">
                <em>None - Generic Interview</em>
              </MenuItem>
              {cvAnalyses.map((analysis) => (
                <MenuItem key={analysis.id} value={analysis.id}>
                  CV uploaded on {new Date(analysis.createdAt).toLocaleDateString()}
                  {analysis.targetCareerId && ' - Tailored interview'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Grid container spacing={3}>
        {scenarios.map((scenario) => (
          <Grid item xs={12} md={6} key={scenario.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {scenario.name}
                </Typography>
                {scenario.career && (
                  <Chip
                    label={scenario.career.name}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                )}
                <Typography variant="body2" color="text.secondary" paragraph>
                  {scenario.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {scenario.rounds.length} rounds
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleStart(scenario.id)}
                  disabled={starting}
                  fullWidth
                >
                  {starting ? 'Starting...' : 'Start Interview'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {scenarios.length === 0 && !loading && (
        <Alert severity="info">No scenarios available. Please contact admin.</Alert>
      )}
    </Container>
  );
}

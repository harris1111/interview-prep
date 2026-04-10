import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import { EmojiEvents, TrendingUp, TrendingDown, Lightbulb } from '@mui/icons-material';

interface OverallSummaryProps {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  readinessLevel: string;
  topRecommendations: string[];
}

export function OverallSummary({
  overallScore,
  summary,
  strengths,
  weaknesses,
  readinessLevel,
  topRecommendations,
}: OverallSummaryProps) {
  // Calculate progress percentage (0-10 scale)
  const progressPercentage = (overallScore / 10) * 100;

  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 7) return '#4caf50'; // success green
    if (score >= 4) return '#ff9800'; // warning orange
    return '#f44336'; // error red
  };

  // Readiness badge color
  const getReadinessColor = (level: string): 'success' | 'info' | 'warning' | 'error' => {
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
        return 'info';
    }
  };

  // Format readiness level for display
  const formatReadinessLevel = (level: string): string => {
    return level
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEvents sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
              Overall Assessment
            </Typography>
            <Chip
              label={formatReadinessLevel(readinessLevel)}
              color={getReadinessColor(readinessLevel)}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={progressPercentage}
              size={100}
              thickness={4}
              sx={{
                color: scoreColor,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h4" component="div" sx={{ color: scoreColor, fontWeight: 700 }}>
                {overallScore.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                / 10
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {summary}
        </Typography>

        <Grid container spacing={2}>
          {strengths.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}
                >
                  <TrendingUp sx={{ fontSize: 22, mr: 0.5, color: 'success.main' }} />
                  Key Strengths
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {strengths.map((strength, idx) => (
                    <Chip
                      key={idx}
                      label={strength}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          )}

          {weaknesses.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}
                >
                  <TrendingDown sx={{ fontSize: 22, mr: 0.5, color: 'error.main' }} />
                  Areas to Improve
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {weaknesses.map((weakness, idx) => (
                    <Chip
                      key={idx}
                      label={weakness}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          )}

          {topRecommendations.length > 0 && (
            <Grid item xs={12}>
              <Box>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}
                >
                  <Lightbulb sx={{ fontSize: 22, mr: 0.5, color: 'info.main' }} />
                  Top Recommendations
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  {topRecommendations.map((rec, idx) => (
                    <Typography
                      component="li"
                      key={idx}
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {rec}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

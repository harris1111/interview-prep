import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface RoundSummaryCardProps {
  averageScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export function RoundSummaryCard({
  averageScore,
  summary,
  strengths,
  improvements,
}: RoundSummaryCardProps) {
  // Calculate progress percentage (0-10 scale to 0-100%)
  const progressPercentage = (averageScore / 10) * 100;

  // Determine color based on score
  const getColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 7) return 'success';
    if (score >= 4) return 'warning';
    return 'error';
  };

  const color = getColor(averageScore);

  return (
    <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Round Summary</Typography>
          <Typography variant="h4" color={`${color}.main`}>
            {averageScore.toFixed(1)}/10
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            color={color}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {summary}
        </Typography>

        <Grid container spacing={2}>
          {strengths.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}
                >
                  <TrendingUp sx={{ fontSize: 20, mr: 0.5 }} />
                  Strengths
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

          {improvements.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}
                >
                  <TrendingDown sx={{ fontSize: 20, mr: 0.5 }} />
                  Areas for Improvement
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {improvements.map((improvement, idx) => (
                    <Chip
                      key={idx}
                      label={improvement}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
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

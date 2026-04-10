import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircle as StrengthIcon,
  Warning as GapIcon,
} from '@mui/icons-material';

interface GapReportProps {
  gapReport: {
    overallReadiness: 'not_ready' | 'needs_work' | 'mostly_ready' | 'strong';
    readinessScore: number;
    strengths: Array<{
      topic: string;
      evidence: string;
      level: string;
    }>;
    gaps: Array<{
      topic: string;
      severity: 'critical' | 'moderate' | 'minor';
      recommendation: string;
    }>;
    recommendations: string[];
    suggestedFocusAreas: string[];
  };
}

export function GapReportView({ gapReport }: GapReportProps) {
  const getReadinessColor = (readiness: string) => {
    const colorMap = {
      not_ready: 'error',
      needs_work: 'warning',
      mostly_ready: 'info',
      strong: 'success',
    };
    return colorMap[readiness as keyof typeof colorMap] || 'default';
  };

  const getSeverityColor = (severity: string) => {
    const colorMap = {
      critical: 'error',
      moderate: 'warning',
      minor: 'info',
    };
    return colorMap[severity as keyof typeof colorMap] || 'default';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gap Analysis Report
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Readiness Score */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Overall Readiness</Typography>
          <Chip
            label={gapReport.overallReadiness.replace('_', ' ').toUpperCase()}
            color={getReadinessColor(gapReport.overallReadiness) as any}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            variant="determinate"
            value={gapReport.readinessScore}
            sx={{ flex: 1, height: 10, borderRadius: 5 }}
            color={getReadinessColor(gapReport.overallReadiness) as any}
          />
          <Typography variant="h6">{gapReport.readinessScore}%</Typography>
        </Box>
      </Box>

      {/* Strengths */}
      {gapReport.strengths && gapReport.strengths.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StrengthIcon color="success" />
            Strengths
          </Typography>
          <Grid container spacing={2}>
            {gapReport.strengths.map((strength, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ borderColor: 'success.main', borderWidth: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">{strength.topic}</Typography>
                      <Chip label={strength.level} size="small" color="success" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {strength.evidence}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Gaps */}
      {gapReport.gaps && gapReport.gaps.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GapIcon color="warning" />
            Gaps to Address
          </Typography>
          <Grid container spacing={2}>
            {gapReport.gaps.map((gap, index) => (
              <Grid item xs={12} key={index}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: `${getSeverityColor(gap.severity)}.main`,
                    borderWidth: 2,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">{gap.topic}</Typography>
                      <Chip
                        label={gap.severity.toUpperCase()}
                        size="small"
                        color={getSeverityColor(gap.severity) as any}
                      />
                    </Box>
                    <Typography variant="body2">
                      <strong>Recommendation:</strong> {gap.recommendation}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Recommendations */}
      {gapReport.recommendations && gapReport.recommendations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Recommendations
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {gapReport.recommendations.map((rec, index) => (
                  <li key={index}>
                    <Typography variant="body2">{rec}</Typography>
                  </li>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Suggested Focus Areas */}
      {gapReport.suggestedFocusAreas && gapReport.suggestedFocusAreas.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Suggested Focus Areas
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {gapReport.suggestedFocusAreas.map((area, index) => (
              <Chip key={index} label={area} color="primary" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}

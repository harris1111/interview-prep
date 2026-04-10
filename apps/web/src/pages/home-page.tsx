import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  alpha,
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  Description as CvIcon,
  PlayCircle as StartIcon,
  History as HistoryIcon,
  Leaderboard as ScoresIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/use-auth';

const features = [
  {
    title: 'Upload CV',
    description: 'Upload your CV/resume for AI-powered analysis and gap detection',
    icon: UploadIcon,
    path: '/cv/upload',
    color: '#2563EB',
  },
  {
    title: 'My CVs',
    description: 'View your uploaded CVs and analysis results',
    icon: CvIcon,
    path: '/cv/my',
    color: '#10B981',
  },
  {
    title: 'Start Interview',
    description: 'Begin an AI-powered mock interview session tailored to your profile',
    icon: StartIcon,
    path: '/interview/start',
    color: '#F97316',
  },
  {
    title: 'Interview History',
    description: 'Review past interview sessions and track your progress',
    icon: HistoryIcon,
    path: '/interview/history',
    color: '#7C3AED',
  },
  {
    title: 'Scores & Analytics',
    description: 'View detailed scores, feedback, and performance trends',
    icon: ScoresIcon,
    path: '/interview/scores',
    color: '#EF4444',
  },
];

const adminFeature = {
  title: 'Admin Panel',
  description: 'Manage careers, topics, questions, scenarios, and system settings',
  icon: AdminIcon,
  path: '/admin',
  color: '#475569',
};

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const allFeatures = user?.role === 'ADMIN' ? [...features, adminFeature] : features;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 5, mt: 2 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          fontWeight={700}
          sx={{ letterSpacing: '-0.03em' }}
        >
          Welcome back, {user?.name}
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600 }}>
          AI-powered interview preparation and practice. Choose a feature to get started.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {allFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Grid key={feature.path} item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(feature.color, 0.15)}`,
                    borderColor: alpha(feature.color, 0.3),
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(feature.path)}
                  sx={{ height: '100%', p: 1 }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        bgcolor: alpha(feature.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Icon sx={{ fontSize: 26, color: feature.color }} />
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

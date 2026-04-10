import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
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
    icon: <UploadIcon sx={{ fontSize: 48 }} />,
    path: '/cv/upload',
    color: '#1976d2',
  },
  {
    title: 'My CVs',
    description: 'View your uploaded CVs and analysis results',
    icon: <CvIcon sx={{ fontSize: 48 }} />,
    path: '/cv/my',
    color: '#2e7d32',
  },
  {
    title: 'Start Interview',
    description: 'Begin an AI-powered mock interview session tailored to your profile',
    icon: <StartIcon sx={{ fontSize: 48 }} />,
    path: '/interview/start',
    color: '#ed6c02',
  },
  {
    title: 'Interview History',
    description: 'Review past interview sessions and track your progress',
    icon: <HistoryIcon sx={{ fontSize: 48 }} />,
    path: '/interview/history',
    color: '#9c27b0',
  },
  {
    title: 'Scores & Analytics',
    description: 'View detailed scores, feedback, and performance trends',
    icon: <ScoresIcon sx={{ fontSize: 48 }} />,
    path: '/interview/scores',
    color: '#d32f2f',
  },
];

const adminFeature = {
  title: 'Admin Panel',
  description: 'Manage careers, topics, questions, scenarios, and system settings',
  icon: <AdminIcon sx={{ fontSize: 48 }} />,
  path: '/admin',
  color: '#455a64',
};

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const allFeatures = user?.role === 'ADMIN' ? [...features, adminFeature] : features;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered interview preparation and practice platform. Choose a feature to get started.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {allFeatures.map((feature) => (
          <Grid key={feature.path} item xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(feature.path)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: feature.color, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

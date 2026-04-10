import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Box, Skeleton, alpha } from '@mui/material';
import {
  People as PeopleIcon,
  Quiz as QuizIcon,
  Work as WorkIcon,
  Topic as TopicIcon,
  MovieFilter as ScenarioIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  EventAvailable as EventIcon,
} from '@mui/icons-material';
import { dashboardApi } from '../../services/admin-service';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ '&:hover': { borderColor: alpha(color, 0.3) } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight={700}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: alpha(color, 0.1),
              borderRadius: 3,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={50} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<PeopleIcon sx={{ color: '#2563EB', fontSize: 32 }} />}
            color="#2563EB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats?.totalSessions ?? 0}
            icon={<AssessmentIcon sx={{ color: '#10B981', fontSize: 32 }} />}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Questions"
            value={stats?.totalQuestions ?? 0}
            icon={<QuizIcon sx={{ color: '#F97316', fontSize: 32 }} />}
            color="#F97316"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Score"
            value={stats?.avgScore ? `${stats.avgScore.toFixed(1)}%` : '0%'}
            icon={<TrendingUpIcon sx={{ color: '#7C3AED', fontSize: 32 }} />}
            color="#7C3AED"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Careers"
            value={stats?.totalCareers ?? 0}
            icon={<WorkIcon sx={{ color: '#EF4444', fontSize: 32 }} />}
            color="#EF4444"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Topics"
            value={stats?.totalTopics ?? 0}
            icon={<TopicIcon sx={{ color: '#06B6D4', fontSize: 32 }} />}
            color="#06B6D4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Scenarios"
            value={stats?.totalScenarios ?? 0}
            icon={<ScenarioIcon sx={{ color: '#8B5CF6', fontSize: 32 }} />}
            color="#8B5CF6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Sessions"
            value={stats?.recentSessions ?? 0}
            icon={<EventIcon sx={{ color: '#3B82F6', fontSize: 32 }} />}
            color="#3B82F6"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

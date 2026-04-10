import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
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
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 2,
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
            icon={<PeopleIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats?.totalSessions ?? 0}
            icon={<AssessmentIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Questions"
            value={stats?.totalQuestions ?? 0}
            icon={<QuizIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Score"
            value={stats?.avgScore ? `${stats.avgScore.toFixed(1)}%` : '0%'}
            icon={<TrendingUpIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Careers"
            value={stats?.totalCareers ?? 0}
            icon={<WorkIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Topics"
            value={stats?.totalTopics ?? 0}
            icon={<TopicIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#00bcd4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Scenarios"
            value={stats?.totalScenarios ?? 0}
            icon={<ScenarioIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#673ab7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Sessions"
            value={stats?.recentSessions ?? 0}
            icon={<EventIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#3f51b5"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

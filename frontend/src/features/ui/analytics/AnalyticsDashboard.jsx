import {
    People as PeopleIcon,
    Public as PublicIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import {
    alpha,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Grid,
    styled,
    Typography,
    useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// Styled components
const StatsCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const IconBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  marginBottom: theme.spacing(2)
}));

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const [systemStats, setSystemStats] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch system stats
        const statsResponse = await fetch('/api/analytics/system');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch system stats');
        }
        const statsData = await statsResponse.json();
        setSystemStats(statsData);

        // Fetch performance metrics
        const metricsResponse = await fetch('/api/analytics/performance');
        if (!metricsResponse.ok) {
          throw new Error('Failed to fetch performance metrics');
        }
        const metricsData = await metricsResponse.json();
        setPerformanceMetrics(metricsData);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const activityData = systemStats?.top_universes.map(universe => ({
    name: `Universe ${universe.universe_id}`,
    activities: universe.activity_count
  })) || [];

  const performanceData = performanceMetrics ? Object.entries(performanceMetrics.event_stats).map(([event, stats]) => ({
    name: event,
    avgDuration: stats.avg_duration,
    maxDuration: stats.max_duration
  })) : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <PeopleIcon sx={{ color: theme.palette.primary.main }} />
              </IconBox>
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h4">{systemStats?.total_users}</Typography>
              <Typography variant="subtitle2" color="textSecondary">
                {systemStats?.active_users_24h} active in 24h
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                <PublicIcon sx={{ color: theme.palette.secondary.main }} />
              </IconBox>
              <Typography variant="h6">Total Universes</Typography>
              <Typography variant="h4">{systemStats?.total_universes}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <TimelineIcon sx={{ color: theme.palette.success.main }} />
              </IconBox>
              <Typography variant="h6">Total Activities</Typography>
              <Typography variant="h4">{systemStats?.total_activities}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <SpeedIcon sx={{ color: theme.palette.warning.main }} />
              </IconBox>
              <Typography variant="h6">Total Events</Typography>
              <Typography variant="h4">{performanceMetrics?.total_events}</Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Last {performanceMetrics?.period_hours}h
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Active Universes
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="activities" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avgDuration"
                      stroke={theme.palette.primary.main}
                      name="Avg Duration (ms)"
                    />
                    <Line
                      type="monotone"
                      dataKey="maxDuration"
                      stroke={theme.palette.secondary.main}
                      name="Max Duration (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsDashboard;

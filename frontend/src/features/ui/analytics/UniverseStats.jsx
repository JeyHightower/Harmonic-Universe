import {
    Group as GroupIcon,
    History as HistoryIcon,
    Settings as SettingsIcon,
    Update as UpdateIcon
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
import { useParams } from 'react-router-dom';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
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

const UniverseStats = () => {
  const theme = useTheme();
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/universe/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch universe stats');
        }
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [id]);

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

  const activityBreakdown = stats ? Object.entries(stats.activity_breakdown).map(([action, count]) => ({
    name: action,
    value: count
  })) : [];

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Universe Analytics
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <GroupIcon sx={{ color: theme.palette.primary.main }} />
              </IconBox>
              <Typography variant="h6">Unique Visitors</Typography>
              <Typography variant="h4">{stats?.unique_visitors}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                <SettingsIcon sx={{ color: theme.palette.secondary.main }} />
              </IconBox>
              <Typography variant="h6">Parameter Updates</Typography>
              <Typography variant="h4">{stats?.parameter_updates}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <HistoryIcon sx={{ color: theme.palette.success.main }} />
              </IconBox>
              <Typography variant="h6">Total Activities</Typography>
              <Typography variant="h4">{stats?.total_activities}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <UpdateIcon sx={{ color: theme.palette.warning.main }} />
              </IconBox>
              <Typography variant="h6">Last Modified</Typography>
              <Typography variant="subtitle1">
                {new Date(stats?.last_modified).toLocaleDateString()}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Activity Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {activityBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity Timeline
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats?.recent_activities || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={theme.palette.primary.main}
                      fill={alpha(theme.palette.primary.main, 0.2)}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UniverseStats;

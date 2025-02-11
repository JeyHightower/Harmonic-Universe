import {
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Public as PublicIcon,
    Timeline as TimelineIcon,
    Update as UpdateIcon
} from '@mui/icons-material';
import {
    alpha,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
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

const ActivityItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1)
  }
}));

const UserStats = () => {
  const theme = useTheme();
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/user/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
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

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created':
        return <AddIcon />;
      case 'updated':
        return <EditIcon />;
      case 'deleted':
        return <DeleteIcon />;
      default:
        return <TimelineIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Analytics
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <PublicIcon sx={{ color: theme.palette.primary.main }} />
              </IconBox>
              <Typography variant="h6">Total Universes</Typography>
              <Typography variant="h4">{stats?.universe_count}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1) }}>
                <TimelineIcon sx={{ color: theme.palette.secondary.main }} />
              </IconBox>
              <Typography variant="h6">Active Days</Typography>
              <Typography variant="h4">{stats?.active_days}</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <UpdateIcon sx={{ color: theme.palette.success.main }} />
              </IconBox>
              <Typography variant="h6">Last Active</Typography>
              <Typography variant="subtitle1">
                {stats?.recent_activities?.[0]?.timestamp
                  ? formatDate(stats.recent_activities[0].timestamp)
                  : 'Never'}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <IconBox sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <CalendarIcon sx={{ color: theme.palette.warning.main }} />
              </IconBox>
              <Typography variant="h6">Joined</Typography>
              <Typography variant="subtitle1">
                {stats?.joined_date ? formatDate(stats.joined_date) : 'Unknown'}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Activity History */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {stats?.recent_activities?.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ActivityItem>
                      <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                        {getActivityIcon(activity.action)}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${activity.action} ${activity.target}`}
                        secondary={formatDate(activity.timestamp)}
                      />
                    </ActivityItem>
                    {index < stats.recent_activities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Timeline
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats?.recent_activities || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(timestamp) => formatDate(timestamp)}
                      formatter={(value) => [value, 'Activities']}
                    />
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

export default UserStats;

import { Add as AddIcon, Login as LoginIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Fab,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import UniverseGrid from "../components/Universe/UniverseGrid";
import { login } from "../store/slices/authSlice";

const Dashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { universes, favorites } = useSelector((state) => state.universe);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await dispatch(
        login({
          email: "demo@example.com",
          password: "demo123",
        }),
      ).unwrap();
      navigate("/dashboard");
    } catch (error) {
      console.error("Demo login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentUniverses = universes?.slice(0, 4) || [];
  const recentFavorites = favorites?.slice(0, 4) || [];

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to Harmonic Universe
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 600 }}
        >
          Create and explore musical universes, collaborate in real-time, and
          discover new harmonies.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={handleDemoLogin}
          disabled={loading}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            position: "relative",
            overflow: "hidden",
            "&::after": loading
              ? {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(255,255,255,0.1)",
                  animation: "pulse 1.5s infinite",
                }
              : {},
          }}
        >
          Try Demo Account
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h4">Welcome back, {user.username}!</Typography>
        <Fab
          color="primary"
          aria-label="add universe"
          onClick={() => navigate("/universe/new")}
          sx={{
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              background: theme.palette.primary.main,
              opacity: 0.2,
              borderRadius: "50%",
              transition: "all 0.3s ease-in-out",
            },
            "&:hover::before": {
              opacity: 0.3,
              transform: "scale(1.1)",
            },
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Universes
            </Typography>
            <UniverseGrid
              universes={recentUniverses}
              loading={loading}
              favorites={favorites}
              currentUserId={user.id}
            />
            {recentUniverses.length > 0 && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/explore")}
                  sx={{ borderColor: "rgba(255,255,255,0.12)" }}
                >
                  View All Universes
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Universes
              </Typography>
              <Typography variant="h4">{universes?.length || 0}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Favorites
              </Typography>
              <Typography variant="h4">{favorites?.length || 0}</Typography>
            </Box>
          </Paper>

          <Paper
            sx={{
              p: 3,
              background: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {/* Add recent activity list here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

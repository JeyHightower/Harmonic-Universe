import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Share as ShareIcon,
  StarBorder as StarBorderIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Container,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import ParameterManager from "../components/Universe/ParameterManager";
import PrivacySettings from "../components/Universe/PrivacySettings";
import UniverseNav from "../components/UniverseDetails/UniverseNav";
import WebSocketService from "../services/WebSocketService";
import {
  deleteUniverse,
  fetchUniverse,
  setSimulationStatus,
  toggleFavorite,
  updateParameters,
} from "../store/slices/universeSlice";

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const UniverseDetails = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const universe = useSelector((state) => state.universes.current);
  const simulationStatus = useSelector(
    (state) => state.universes.simulationStatus,
  );

  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchUniverse(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (universe) {
      WebSocketService.connect();
      WebSocketService.joinUniverse(id);

      const handleParameterUpdate = (data) => {
        if (data.universe_id === id) {
          dispatch(updateParameters(data));
        }
      };

      const handleSimulationStart = (data) => {
        if (data.universe_id === id) {
          dispatch(setSimulationStatus("running"));
        }
      };

      const handleSimulationStop = (data) => {
        if (data.universe_id === id) {
          dispatch(setSimulationStatus("stopped"));
        }
      };

      const handleSimulationReset = (data) => {
        if (data.universe_id === id) {
          dispatch(setSimulationStatus("stopped"));
          dispatch(fetchUniverse(id));
        }
      };

      WebSocketService.on("parameter_updated", handleParameterUpdate);
      WebSocketService.on("simulation_started", handleSimulationStart);
      WebSocketService.on("simulation_stopped", handleSimulationStop);
      WebSocketService.on("simulation_reset", handleSimulationReset);

      return () => {
        WebSocketService.leaveUniverse(id);
        WebSocketService.off("parameter_updated", handleParameterUpdate);
        WebSocketService.off("simulation_started", handleSimulationStart);
        WebSocketService.off("simulation_stopped", handleSimulationStop);
        WebSocketService.off("simulation_reset", handleSimulationReset);
      };
    }
  }, [dispatch, id, universe]);

  if (!universe) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const isOwner = universe.creator_id === currentUser?.id;

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {universe.name}
        </Typography>
        <Typography color="text.secondary" paragraph>
          {universe.description}
        </Typography>

        <UniverseNav />

        <Paper
          sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "background.paper" }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                {universe.name}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Created by {universe.creator_name} on{" "}
                {new Date(universe.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {isOwner && (
                <>
                  <IconButton onClick={() => navigate(`/universes/${id}/edit`)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (window.confirm("Delete this universe?")) {
                        dispatch(deleteUniverse(id));
                        navigate("/universes");
                      }
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton onClick={() => setShowPrivacySettings(true)}>
                    <SettingsIcon />
                  </IconButton>
                </>
              )}
              <IconButton onClick={() => dispatch(toggleFavorite(id))}>
                {universe.is_favorite ? (
                  <StarIcon color="primary" />
                ) : (
                  <StarBorderIcon />
                )}
              </IconButton>
              <IconButton>
                <ShareIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AvatarGroup max={4}>
              {activeCollaborators.map((user) => (
                <Tooltip key={user.id} title={user.username}>
                  <Badge variant="dot" color="success">
                    <Avatar alt={user.username} src={user.avatar_url} />
                  </Badge>
                </Tooltip>
              ))}
            </AvatarGroup>
            <Typography variant="body2" color="text.secondary">
              {activeCollaborators.length} active{" "}
              {activeCollaborators.length === 1 ? "user" : "users"}
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minWidth: 120,
                fontWeight: 500,
              },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Physics" disabled={!universe.physics_enabled} />
            <Tab label="Music" disabled={!universe.music_enabled} />
            <Tab label="Visualization" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {universe.description}
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ParameterManager
              universeId={id}
              type="physics"
              parameters={universe.physics_parameters}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ParameterManager
              universeId={id}
              type="music"
              parameters={universe.music_parameters}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <ParameterManager
              universeId={id}
              type="visualization"
              parameters={universe.visualization_parameters}
            />
          </TabPanel>
        </Paper>

        <PrivacySettings
          open={showPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
          universe={universe}
        />

        {/* Universe visualization will go here */}
        <Box
          sx={{
            width: "100%",
            height: 400,
            bgcolor: "background.paper",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">Universe Visualization</Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default UniverseDetails;

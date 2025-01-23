import { Edit as EditIcon, Share as ShareIcon } from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { universeService } from '../../services/universeService';
import websocketService from '../../services/websocketService';
import ParameterForm from './ParameterForm';
import PrivacySettings from './PrivacySettings';
import ShareDialog from './ShareDialog';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const UniverseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState(new Map());

  useEffect(() => {
    const fetchUniverse = async () => {
      try {
        const data = await universeService.getUniverse(id);
        setUniverse(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUniverse();
  }, [id]);

  useEffect(() => {
    if (!universe) return;

    // Connect to WebSocket and join universe room
    websocketService.joinUniverse(id);
    websocketService.updatePresence(id, 'active');

    // Listen for parameter updates
    const parameterHandler = (data) => {
      if (data.universe_id === id) {
        setUniverse(prev => ({
          ...prev,
          [`${data.type}_parameters`]: data.value,
        }));
      }
    };

    // Listen for presence updates
    const presenceHandler = (data) => {
      if (data.universe_id === id) {
        setActiveCollaborators(prev => {
          const newMap = new Map(prev);
          if (data.status === 'active') {
            newMap.set(data.user_id, data.user);
          } else {
            newMap.delete(data.user_id);
          }
          return newMap;
        });
      }
    };

    websocketService.on('parameter_update', parameterHandler);
    websocketService.on('presence_update', presenceHandler);

    return () => {
      websocketService.leaveUniverse(id);
      websocketService.off('parameter_update', parameterHandler);
      websocketService.off('presence_update', presenceHandler);
    };
  }, [id, universe]);

  const handleEdit = () => {
    navigate(`/universes/${id}/edit`);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleParameterUpdate = (type, params) => {
    websocketService.updateParameter(id, type, params);
  };

  const handlePrivacyUpdate = (updatedUniverse) => {
    setUniverse(updatedUniverse);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!universe) return <div>Universe not found</div>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {universe.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {universe.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {activeCollaborators.size > 0 && (
              <AvatarGroup max={4}>
                {Array.from(activeCollaborators.values()).map(user => (
                  <Tooltip key={user.id} title={user.username}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color="success"
                    >
                      <Avatar
                        alt={user.username}
                        src={user.avatarUrl}
                      >
                        {user.username[0]}
                      </Avatar>
                    </Badge>
                  </Tooltip>
                ))}
              </AvatarGroup>
            )}
            <PrivacySettings
              universe={universe}
              onUpdate={handlePrivacyUpdate}
            />
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => setShareDialogOpen(true)}
            >
              Share
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit Universe
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Physics" />
            <Tab label="Music" />
            <Tab label="Visualization" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Created:</strong>{' '}
                  {new Date(universe.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Last Updated:</strong>{' '}
                  {new Date(universe.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Status:</strong>{' '}
                  {universe.is_public ? 'Public' : 'Private'}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Creator:</strong> {universe.creator}
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {universe.physics_enabled ? (
              <ParameterForm
                universeId={id}
                type="physics"
                initialParameters={universe.physics_parameters}
                onUpdate={params => handleParameterUpdate('physics', params)}
              />
            ) : (
              <Typography>Physics is disabled for this universe.</Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {universe.music_enabled ? (
              <ParameterForm
                universeId={id}
                type="music"
                initialParameters={universe.music_parameters}
                onUpdate={params => handleParameterUpdate('music', params)}
              />
            ) : (
              <Typography>Music is disabled for this universe.</Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <ParameterForm
              universeId={id}
              type="visualization"
              initialParameters={universe.visualization_parameters}
              onUpdate={params => handleParameterUpdate('visualization', params)}
            />
          </TabPanel>
        </Paper>

        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          universeId={id}
          currentCollaborators={universe.collaborators || []}
        />
      </Box>
    </Container>
  );
};

export default UniverseDetails;

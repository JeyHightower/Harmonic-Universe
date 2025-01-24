import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Settings as SettingsIcon,
    Share as ShareIcon,
    StarBorder as StarBorderIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import {
    Avatar,
    AvatarGroup,
    Badge,
    Box,
    Divider,
    IconButton,
    Paper,
    Tab,
    Tabs,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ParameterManager from '../components/Universe/ParameterManager';
import PrivacySettings from '../components/Universe/PrivacySettings';
import { WebSocketService } from '../services/WebSocketService';
import { deleteUniverse, fetchUniverse, toggleFavorite } from '../store/slices/universeSlice';

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

  const { universe, loading, error } = useSelector((state) => state.universe);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchUniverse(id));
    const ws = WebSocketService.getInstance();
    ws.joinUniverse(id);
    ws.on('presence_update', setActiveCollaborators);
    return () => {
      ws.leaveUniverse(id);
      ws.off('presence_update', setActiveCollaborators);
    };
  }, [id, dispatch]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!universe) return <Typography>Universe not found</Typography>;

  const isOwner = universe.creator_id === currentUser?.id;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>{universe.name}</Typography>
            <Typography color="text.secondary" gutterBottom>
              Created by {universe.creator_name} on {' '}
              {new Date(universe.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isOwner && (
              <>
                <IconButton onClick={() => navigate(`/universes/${id}/edit`)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => {
                  if (window.confirm('Delete this universe?')) {
                    dispatch(deleteUniverse(id));
                    navigate('/universes');
                  }
                }} color="error">
                  <DeleteIcon />
                </IconButton>
                <IconButton onClick={() => setShowPrivacySettings(true)}>
                  <SettingsIcon />
                </IconButton>
              </>
            )}
            <IconButton onClick={() => dispatch(toggleFavorite(id))}>
              {universe.is_favorite ? <StarIcon color="primary" /> : <StarBorderIcon />}
            </IconButton>
            <IconButton>
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            {activeCollaborators.length} active {activeCollaborators.length === 1 ? 'user' : 'users'}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
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
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{universe.description}</Typography>
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
    </Box>
  );
};

export default UniverseDetails;

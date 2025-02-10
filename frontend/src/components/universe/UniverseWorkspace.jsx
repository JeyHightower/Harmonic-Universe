import { useUniverse } from '@/hooks/useUniverse';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { PhysicsObjectList } from '../physics/PhysicsObjectList';
import { StoryBoard } from './StoryBoard';
import { UniverseHarmony } from './UniverseHarmony';
import UniverseList from './UniverseList';
import { UniverseParameters } from './UniverseParameters';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`universe-tabpanel-${index}`}
      aria-labelledby={`universe-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const UniverseWorkspace = () => {
  const { id: universeId } = useParams();
  const {
    currentUniverse,
    loading,
    error,
    fetchUniverse,
    updatePhysics,
    addStoryPoint,
    exportUniverse,
  } = useUniverse();

  const [tabValue, setTabValue] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!universeId) return;

    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      query: {
        token: localStorage.getItem('token'),
      },
    });

    // Join universe room
    socketRef.current.emit('join_universe', { universe_id: universeId });

    // Listen for universe updates
    socketRef.current.on('physics_changed', data => {
      if (data.universe_id === universeId) {
        updatePhysics(universeId, data.parameters);
      }
    });

    socketRef.current.on('harmony_changed', data => {
      if (data.universe_id === universeId) {
        // Handle harmony updates
        console.log('Harmony updated:', data);
      }
    });

    socketRef.current.on('story_changed', data => {
      if (data.universe_id === universeId) {
        fetchUniverse(universeId);
      }
    });

    socketRef.current.on('error', data => {
      console.error('WebSocket error:', data.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_universe', { universe_id: universeId });
        socketRef.current.disconnect();
      }
    };
  }, [universeId, updatePhysics, fetchUniverse]);

  useEffect(() => {
    if (universeId) {
      fetchUniverse(universeId);
    }
  }, [universeId, fetchUniverse]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePhysicsUpdate = async updates => {
    await updatePhysics(universeId, updates);
    // Emit physics update through WebSocket
    socketRef.current?.emit('physics_update', {
      universe_id: universeId,
      parameters: updates,
    });
  };

  // If no universeId, we're in list view
  if (!universeId) {
    return <UniverseList />;
  }

  if (loading || !currentUniverse) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="universe workspace tabs"
        >
          <Tab label="Parameters" />
          <Tab label="Physics" />
          <Tab label="Harmony" />
          <Tab label="Story" />
        </Tabs>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TabPanel value={tabValue} index={0}>
            <UniverseParameters
              universe={currentUniverse}
              onUpdate={handlePhysicsUpdate}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <PhysicsObjectList projectId={universeId} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <UniverseHarmony
              universe={currentUniverse}
              onExport={() => exportUniverse(universeId, 'audio')}
              socket={socketRef.current}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <StoryBoard
              universe={currentUniverse}
              onAddStoryPoint={addStoryPoint}
            />
          </TabPanel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UniverseWorkspace;

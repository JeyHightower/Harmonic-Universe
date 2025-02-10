import { useModal } from '@/contexts/ModalContext';
import { useVisualization } from '@/hooks/useVisualization';
import { commonStyles } from '@/styles/commonStyles';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
import VisualizationList from './VisualizationList';
import VisualizationPreview from './VisualizationPreview';
import VisualizationSettings from './VisualizationSettings';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`visualization-tabpanel-${index}`}
      aria-labelledby={`visualization-tab-${index}`}
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

const VisualizationWorkspace = () => {
  const { id: visualizationId } = useParams();
  const {
    currentVisualization,
    loading,
    error,
    fetchVisualization,
    updateVisualization,
  } = useVisualization();
  const { openModal } = useModal();

  const [tabValue, setTabValue] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!visualizationId) return;

    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      query: {
        token: localStorage.getItem('token'),
      },
    });

    // Join visualization room
    socketRef.current.emit('join_visualization', {
      visualization_id: visualizationId,
    });

    // Listen for visualization updates
    socketRef.current.on('visualization_updated', data => {
      if (data.visualization_id === visualizationId) {
        fetchVisualization(visualizationId);
      }
    });

    socketRef.current.on('error', data => {
      console.error('WebSocket error:', data.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_visualization', {
          visualization_id: visualizationId,
        });
        socketRef.current.disconnect();
      }
    };
  }, [visualizationId, fetchVisualization]);

  useEffect(() => {
    if (visualizationId) {
      fetchVisualization(visualizationId);
    }
  }, [visualizationId, fetchVisualization]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSettingsUpdate = async updates => {
    await updateVisualization({
      id: visualizationId,
      data: {
        ...currentVisualization,
        settings: { ...currentVisualization.settings, ...updates },
      },
    });
    // Emit update through WebSocket
    socketRef.current?.emit('visualization_update', {
      visualization_id: visualizationId,
      updates,
    });
  };

  // If no visualizationId, we're in list view
  if (!visualizationId) {
    return (
      <Box sx={commonStyles.pageContainer}>
        <Box sx={{ ...commonStyles.flexBetween, mb: 4 }}>
          <h1>Visualizations</h1>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openModal('CREATE_VISUALIZATION')}
            sx={commonStyles.button}
          >
            Create Visualization
          </Button>
        </Box>
        <VisualizationList />
      </Box>
    );
  }

  if (loading || !currentVisualization) {
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
      <Box sx={{ ...commonStyles.flexBetween, mb: 3 }}>
        <h2>{currentVisualization.name}</h2>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() =>
              openModal('EDIT_VISUALIZATION', {
                visualization: currentVisualization,
              })
            }
            sx={commonStyles.button}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() =>
              openModal('DELETE_VISUALIZATION', {
                visualization: currentVisualization,
              })
            }
            sx={commonStyles.button}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="visualization workspace tabs"
        >
          <Tab label="Preview" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TabPanel value={tabValue} index={0}>
            <VisualizationPreview
              visualization={currentVisualization}
              onUpdate={handleSettingsUpdate}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <VisualizationSettings
              visualization={currentVisualization}
              onUpdate={handleSettingsUpdate}
            />
          </TabPanel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VisualizationWorkspace;

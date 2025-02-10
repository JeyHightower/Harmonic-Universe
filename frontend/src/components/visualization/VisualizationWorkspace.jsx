import { modalTypes, useModal } from '@/contexts/ModalContext';
import { useVisualization } from '@/hooks/useVisualization';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import VisualizationList from './VisualizationList';
import VisualizationRenderer from './VisualizationRenderer';
import VisualizationSettings from './VisualizationSettings';

const VisualizationWorkspace = () => {
  const { id: visualizationId } = useParams();
  const {
    currentVisualization,
    loading,
    error,
    visualizations,
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
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">My Visualizations</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => openModal(modalTypes.CREATE_VISUALIZATION)}
          >
            Create Visualization
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !visualizations || visualizations.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              No Visualizations Found
            </Typography>
            <Typography color="text.secondary" paragraph>
              Get started by creating your first visualization.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => openModal(modalTypes.CREATE_VISUALIZATION)}
            >
              Create Visualization
            </Button>
          </Box>
        ) : (
          <VisualizationList />
        )}
      </Box>
    );
  }

  if (loading) {
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

  if (!currentVisualization) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Visualization Found
        </Typography>
        <Typography color="text.secondary" paragraph>
          The visualization you're looking for doesn't exist or you don't have
          access to it.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => openModal(modalTypes.CREATE_VISUALIZATION)}
        >
          Create Visualization
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '600px' }}>
            <VisualizationRenderer visualization={currentVisualization} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <VisualizationSettings
              visualization={currentVisualization}
              onUpdate={handleSettingsUpdate}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VisualizationWorkspace;

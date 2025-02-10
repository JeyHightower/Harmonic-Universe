import { useVisualization } from '@/hooks/useVisualization';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VisualizationList = ({ projectId }) => {
  const navigate = useNavigate();
  const {
    visualizations,
    loading,
    error,
    fetchVisualizations,
    createVisualization,
    updateVisualization,
    deleteVisualization,
  } = useVisualization();

  // State for modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'waveform', // Default visualization type
    settings: {},
  });

  useEffect(() => {
    if (projectId) {
      fetchVisualizations(projectId);
    }
  }, [projectId, fetchVisualizations]);

  const handleCreateSubmit = async () => {
    const result = await createVisualization({
      projectId,
      data: formData,
    });
    if (result) {
      setCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        type: 'waveform',
        settings: {},
      });
      fetchVisualizations(projectId);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedVisualization) return;
    const result = await updateVisualization({
      id: selectedVisualization.id,
      data: formData,
    });
    if (result) {
      setEditModalOpen(false);
      setSelectedVisualization(null);
      setFormData({
        name: '',
        description: '',
        type: 'waveform',
        settings: {},
      });
      fetchVisualizations(projectId);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVisualization) return;
    const result = await deleteVisualization(selectedVisualization.id);
    if (result) {
      setDeleteModalOpen(false);
      setSelectedVisualization(null);
      fetchVisualizations(projectId);
    }
  };

  const openEditModal = visualization => {
    setSelectedVisualization(visualization);
    setFormData({
      name: visualization.name,
      description: visualization.description,
      type: visualization.type,
      settings: visualization.settings,
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = visualization => {
    setSelectedVisualization(visualization);
    setDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Visualizations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Visualization
        </Button>
      </Box>

      <Grid container spacing={3}>
        {visualizations.map(visualization => (
          <Grid item xs={12} sm={6} md={4} key={visualization.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {visualization.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {visualization.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Type: {visualization.type}
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title="Open Visualization">
                  <Button
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() =>
                      navigate(`/dashboard/visualizations/${visualization.id}`)
                    }
                  >
                    Open
                  </Button>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => openEditModal(visualization)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => openDeleteModal(visualization)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Visualization Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)}>
        <DialogTitle>Create New Visualization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Visualization Name"
            fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <TextField
            select
            margin="dense"
            label="Visualization Type"
            fullWidth
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
          >
            <MenuItem value="waveform">Waveform</MenuItem>
            <MenuItem value="spectrum">Spectrum</MenuItem>
            <MenuItem value="particles">Particles</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Visualization Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Visualization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Visualization Name"
            fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <TextField
            select
            margin="dense"
            label="Visualization Type"
            fullWidth
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
          >
            <MenuItem value="waveform">Waveform</MenuItem>
            <MenuItem value="spectrum">Spectrum</MenuItem>
            <MenuItem value="particles">Particles</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <DialogTitle>Delete Visualization</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedVisualization?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisualizationList;

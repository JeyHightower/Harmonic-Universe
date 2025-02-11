import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    createPhysicsObject,
    deletePhysicsObject,
    selectPhysicsError,
    selectPhysicsLoading,
    updatePhysicsObject
} from '../store/physicsSlice';

const PhysicsObjectEditor = ({ open, onClose, sceneId, objectId = null, initialData = null }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectPhysicsLoading);
  const error = useSelector(selectPhysicsError);

  const [formData, setFormData] = useState({
    name: '',
    object_type: 'circle',
    mass: 1.0,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    angle: 0,
    angular_velocity: 0,
    dimensions: { radius: 25 }, // Default for circle
    restitution: 0.5,
    friction: 0.3,
    is_static: false,
    is_sensor: false,
    collision_filter: { category: 1, mask: 0xFFFF }
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVectorChange = (vectorField, component, value) => {
    setFormData(prev => ({
      ...prev,
      [vectorField]: {
        ...prev[vectorField],
        [component]: parseFloat(value) || 0
      }
    }));
  };

  const handleDimensionsChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async () => {
    const data = {
      ...formData,
      scene_id: sceneId
    };

    try {
      if (objectId) {
        await dispatch(updatePhysicsObject({ objectId, data })).unwrap();
      } else {
        await dispatch(createPhysicsObject(data)).unwrap();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save physics object:', err);
    }
  };

  const handleDelete = async () => {
    if (objectId) {
      try {
        await dispatch(deletePhysicsObject(objectId)).unwrap();
        onClose();
      } catch (err) {
        console.error('Failed to delete physics object:', err);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {objectId ? 'Edit Physics Object' : 'Create Physics Object'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Basic Properties */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Object Type</InputLabel>
                <Select
                  value={formData.object_type}
                  onChange={(e) => handleChange('object_type', e.target.value)}
                  label="Object Type"
                >
                  <MenuItem value="circle">Circle</MenuItem>
                  <MenuItem value="rectangle">Rectangle</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Physical Properties */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Mass"
                value={formData.mass}
                onChange={(e) => handleChange('mass', parseFloat(e.target.value))}
                margin="normal"
                disabled={formData.is_static}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Restitution"
                value={formData.restitution}
                onChange={(e) => handleChange('restitution', parseFloat(e.target.value))}
                margin="normal"
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            </Grid>

            {/* Position */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Position
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="X"
                    value={formData.position.x}
                    onChange={(e) => handleVectorChange('position', 'x', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Y"
                    value={formData.position.y}
                    onChange={(e) => handleVectorChange('position', 'y', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Velocity */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Velocity
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="X"
                    value={formData.velocity.x}
                    onChange={(e) => handleVectorChange('velocity', 'x', e.target.value)}
                    disabled={formData.is_static}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Y"
                    value={formData.velocity.y}
                    onChange={(e) => handleVectorChange('velocity', 'y', e.target.value)}
                    disabled={formData.is_static}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Dimensions */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Dimensions
              </Typography>
              {formData.object_type === 'circle' ? (
                <TextField
                  fullWidth
                  type="number"
                  label="Radius"
                  value={formData.dimensions.radius}
                  onChange={(e) => handleDimensionsChange('radius', e.target.value)}
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Width"
                      value={formData.dimensions.width}
                      onChange={(e) => handleDimensionsChange('width', e.target.value)}
                      margin="normal"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Height"
                      value={formData.dimensions.height}
                      onChange={(e) => handleDimensionsChange('height', e.target.value)}
                      margin="normal"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>

            {/* Flags */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_static}
                    onChange={(e) => handleChange('is_static', e.target.checked)}
                  />
                }
                label="Static Object"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_sensor}
                    onChange={(e) => handleChange('is_sensor', e.target.checked)}
                  />
                }
                label="Sensor (No Collision)"
              />
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Typography color="error">
                  {error}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        {objectId && (
          <Button
            onClick={handleDelete}
            color="error"
            disabled={loading}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhysicsObjectEditor;

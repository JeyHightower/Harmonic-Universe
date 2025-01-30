import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    createPhysicsConstraint,
    deletePhysicsConstraint,
    selectPhysicsError,
    selectPhysicsLoading,
    selectPhysicsObjects,
    updatePhysicsConstraint
} from '../store/physicsSlice';

const PhysicsConstraintEditor = ({ open, onClose, sceneId, constraintId = null, initialData = null }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectPhysicsLoading);
  const error = useSelector(selectPhysicsError);
  const physicsObjects = useSelector(selectPhysicsObjects);

  const [formData, setFormData] = useState({
    object_a_id: '',
    object_b_id: '',
    constraint_type: 'distance',
    parameters: {},
    stiffness: 1.0,
    damping: 0.7,
    length: 100,
    anchor_a: { x: 0, y: 0 },
    anchor_b: { x: 0, y: 0 },
    min_limit: null,
    max_limit: null
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

  const handleSubmit = async () => {
    try {
      if (constraintId) {
        await dispatch(updatePhysicsConstraint({ constraintId, data: formData })).unwrap();
      } else {
        await dispatch(createPhysicsConstraint(formData)).unwrap();
      }
      onClose();
    } catch (err) {
      console.error('Failed to save physics constraint:', err);
    }
  };

  const handleDelete = async () => {
    if (constraintId) {
      try {
        await dispatch(deletePhysicsConstraint(constraintId)).unwrap();
        onClose();
      } catch (err) {
        console.error('Failed to delete physics constraint:', err);
      }
    }
  };

  // Filter objects by scene
  const sceneObjects = Object.values(physicsObjects).filter(obj => obj.scene_id === sceneId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {constraintId ? 'Edit Physics Constraint' : 'Create Physics Constraint'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Object Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Object A</InputLabel>
                <Select
                  value={formData.object_a_id}
                  onChange={(e) => handleChange('object_a_id', e.target.value)}
                  label="Object A"
                >
                  {sceneObjects.map(obj => (
                    <MenuItem key={obj.id} value={obj.id}>
                      {obj.name || `Object ${obj.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Object B</InputLabel>
                <Select
                  value={formData.object_b_id}
                  onChange={(e) => handleChange('object_b_id', e.target.value)}
                  label="Object B"
                >
                  {sceneObjects.map(obj => (
                    <MenuItem key={obj.id} value={obj.id}>
                      {obj.name || `Object ${obj.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Constraint Type */}
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Constraint Type</InputLabel>
                <Select
                  value={formData.constraint_type}
                  onChange={(e) => handleChange('constraint_type', e.target.value)}
                  label="Constraint Type"
                >
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="revolute">Revolute</MenuItem>
                  <MenuItem value="prismatic">Prismatic</MenuItem>
                  <MenuItem value="spring">Spring</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Constraint Properties */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Stiffness"
                value={formData.stiffness}
                onChange={(e) => handleChange('stiffness', parseFloat(e.target.value))}
                margin="normal"
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Damping"
                value={formData.damping}
                onChange={(e) => handleChange('damping', parseFloat(e.target.value))}
                margin="normal"
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            </Grid>

            {/* Length (for distance and spring constraints) */}
            {['distance', 'spring'].includes(formData.constraint_type) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Length"
                  value={formData.length}
                  onChange={(e) => handleChange('length', parseFloat(e.target.value))}
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            )}

            {/* Anchor Points */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Anchor Point A
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="X"
                    value={formData.anchor_a.x}
                    onChange={(e) => handleVectorChange('anchor_a', 'x', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Y"
                    value={formData.anchor_a.y}
                    onChange={(e) => handleVectorChange('anchor_a', 'y', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Anchor Point B
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="X"
                    value={formData.anchor_b.x}
                    onChange={(e) => handleVectorChange('anchor_b', 'x', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Y"
                    value={formData.anchor_b.y}
                    onChange={(e) => handleVectorChange('anchor_b', 'y', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Limits (for revolute and prismatic constraints) */}
            {['revolute', 'prismatic'].includes(formData.constraint_type) && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Limits
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Limit"
                      value={formData.min_limit || ''}
                      onChange={(e) => handleChange('min_limit', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Limit"
                      value={formData.max_limit || ''}
                      onChange={(e) => handleChange('max_limit', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            )}

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
        {constraintId && (
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

export default PhysicsConstraintEditor;

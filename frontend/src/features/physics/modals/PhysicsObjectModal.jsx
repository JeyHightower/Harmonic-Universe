import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControlLabel,
  Switch,
  FormHelperText,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
} from '@mui/material';
import {
  createPhysicsObject,
  deletePhysicsObject,
  updatePhysicsObject,
} from '../../../store/thunks/physicsObjectsThunks';
import PropTypes from 'prop-types';

/**
 * Default physics object properties
 */
const DEFAULT_PHYSICS_OBJECT = {
  name: '',
  mass: 1.0,
  is_static: false,
  is_trigger: false,
  collision_shape: 'box',
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  material_properties: {
    restitution: 0.7,
    friction: 0.3,
    density: 1.0,
  },
};

/**
 * Collision shape options for dropdown
 */
const COLLISION_SHAPE_OPTIONS = [
  { value: 'box', label: 'Box' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'cone', label: 'Cone' },
  { value: 'plane', label: 'Plane' },
];

/**
 * Physics Object Modal Component
 * 
 * A single component that handles creating, editing, viewing, and deleting physics objects
 * Replaces separate CreatePhysicsObjectModal, EditPhysicsObjectModal, etc.
 */
const PhysicsObjectModal = ({
  open,
  onClose,
  sceneId,
  objectId = null,
  initialData = null,
  mode = 'create', // 'create', 'edit', 'view', 'delete'
  onSuccess = null,
}) => {
  const dispatch = useDispatch();
  const { currentPhysicsObject, loading: storeLoading } = useSelector(
    state => state.physicsObjects
  );

  // Local state
  const [formData, setFormData] = useState({ ...DEFAULT_PHYSICS_OBJECT });
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Mode flags for readability
  const isViewMode = mode === 'view';
  const isDeleteMode = mode === 'delete';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isReadOnly = isViewMode || isDeleteMode;

  // Set modal title based on mode
  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'create':
        return 'Create New Physics Object';
      case 'edit':
        return 'Edit Physics Object';
      case 'view':
        return 'Physics Object Details';
      case 'delete':
        return 'Delete Physics Object';
      default:
        return 'Physics Object';
    }
  }, [mode]);

  // Initialize form values from props or Redux store
  useEffect(() => {
    if (!open) return;
    
    let initialFormData = { ...DEFAULT_PHYSICS_OBJECT };

    if (initialData) {
      initialFormData = { ...initialFormData, ...initialData };
    } else if (objectId && currentPhysicsObject?.id === objectId) {
      initialFormData = { ...initialFormData, ...currentPhysicsObject };
    }

    setFormData(initialFormData);
    setErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialData, objectId, currentPhysicsObject, open]);

  /**
   * Validate a single field
   */
  const validateField = (name, value) => {
    if (name === 'name' && !value.trim()) {
      return 'Name is required';
    }

    if (name === 'mass') {
      if (value < 0) {
        return 'Mass cannot be negative';
      }
      if (value === 0 && !formData.is_static) {
        return 'Dynamic objects must have mass greater than 0';
      }
    }

    if (name.includes('material_properties.restitution')) {
      if (value < 0 || value > 1) {
        return 'Restitution must be between 0 and 1';
      }
    }

    if (name.includes('material_properties.friction')) {
      if (value < 0) {
        return 'Friction cannot be negative';
      }
    }

    return null;
  };

  /**
   * Validate the entire form
   */
  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.mass < 0) {
      newErrors.mass = 'Mass cannot be negative';
    }

    if (formData.mass === 0 && !formData.is_static) {
      newErrors.mass = 'Dynamic objects must have mass greater than 0';
    }

    // Material properties validation
    const { restitution, friction, density } = formData.material_properties;

    if (restitution < 0 || restitution > 1) {
      newErrors['material_properties.restitution'] =
        'Restitution must be between 0 and 1';
    }

    if (friction < 0) {
      newErrors['material_properties.friction'] = 'Friction cannot be negative';
    }

    if (density < 0) {
      newErrors['material_properties.density'] = 'Density cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form field changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));

      // If setting is_static to true, also update mass to 0
      if (name === 'is_static' && checked) {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          mass: 0
        }));
      }

      // Clear field error when changing
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return;
    }

    // Handle numeric inputs
    if (type === 'number') {
      const numericValue = parseFloat(value);
      
      setFormData(prev => {
        const newFormData = { ...prev };
        
        // Handle nested properties (e.g., position.x)
        if (name.includes('.')) {
          const [object, property] = name.split('.');
          newFormData[object] = {
            ...newFormData[object],
            [property]: numericValue
          };
        } 
        // Handle material properties (e.g., material_properties.restitution)
        else if (name.includes('material_properties.')) {
          const property = name.replace('material_properties.', '');
          newFormData.material_properties = {
            ...newFormData.material_properties,
            [property]: numericValue
          };
        } 
        // Handle regular properties
        else {
          newFormData[name] = numericValue;
        }
        
        return newFormData;
      });
    } 
    // Handle text and other inputs
    else {
      setFormData(prev => {
        const newFormData = { ...prev };
        
        // Handle nested properties
        if (name.includes('.')) {
          const [object, property] = name.split('.');
          newFormData[object] = {
            ...newFormData[object],
            [property]: value
          };
        } else {
          newFormData[name] = value;
        }
        
        return newFormData;
      });
    }
    
    // Validate field and update errors
    const fieldError = validateField(name, value);
    if (fieldError) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    } else if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Don't submit in view or delete mode
    if (isReadOnly) {
      onClose();
      return;
    }
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      let result;
      
      // Create or update based on mode
      if (isCreateMode) {
        result = await dispatch(createPhysicsObject({
          sceneId,
          physicsObject: formData
        })).unwrap();
        
        setSuccessMessage('Physics object created successfully');
      } else if (isEditMode) {
        result = await dispatch(updatePhysicsObject({
          objectId,
          sceneId,
          physicsObject: formData
        })).unwrap();
        
        setSuccessMessage('Physics object updated successfully');
      }
      
      // Call success callback with result
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Close modal after short delay to show success message
      window.setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving physics object:', error);
      setErrorMessage(error.message || 'An error occurred saving the physics object');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle object deletion
   */
  const handleDelete = async () => {
    if (!objectId) {
      setErrorMessage('Cannot delete: Missing object ID');
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      await dispatch(deletePhysicsObject({
        objectId,
        sceneId
      })).unwrap();
      
      setSuccessMessage('Physics object deleted successfully');
      
      // Call success callback
      if (onSuccess) {
        onSuccess({ id: objectId }, 'delete');
      }
      
      // Close modal after short delay
      window.setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error deleting physics object:', error);
      setErrorMessage(error.message || 'An error occurred deleting the physics object');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change active tab
   */
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Render form content
   */
  const renderFormContent = () => (
    <>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="physics object tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label="Basic" value="basic" />
        <Tab label="Position & Scale" value="transform" />
        <Tab label="Physics" value="physics" />
      </Tabs>

      {activeTab === 'basic' && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_static}
                  onChange={handleInputChange}
                  name="is_static"
                  disabled={isReadOnly}
                />
              }
              label="Static Object"
            />
            <FormHelperText>
              Static objects don&apos;t move but affect other objects
            </FormHelperText>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_trigger}
                  onChange={handleInputChange}
                  name="is_trigger"
                  disabled={isReadOnly}
                />
              }
              label="Trigger"
            />
            <FormHelperText>
              Triggers detect collisions but don&apos;t physically interact
            </FormHelperText>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={isReadOnly}>
              <InputLabel>Collision Shape</InputLabel>
              <Select
                name="collision_shape"
                value={formData.collision_shape}
                onChange={handleInputChange}
                label="Collision Shape"
              >
                {COLLISION_SHAPE_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                The shape used for physics collision detection
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {activeTab === 'transform' && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Position
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="X"
              name="position.x"
              type="number"
              value={formData.position.x}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Y"
              name="position.y"
              type="number"
              value={formData.position.y}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Z"
              name="position.z"
              type="number"
              value={formData.position.z}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Scale
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="X"
              name="scale.x"
              type="number"
              value={formData.scale.x}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Y"
              name="scale.y"
              type="number"
              value={formData.scale.y}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Z"
              name="scale.z"
              type="number"
              value={formData.scale.z}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Rotation (Degrees)
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="X"
              name="rotation.x"
              type="number"
              value={formData.rotation.x}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Y"
              name="rotation.y"
              type="number"
              value={formData.rotation.y}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Z"
              name="rotation.z"
              type="number"
              value={formData.rotation.z}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
        </Grid>
      )}

      {activeTab === 'physics' && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Mass"
              name="mass"
              type="number"
              value={formData.mass}
              onChange={handleInputChange}
              fullWidth
              disabled={isReadOnly || formData.is_static}
              error={!!errors.mass}
              helperText={
                errors.mass || (formData.is_static ? 'Static objects have zero mass' : '')
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Material Properties
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Restitution"
              name="material_properties.restitution"
              type="number"
              value={formData.material_properties.restitution}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ min: 0, max: 1, step: 0.1 }}
              disabled={isReadOnly}
              error={!!errors['material_properties.restitution']}
              helperText={
                errors['material_properties.restitution'] || 
                'How bouncy (0-1)'
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Friction"
              name="material_properties.friction"
              type="number"
              value={formData.material_properties.friction}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
              disabled={isReadOnly}
              error={!!errors['material_properties.friction']}
              helperText={
                errors['material_properties.friction'] || 
                'Resistance to sliding'
              }
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Density"
              name="material_properties.density"
              type="number"
              value={formData.material_properties.density}
              onChange={handleInputChange}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
              disabled={isReadOnly}
              error={!!errors['material_properties.density']}
              helperText={
                errors['material_properties.density'] || 
                'Mass per volume unit'
              }
            />
          </Grid>
        </Grid>
      )}
    </>
  );

  /**
   * Render delete confirmation
   */
  const renderDeleteContent = () => (
    <Box sx={{ py: 1 }}>
      <Typography variant="body1" gutterBottom>
        Are you sure you want to delete this physics object?
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Name: <strong>{formData.name}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Type: {formData.is_static ? 'Static' : 'Dynamic'} {formData.collision_shape}
      </Typography>
      <Typography variant="body2" color="error" sx={{ mt: 2 }}>
        This action cannot be undone. All associated data will be permanently deleted.
      </Typography>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{modalTitle}</DialogTitle>
      
      <DialogContent dividers>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {loading || storeLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : isDeleteMode ? (
          renderDeleteContent()
        ) : (
          renderFormContent()
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        
        {isDeleteMode ? (
          <Button 
            onClick={handleDelete} 
            disabled={loading}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (isViewMode && !isEditMode)}
            color="primary"
            variant="contained"
          >
            {isViewMode ? 'Close' : isEditMode ? 'Update' : 'Create'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

PhysicsObjectModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sceneId: PropTypes.string.isRequired,
  objectId: PropTypes.string,
  initialData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  onSuccess: PropTypes.func
};

export default PhysicsObjectModal; 
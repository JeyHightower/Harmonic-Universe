import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createPhysicsObject,
  deletePhysicsObject,
  updatePhysicsObject,
} from '../../store/thunks/physicsObjectsThunks';
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
 * Consolidated Physics Object Modal Component
 * 
 * A single component that handles creating, editing, viewing, and deleting physics objects
 * Replaces separate CreatePhysicsObjectModal, EditPhysicsObjectModal, etc.
 */
const PhysicsObjectModalComponent = ({
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
   * Handle form input changes
   */
  const handleChange = (name, value) => {
    // Special case for is_static changing
    if (name === 'is_static' && value === true) {
      // If making an object static, set mass to 0
      setFormData(prev => ({
        ...prev,
        [name]: value,
        mass: 0,
      }));
      return;
    }

    // For nested properties like position.x
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Validate the field
    const errorMessage = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  // Handle form field changes 
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    handleChange(name, fieldValue);
  };

  // Handle number input changes with validation for numerical values
  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      handleChange(name, numValue);
    } else if (value === '') {
      // Allow empty string for numeric fields to enable user to clear and type
      handleChange(name, 0);
    }
  };

  // Handle Vector3 input changes (position, rotation, scale, velocity)
  const handleVector3Change = (baseName, axis, value) => {
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      const fieldName = `${baseName}.${axis}`;
      handleChange(fieldName, numValue);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (isReadOnly) {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        scene_id: sceneId,
      };

      // Call appropriate action based on mode
      let response;
      if (isCreateMode) {
        response = await dispatch(createPhysicsObject(submitData)).unwrap();
        setSuccessMessage('Physics object created successfully');
      } else if (isEditMode) {
        response = await dispatch(updatePhysicsObject({ 
          id: objectId,
          ...submitData
        })).unwrap();
        setSuccessMessage('Physics object updated successfully');
      } else if (isDeleteMode) {
        await dispatch(deletePhysicsObject(objectId)).unwrap();
        setSuccessMessage('Physics object deleted successfully');
      }

      // Call onSuccess handler if provided
      if (onSuccess) {
        onSuccess(response);
      }

      // Close modal after success (with a small delay to show success message)
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error in physics object operation:', error);
      setErrorMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render a Vector3 input group (position, rotation, scale, velocity)
   */
  const renderVector3Input = (label, baseName, vector = { x: 0, y: 0, z: 0 }, readOnly = false) => {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>{label}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              name={`${baseName}.x`}
              label="X"
              type="number"
              fullWidth
              size="small"
              value={vector?.x ?? 0}
              onChange={(e) => handleVector3Change(baseName, 'x', e.target.value)}
              disabled={readOnly}
              error={!!errors[`${baseName}.x`]}
              helperText={errors[`${baseName}.x`]}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              name={`${baseName}.y`}
              label="Y"
              type="number"
              fullWidth
              size="small"
              value={vector?.y ?? 0}
              onChange={(e) => handleVector3Change(baseName, 'y', e.target.value)}
              disabled={readOnly}
              error={!!errors[`${baseName}.y`]}
              helperText={errors[`${baseName}.y`]}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              name={`${baseName}.z`}
              label="Z"
              type="number"
              fullWidth
              size="small"
              value={vector?.z ?? 0}
              onChange={(e) => handleVector3Change(baseName, 'z', e.target.value)}
              disabled={readOnly}
              error={!!errors[`${baseName}.z`]}
              helperText={errors[`${baseName}.z`]}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  /**
   * Render material properties inputs
   */
  const renderMaterialProperties = () => {
    const { material_properties = {} } = formData;
    
    return (
      <Box sx={{ p: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Restitution"
              name="material_properties.restitution"
              type="number"
              value={material_properties.restitution ?? 0.7}
              onChange={handleNumberInputChange}
              disabled={isReadOnly}
              error={!!errors['material_properties.restitution']}
              helperText={errors['material_properties.restitution'] || 'Bounciness (0-1)'}
              inputProps={{ step: 0.1, min: 0, max: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Friction"
              name="material_properties.friction"
              type="number"
              value={material_properties.friction ?? 0.3}
              onChange={handleNumberInputChange}
              disabled={isReadOnly}
              error={!!errors['material_properties.friction']}
              helperText={errors['material_properties.friction'] || 'Surface friction'}
              inputProps={{ step: 0.1, min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Density"
              name="material_properties.density"
              type="number"
              value={material_properties.density ?? 1.0}
              onChange={handleNumberInputChange}
              disabled={isReadOnly}
              error={!!errors['material_properties.density']}
              helperText={errors['material_properties.density'] || 'Material density'}
              inputProps={{ step: 0.1, min: 0 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="md"
      fullWidth
      aria-labelledby="physics-object-modal-title"
    >
      <DialogTitle id="physics-object-modal-title">
        {modalTitle}
      </DialogTitle>
      
      <DialogContent>
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
        
        {isDeleteMode ? (
          <Box sx={{ py: 2 }}>
            <Typography>
              Are you sure you want to delete this physics object?
              {formData.name && (
                <Box component="span" fontWeight="bold"> "{formData.name}"</Box>
              )}
            </Typography>
            <Typography color="warning.main" sx={{ mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                aria-label="physics object tabs"
              >
                <Tab label="Basic" value="basic" />
                <Tab label="Transform" value="transform" />
                <Tab label="Physics" value="physics" />
              </Tabs>
            </Box>
            
            {activeTab === 'basic' && (
              <Box>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  margin="normal"
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="collision-shape-label">Collision Shape</InputLabel>
                  <Select
                    labelId="collision-shape-label"
                    name="collision_shape"
                    value={formData.collision_shape}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    label="Collision Shape"
                  >
                    {COLLISION_SHAPE_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="is_static"
                        checked={formData.is_static}
                        onChange={handleInputChange}
                        disabled={isReadOnly}
                      />
                    }
                    label="Static Object"
                  />
                  <FormHelperText>
                    Static objects don't move and have infinite mass
                  </FormHelperText>
                </Box>
                
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="is_trigger"
                        checked={formData.is_trigger}
                        onChange={handleInputChange}
                        disabled={isReadOnly}
                      />
                    }
                    label="Trigger Volume"
                  />
                  <FormHelperText>
                    Triggers detect collisions but don't create physical responses
                  </FormHelperText>
                </Box>
              </Box>
            )}
            
            {activeTab === 'transform' && (
              <Box>
                {renderVector3Input('Position', 'position', formData.position, isReadOnly)}
                {renderVector3Input('Rotation', 'rotation', formData.rotation, isReadOnly)}
                {renderVector3Input('Scale', 'scale', formData.scale, isReadOnly)}
              </Box>
            )}
            
            {activeTab === 'physics' && (
              <Box>
                <TextField
                  fullWidth
                  label="Mass"
                  name="mass"
                  type="number"
                  value={formData.mass}
                  onChange={handleNumberInputChange}
                  disabled={isReadOnly || formData.is_static}
                  error={!!errors.mass}
                  helperText={
                    errors.mass || 
                    (formData.is_static 
                      ? 'Static objects have infinite mass' 
                      : 'Mass affects how the object responds to forces')
                  }
                  inputProps={{ step: 0.1, min: 0 }}
                  margin="normal"
                />
                
                {renderVector3Input('Initial Velocity', 'velocity', formData.velocity, isReadOnly)}
                
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Material Properties
                </Typography>
                {renderMaterialProperties()}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          {isViewMode ? 'Close' : 'Cancel'}
        </Button>
        
        {!isViewMode && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color={isDeleteMode ? 'error' : 'primary'}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isCreateMode ? (
              'Create'
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Delete'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PhysicsObjectModalComponent; 
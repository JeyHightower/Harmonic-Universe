import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { createUniverse, updateUniverse } from '../../store/thunks/universeThunks';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxWidth: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflow: 'auto'
};

/**
 * Consolidated Universe Modal Component
 * 
 * A single component that handles creating, editing, and viewing universes
 * Replaces separate CreateUniverseModal, EditUniverseModal, and UniverseModal components
 */
const UniverseModalComponent = ({
  open,
  onClose,
  mode = 'create', // 'create', 'edit', or 'view'
  universe = null,
  onSuccess = null
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    theme: '',
    is_public: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Initialize form data from universe prop when in edit or view mode
  useEffect(() => {
    if (universe && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: universe.name || '',
        description: universe.description || '',
        genre: universe.genre || '',
        theme: universe.theme || '',
        is_public: universe.is_public || false
      });
    } else if (mode === 'create') {
      // Reset form when in create mode
      setFormData({
        name: '',
        description: '',
        genre: '',
        theme: '',
        is_public: false
      });
    }
  }, [universe, mode, open]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'create') {
        await dispatch(createUniverse(formData)).unwrap();
        if (onSuccess) onSuccess('create');
      } else if (mode === 'edit' && universe) {
        await dispatch(updateUniverse({ id: universe.id, ...formData })).unwrap();
        if (onSuccess) onSuccess('edit');
      }
      onClose();
    } catch (err) {
      console.error('Error in UniverseModalComponent:', err);
      setError(err.message || 'An error occurred with the universe operation');
    } finally {
      setLoading(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Universe';
      case 'edit':
        return 'Edit Universe';
      case 'view':
        return 'Universe Details';
      default:
        return 'Universe';
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={!loading ? onClose : undefined}
      aria-labelledby="universe-modal-title"
    >
      <Box sx={modalStyle}>
        <Typography id="universe-modal-title" variant="h5" component="h2" gutterBottom>
          {getModalTitle()}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={mode === 'view' || loading}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={mode === 'view' || loading}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                multiline
                rows={4}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                disabled={mode === 'view' || loading}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                disabled={mode === 'view' || loading}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="public-label">Public Status</InputLabel>
                <Select
                  labelId="public-label"
                  name="is_public"
                  value={formData.is_public}
                  onChange={handleChange}
                  disabled={mode === 'view' || loading}
                  label="Public Status"
                >
                  <MenuItem value={false}>Private</MenuItem>
                  <MenuItem value={true}>Public</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.is_public 
                    ? 'This universe will be visible to others' 
                    : 'Only you can see this universe'}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={onClose} 
              disabled={loading}
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            
            {mode !== 'view' && (
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : mode === 'create' ? 'Create' : 'Save Changes'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default UniverseModalComponent; 
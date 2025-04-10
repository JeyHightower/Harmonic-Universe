import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  Alert,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Autocomplete
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import apiClient from '../../services/api';
import { addScene } from '../../store/slices/scenesSlice';
import { updateScene, deleteScene } from '../../store/thunks/consolidated/scenesThunks';
import { formatDate } from '../../utils/dateUtils';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  maxWidth: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflow: 'auto'
};

/**
 * Consolidated Scene Modal Component
 * 
 * A single component that handles creating, editing, viewing, and deleting scenes
 * Replaces separate SceneModalHandler, SceneForm, SceneDeleteConfirmation, and SceneViewer components
 */
const SceneModalComponent = ({
  open,
  onClose,
  mode = 'create', // 'create', 'edit', 'view', or 'delete'
  universeId,
  sceneId,
  initialData = null,
  onSuccess = null
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    summary: '',
    content: '',
    notes: '',
    location: '',
    scene_type: 'default',
    time_of_day: '',
    status: 'draft',
    significance: 'minor',
    character_ids: [],
    order: 0,
    date_of_scene: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [characters, setCharacters] = useState([]);
  
  // Default image for scenes that don't have an image
  const defaultImage = "/images/default-scene.jpg";
  
  // Initialize form data from initialData prop when in edit, view, or delete mode
  useEffect(() => {
    if (initialData && (mode === 'edit' || mode === 'view' || mode === 'delete')) {
      setFormData({
        name: initialData.name || initialData.title || '',
        description: initialData.description || '',
        summary: initialData.summary || '',
        content: initialData.content || '',
        notes: initialData.notes || '',
        location: initialData.location || '',
        scene_type: initialData.scene_type || 'default',
        time_of_day: initialData.time_of_day || initialData.timeOfDay || '',
        status: initialData.status || 'draft',
        significance: initialData.significance || 'minor',
        character_ids: initialData.character_ids || initialData.characterIds || [],
        order: initialData.order || 0,
        date_of_scene: initialData.date_of_scene || initialData.dateOfScene 
          ? dayjs(initialData.date_of_scene || initialData.dateOfScene) 
          : null
      });
    } else if (mode === 'create') {
      // Reset form when in create mode
      setFormData({
        name: '',
        description: '',
        summary: '',
        content: '',
        notes: '',
        location: '',
        scene_type: 'default',
        time_of_day: '',
        status: 'draft',
        significance: 'minor',
        character_ids: [],
        order: 0,
        date_of_scene: null
      });
    }
  }, [initialData, mode, open]);
  
  // Load scene data if we have a sceneId but no initialData
  useEffect(() => {
    if (sceneId && !initialData && (mode === 'edit' || mode === 'view' || mode === 'delete')) {
      const loadSceneData = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await apiClient.getScene(sceneId);
          const sceneData = response.data?.scene || response.data;

          if (sceneData) {
            setFormData({
              name: sceneData.name || sceneData.title || '',
              description: sceneData.description || '',
              summary: sceneData.summary || '',
              content: sceneData.content || '',
              notes: sceneData.notes || '',
              location: sceneData.location || '',
              scene_type: sceneData.scene_type || 'default',
              time_of_day: sceneData.time_of_day || sceneData.timeOfDay || '',
              status: sceneData.status || 'draft',
              significance: sceneData.significance || 'minor',
              character_ids: sceneData.character_ids || sceneData.characterIds || [],
              order: sceneData.order || 0,
              date_of_scene: sceneData.date_of_scene || sceneData.dateOfScene 
                ? dayjs(sceneData.date_of_scene || sceneData.dateOfScene) 
                : null
            });
          }
        } catch (error) {
          console.error("Error loading scene data:", error);
          setError("Failed to load scene data. Please try refreshing the page.");
        } finally {
          setLoading(false);
        }
      };

      loadSceneData();
    }
  }, [sceneId, initialData, mode]);
  
  // Load characters for the universe
  useEffect(() => {
    if (universeId && (mode === 'create' || mode === 'edit')) {
      const fetchCharacters = async () => {
        try {
          const response = await apiClient.getCharactersByUniverse(universeId);
          const charactersData = response.data?.characters || response.data || [];
          setCharacters(charactersData);
        } catch (error) {
          console.error("Error fetching characters:", error);
          // We don't set error here as it's not critical for the form
        }
      };

      fetchCharacters();
    }
  }, [universeId, mode]);

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
  
  // Handle date picker change
  const handleDateChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      date_of_scene: newValue
    }));
  };
  
  // Handle character selection change
  const handleCharacterChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      character_ids: newValue.map(char => char.id)
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.summary.trim()) {
      errors.summary = 'Summary is required';
    }
    
    if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }
    
    if (formData.summary && formData.summary.length > 500) {
      errors.summary = 'Summary must be less than 500 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for create and edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'create') {
        // Prepare scene data
        const sceneData = {
          ...formData,
          universe_id: universeId,
          date_of_scene: formData.date_of_scene ? formData.date_of_scene.toISOString() : null
        };
        
        const response = await apiClient.createScene(sceneData);
        const newScene = response.data?.scene || response.data;
        
        // Add to Redux store
        dispatch(addScene(newScene));
        
        // Call success callback
        if (onSuccess) {
          onSuccess('create', newScene);
        }
        
        onClose();
      } else if (mode === 'edit' && (sceneId || initialData?.id)) {
        // Prepare scene data
        const sceneData = {
          ...formData,
          id: sceneId || initialData.id,
          universe_id: universeId || initialData.universe_id,
          date_of_scene: formData.date_of_scene ? formData.date_of_scene.toISOString() : null
        };
        
        const response = await apiClient.updateScene(sceneData.id, sceneData);
        const updatedScene = response.data?.scene || response.data;
        
        // Update in Redux store
        dispatch(updateScene(updatedScene));
        
        // Call success callback
        if (onSuccess) {
          onSuccess('edit', updatedScene);
        }
        
        onClose();
      }
    } catch (err) {
      console.error('Error in SceneModalComponent:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred with the scene operation');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      const id = sceneId || initialData?.id;
      
      // Call API to delete the scene
      await apiClient.deleteScene(id);
      
      // Remove from Redux store
      dispatch(deleteScene(id));

      // Call success callback
      if (onSuccess) {
        onSuccess('delete', { id });
      }
      
      onClose();
    } catch (error) {
      console.error("Error deleting scene:", error);
      setError("Failed to delete scene. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Scene';
      case 'edit':
        return 'Edit Scene';
      case 'view':
        return 'Scene Details';
      case 'delete':
        return 'Delete Scene';
      default:
        return 'Scene';
    }
  };
  
  // Format the scene type for display
  const getSceneTypeDisplay = (type) => {
    if (!type) return "Default";

    // Convert camelCase or snake_case to Title Case with spaces
    return type
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Determine scene type color
  const getSceneTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "introduction":
        return "primary";
      case "transition":
        return "warning";
      case "climax":
        return "error";
      case "resolution":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={!loading ? onClose : undefined}
      aria-labelledby="scene-modal-title"
    >
      <Box sx={modalStyle}>
        <Typography id="scene-modal-title" variant="h5" component="h2" gutterBottom>
          {getModalTitle()}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {mode === 'view' && (
          <Card sx={{ mb: 3 }}>
            {initialData?.image_url && (
              <CardMedia
                component="img"
                height="200"
                image={initialData.image_url || defaultImage}
                alt={formData.name}
                onError={(e) => {
                  e.target.src = defaultImage;
                }}
              />
            )}
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                {formData.name}
              </Typography>
              
              <Chip 
                label={getSceneTypeDisplay(formData.scene_type)}
                color={getSceneTypeColor(formData.scene_type)}
                size="small"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" paragraph>
                {formData.description || "No description provided."}
              </Typography>
              
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2" paragraph>
                {formData.summary || "No summary provided."}
              </Typography>
              
              {formData.content && (
                <>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Content
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {formData.content}
                  </Typography>
                </>
              )}
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Location" 
                        secondary={formData.location || "Not specified"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Time of Day" 
                        secondary={formData.time_of_day || "Not specified"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Status" 
                        secondary={formData.status || "Draft"}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Significance" 
                        secondary={formData.significance || "Minor"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Date" 
                        secondary={formData.date_of_scene ? formatDate(formData.date_of_scene) : "Not specified"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Order" 
                        secondary={formData.order || 0}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                {formData.character_ids?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      Characters
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.character_ids.map(id => {
                        const character = characters.find(c => c.id === id);
                        return (
                          <Chip 
                            key={id}
                            label={character?.name || `Character #${id}`}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
            <CardActions>
              <Button onClick={onClose}>Close</Button>
              <Button 
                startIcon={<EditIcon />}
                color="primary"
                onClick={() => {
                  // To transition to edit mode, we would need the parent component to handle this
                  if (onSuccess) {
                    onSuccess('view-to-edit', initialData || { id: sceneId });
                  }
                  onClose();
                }}
              >
                Edit
              </Button>
            </CardActions>
          </Card>
        )}
        
        {mode === 'delete' && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to delete the scene <strong>{formData.name}</strong>?
              This action cannot be undone. All data associated with this scene will be permanently deleted.
            </Alert>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDelete}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                Delete Scene
              </Button>
            </Box>
          </Box>
        )}
        
        {(mode === 'create' || mode === 'edit') && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  required
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="scene-type-label">Scene Type</InputLabel>
                  <Select
                    labelId="scene-type-label"
                    name="scene_type"
                    value={formData.scene_type}
                    onChange={handleChange}
                    disabled={loading}
                    label="Scene Type"
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="introduction">Introduction</MenuItem>
                    <MenuItem value="rising_action">Rising Action</MenuItem>
                    <MenuItem value="climax">Climax</MenuItem>
                    <MenuItem value="falling_action">Falling Action</MenuItem>
                    <MenuItem value="resolution">Resolution</MenuItem>
                    <MenuItem value="transition">Transition</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  disabled={loading}
                  error={!!validationErrors.summary}
                  helperText={validationErrors.summary}
                  required
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  disabled={loading}
                  margin="normal"
                  multiline
                  rows={6}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={loading}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Time of Day"
                  name="time_of_day"
                  value={formData.time_of_day}
                  onChange={handleChange}
                  disabled={loading}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="complete">Complete</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="significance-label">Significance</InputLabel>
                  <Select
                    labelId="significance-label"
                    name="significance"
                    value={formData.significance}
                    onChange={handleChange}
                    disabled={loading}
                    label="Significance"
                  >
                    <MenuItem value="minor">Minor</MenuItem>
                    <MenuItem value="important">Important</MenuItem>
                    <MenuItem value="major">Major</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Date of Scene"
                  value={formData.date_of_scene}
                  onChange={handleDateChange}
                  disabled={loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal"
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Order"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  disabled={loading}
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={loading}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={characters}
                  getOptionLabel={(option) => option.name}
                  value={characters.filter(char => formData.character_ids.includes(char.id))}
                  onChange={handleCharacterChange}
                  disabled={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Characters"
                      margin="normal"
                    />
                  )}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={onClose}
                disabled={loading}
                startIcon={<ArrowBackIcon />}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {mode === 'create' ? 'Create Scene' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

SceneModalComponent.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  onSuccess: PropTypes.func
};

export default SceneModalComponent; 
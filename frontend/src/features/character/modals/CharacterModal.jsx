import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { openModal } from '../../../store/slices/newModalSlice';
import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
} from '../../../store/thunks/characterThunks';
import { fetchScenes } from '../../../store/thunks/scenesThunks';
import { cache } from '../../../utils';
import { getCharacterWithRetry } from '../../../utils/apiUtils';

// Cache constants for characters and scenes
const CHARACTER_CACHE_KEY = 'character_cache';
const CHARACTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const SCENE_CACHE_KEY = 'scene_cache';
const SCENE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Cache helper functions for backward compatibility
const getCachedCharacter = (characterId) => {
  return cache.get(`${CHARACTER_CACHE_KEY}_${characterId}`);
};

const cacheCharacter = (characterId, data) => {
  cache.set(`${CHARACTER_CACHE_KEY}_${characterId}`, data, CHARACTER_CACHE_TTL);
};

const getCachedScenes = (universeId) => {
  return cache.get(`${SCENE_CACHE_KEY}_${universeId}`);
};

const cacheScenes = (universeId, scenesData) => {
  cache.set(`${SCENE_CACHE_KEY}_${universeId}`, scenesData, SCENE_CACHE_TTL);
};

/**
 * Character Modal Component
 *
 * A single component for creating, editing, viewing and deleting characters.
 * Replaces the consolidated CharacterFormModalComponent with a more modular approach.
 */
const CharacterModal = ({
  open,
  onClose,
  characterId = null,
  universeId,
  sceneId,
  mode = 'create', // "create", "edit", "view", "delete"
  onSuccess,
  availableScenes = [],
}) => {
  // Redux
  const dispatch = useDispatch();

  // State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scene_id: '',
    universe_id: universeId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [scenes, setScenes] = useState(availableScenes);
  const [sceneOptions, setSceneOptions] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [scenesLoading, setScenesLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Refs
  const timeoutIdRef = useRef(null);
  const loadedUniverseRef = useRef(new Set());

  // Mode flags for readability
  const isViewMode = mode === 'view';
  const isDeleteMode = mode === 'delete';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isReadOnly = isViewMode || isDeleteMode;

  // Helper function to validate scene_id against available scenes
  const getValidSceneId = (sceneIdToValidate, availableScenesList) => {
    if (!sceneIdToValidate || !availableScenesList || availableScenesList.length === 0) {
      return '';
    }

    const sceneIdStr = String(sceneIdToValidate);
    const sceneExists = availableScenesList.some((scene) => String(scene.id) === sceneIdStr);

    if (sceneExists) {
      return sceneIdStr;
    } else {
      console.log(
        `Scene ID ${sceneIdStr} not found in available scenes, using first available scene`
      );
      return availableScenesList.length > 0 ? String(availableScenesList[0].id) : '';
    }
  };

  // Initialize sceneId from props when component mounts
  useEffect(() => {
    if (open && sceneId && !formData.scene_id) {
      const validSceneId = getValidSceneId(sceneId, scenes);
      if (validSceneId) {
        console.log('Setting initial scene_id from props:', validSceneId);
        setFormData((prev) => ({
          ...prev,
          scene_id: validSceneId,
        }));
      }
    }
  }, [open, sceneId, scenes, formData.scene_id]);

  // Helper function to filter scenes by universe
  const filterScenesByUniverse = (scenes, targetUniverseId) => {
    if (!targetUniverseId || !Array.isArray(scenes)) {
      return [];
    }

    // Convert to string for consistent comparison
    const universeIdStr = String(targetUniverseId);

    const filteredScenes = scenes.filter((scene) => {
      if (!scene) return false;

      // Handle both string and number IDs for comparison
      const sceneUniverseId = scene.universe_id !== undefined ? String(scene.universe_id) : null;
      return sceneUniverseId === universeIdStr;
    });

    console.log(`Found ${filteredScenes.length} scenes matching universe ${targetUniverseId}`);
    return filteredScenes;
  };

  // Update sceneOptions whenever universeId or scenes change
  useEffect(() => {
    if (open && universeId && scenes.length > 0) {
      const filteredScenes = filterScenesByUniverse(scenes, universeId);
      setSceneOptions(filteredScenes);

      // If no scene is selected but we have scenes, select the first one
      if (!formData.scene_id && filteredScenes.length > 0) {
        setFormData((prev) => ({
          ...prev,
          scene_id: String(filteredScenes[0].id),
        }));
      }
    } else {
      // If no universe is selected, clear scene options
      setSceneOptions([]);
    }
  }, [open, universeId, scenes, formData.scene_id]);

  // Use availableScenes when provided
  useEffect(() => {
    if (open && availableScenes.length > 0) {
      console.log('Using provided scenes:', availableScenes);
      setScenes(availableScenes);
      setSceneOptions(availableScenes);

      // Validate the current scene_id against the updated scenes list
      const validSceneId = getValidSceneId(formData.scene_id, availableScenes);

      // Only update if it's different to avoid infinite loops
      if (validSceneId !== formData.scene_id) {
        console.log('Updating scene_id after validation:', validSceneId);
        setFormData((prev) => ({
          ...prev,
          scene_id: validSceneId,
        }));
      }
    }
  }, [open, availableScenes, formData.scene_id]);

  // Load character data when characterId changes
  useEffect(() => {
    if (open && characterId && (isEditMode || isViewMode || isDeleteMode)) {
      const loadCharacter = async () => {
        try {
          setLoading(true);
          setError(null);

          // Try to get from cache first
          const cachedCharacterData = getCachedCharacter(characterId);
          if (cachedCharacterData) {
            console.log('Using cached character data for:', characterId);
            processCharacterData(cachedCharacterData);
            return;
          }

          // If not in cache, fetch from API
          const result = await getCharacterWithRetry(characterId, 2);
          if (result && !result.error) {
            const characterData = result.data || result;
            processCharacterData(characterData);
            // Cache the result
            cacheCharacter(characterId, characterData);
          } else {
            throw new Error(result?.error?.message || 'Failed to load character data');
          }
        } catch (err) {
          console.error('Error loading character:', err);
          setError(`Failed to load character data: ${err.message || 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      };

      const processCharacterData = (characterData) => {
        if (!characterData) {
          setError('No character data available');
          return;
        }

        console.log('Processing character data:', characterData);
        setCharacter(characterData);

        // Extract needed properties
        const {
          name = '',
          description = '',
          scene_id = '',
          universe_id = universeId || '',
        } = characterData;

        // Update form data
        setFormData({
          name,
          description,
          scene_id: scene_id ? String(scene_id) : '',
          universe_id: universe_id ? String(universe_id) : '',
        });

        // Load scenes for this character's universe if needed
        if (universe_id && !scenes.length) {
          loadScenesForUniverse(universe_id);
        }
      };

      loadCharacter();
    } else if (open && isCreateMode) {
      // For create mode, initialize with empty form
      setFormData({
        name: '',
        description: '',
        scene_id: sceneId ? String(sceneId) : '',
        universe_id: universeId ? String(universeId) : '',
      });
      setCharacter(null);
      setError(null);
    }
  }, [
    open,
    characterId,
    mode,
    universeId,
    sceneId,
    isEditMode,
    isViewMode,
    isDeleteMode,
    isCreateMode,
    scenes.length,
  ]);

  // Load scenes when universeId changes or on initial mount
  useEffect(() => {
    if (
      open &&
      universeId &&
      !scenesLoading &&
      !loadedUniverseRef.current.has(universeId) &&
      sceneOptions.length === 0
    ) {
      const loadScenes = async () => {
        await loadScenesForUniverse(universeId);
      };

      loadScenes();
    }
  }, [open, universeId, sceneOptions.length, scenesLoading]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      timeoutIdRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [successMessage]);

  // Update universeId in formData when prop changes
  useEffect(() => {
    if (universeId) {
      setFormData((prev) => ({
        ...prev,
        universe_id: String(universeId),
      }));
    }
  }, [universeId]);

  // Function to load scenes for a specific universe
  const loadScenesForUniverse = async (targetUniverseId) => {
    if (!targetUniverseId || loadedUniverseRef.current.has(targetUniverseId)) {
      return;
    }

    try {
      setScenesLoading(true);

      // Try to get from cache first
      const cachedScenes = getCachedScenes(targetUniverseId);
      if (cachedScenes && Array.isArray(cachedScenes)) {
        console.log('Using cached scenes for universe:', targetUniverseId);
        setScenes(cachedScenes);
        loadedUniverseRef.current.add(targetUniverseId);
        return;
      }

      console.log('Loading scenes for universe:', targetUniverseId);
      const result = await dispatch(fetchScenes(targetUniverseId));

      if (result.type.endsWith('/fulfilled')) {
        const loadedScenes = result.payload?.scenes || [];
        console.log(`Loaded ${loadedScenes.length} scenes for universe:`, targetUniverseId);

        // Update scenes list and mark this universe as loaded
        setScenes(loadedScenes);
        loadedUniverseRef.current.add(targetUniverseId);

        // Cache the result
        cacheScenes(targetUniverseId, loadedScenes);

        // After loading scenes, validate the current scene_id
        if (formData.scene_id) {
          const validSceneId = getValidSceneId(formData.scene_id, loadedScenes);
          if (validSceneId !== formData.scene_id) {
            console.log('Updating scene_id after loading scenes:', validSceneId);
            setFormData((prev) => ({
              ...prev,
              scene_id: validSceneId,
            }));
          }
        }
        // If no scene is selected but we have scenes, select the first one
        else if (loadedScenes.length > 0) {
          console.log('No scene selected, selecting first scene:', loadedScenes[0].id);
          setFormData((prev) => ({
            ...prev,
            scene_id: String(loadedScenes[0].id),
          }));
        }
      } else {
        console.error('Failed to load scenes:', result.error);
      }
    } catch (err) {
      console.error('Error loading scenes:', err);
    } finally {
      setScenesLoading(false);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error for this field if any
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }

    // Special handling for universe_id changes
    if (name === 'universe_id' && value) {
      loadScenesForUniverse(value);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (isCreateMode && !formData.scene_id) {
      errors.scene_id = 'Scene is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (isDeleteMode) {
      try {
        setLoading(true);
        setError(null);

        await dispatch(deleteCharacter(characterId));

        setSuccessMessage('Character deleted successfully');
        if (onSuccess) {
          onSuccess({ id: characterId, deleted: true });
        }
        onClose();
      } catch (err) {
        console.error('Error deleting character:', err);
        setError(`Failed to delete character: ${err.message || 'Please try again later'}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For create/edit, validate the form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare data
      const characterData = {
        ...formData,
        scene_id: formData.scene_id,
        universe_id: formData.universe_id || universeId,
      };

      let result;
      if (isCreateMode) {
        result = await dispatch(createCharacter(characterData));
      } else if (isEditMode) {
        result = await dispatch(updateCharacter({ id: characterId, ...characterData }));
      }

      if (result && (result.type.endsWith('/fulfilled') || result.payload)) {
        const resultData = result.payload || {};
        setSuccessMessage(`Character ${isCreateMode ? 'created' : 'updated'} successfully`);

        if (onSuccess) {
          onSuccess(resultData);
        }
        onClose();
      } else {
        throw new Error(result?.error?.message || 'Failed to save character');
      }
    } catch (err) {
      console.error('Error saving character:', err);
      setError(`Failed to save character: ${err.message || 'Please try again later'}`);
    } finally {
      setLoading(false);
    }
  };

  // Modal title based on mode
  const getModalTitle = () => {
    if (isCreateMode) {
      return 'Create Character';
    } else if (isEditMode) {
      return 'Edit Character';
    } else if (isViewMode) {
      return character?.name || 'Character Details';
    } else if (isDeleteMode) {
      return 'Delete Character';
    }
    return 'Character';
  };

  // Open the create scene modal
  const handleCreateScene = () => {
    // First close this modal
    onClose();

    // Then open the scene creation modal
    dispatch(
      openModal({
        type: MODAL_TYPES.SCENE_FORM,
        props: {
          universeId: universeId,
          modalType: 'create',
          onSuccess: (newScene) => {
            console.log('Scene created:', newScene);
            // Re-open this modal
            dispatch(
              openModal({
                type: MODAL_TYPES.CHARACTER_FORM,
                props: {
                  characterId,
                  universeId,
                  sceneId: newScene.id,
                  mode,
                  onSuccess,
                },
              })
            );
          },
        },
      })
    );
  };

  // Scene selector with the option to create a new scene
  const renderSceneSelector = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={9}>
            <FormControl fullWidth error={!!formErrors.scene_id}>
              <InputLabel>Scene</InputLabel>
              <Select
                name="scene_id"
                value={formData.scene_id || ''}
                onChange={handleChange}
                disabled={loading || !universeId || scenesLoading}
                label="Scene"
              >
                {sceneOptions.length > 0 ? (
                  sceneOptions.map((scene) => (
                    <MenuItem key={scene.id} value={String(scene.id)}>
                      {scene.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No scenes available</MenuItem>
                )}
              </Select>
              {formErrors.scene_id && <FormHelperText>{formErrors.scene_id}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCreateScene}
              disabled={loading || !universeId}
            >
              New Scene
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      hideBackdrop={true}
    >
      <DialogTitle>{getModalTitle()}</DialogTitle>

      <DialogContent>
        {loading && !character && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* For delete mode */}
        {isDeleteMode ? (
          <Box sx={{ my: 2 }}>
            <Typography variant="body1">
              Are you sure you want to delete this character?
              {character?.name && (
                <Box component="span" fontWeight="bold">
                  {' '}
                  "{character.name}"
                </Box>
              )}
            </Typography>
            <Typography color="warning.main" sx={{ mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </Box>
        ) : (
          <Box component="form" noValidate>
            <TextField
              fullWidth
              margin="normal"
              label="Name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              disabled={loading || isReadOnly}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required={!isReadOnly}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              multiline
              rows={4}
              disabled={loading || isReadOnly}
            />

            {/* Show scene selector for both create and edit modes */}
            {(isCreateMode || isEditMode) && renderSceneSelector()}

            {/* Only show this non-editable field in view mode */}
            {isViewMode && (
              <TextField
                fullWidth
                margin="normal"
                label="Scene"
                name="scene_display"
                value={
                  scenes.find((s) => String(s.id) === String(formData.scene_id))?.name ||
                  'Scene not found'
                }
                disabled={true}
              />
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {isViewMode ? 'Close' : 'Cancel'}
        </Button>

        {!isViewMode && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={isDeleteMode ? 'error' : 'primary'}
            disabled={
              loading || (isCreateMode && (!formData.scene_id || sceneOptions.length === 0))
            }
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : isCreateMode ? (
              'Create'
            ) : isEditMode ? (
              'Save'
            ) : (
              'Delete'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

CharacterModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  characterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']),
  onSuccess: PropTypes.func,
  availableScenes: PropTypes.array,
};

export default CharacterModal;

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Grid
} from "@mui/material";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import apiClient from "../../services/api";
import { fetchScenes } from "../../store/thunks/consolidated/scenesThunks";
import { openModal } from "../../store/slices/modalSlice";
import { MODAL_TYPES } from "../../constants/modalTypes";
import { getCharacterWithRetry } from "../../utils/apiUtils";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "../../store/thunks/characterThunks";
import { cache } from "../../utils";

// Cache constants for characters and scenes
const CHARACTER_CACHE_KEY = "character_cache";
const CHARACTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const SCENE_CACHE_KEY = "scene_cache";
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
 * Consolidated Character Form Modal Component
 * 
 * A single component for creating, editing, viewing and deleting characters.
 * Replaces the original CharacterFormModal with a more maintainable implementation.
 */
const CharacterFormModalComponent = ({
  open,
  onClose,
  characterId = null,
  universeId,
  sceneId,
  mode = "create", // "create", "edit", "view", "delete"
  onSuccess,
  availableScenes = [],
}) => {
  // Redux
  const dispatch = useDispatch();
  
  // State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scene_id: "",
    universe_id: universeId || "",
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
    if (
      !sceneIdToValidate ||
      !availableScenesList ||
      availableScenesList.length === 0
    ) {
      return "";
    }

    const sceneIdStr = String(sceneIdToValidate);
    const sceneExists = availableScenesList.some(
      (scene) => String(scene.id) === sceneIdStr
    );

    if (sceneExists) {
      return sceneIdStr;
    } else {
      console.log(
        `Scene ID ${sceneIdStr} not found in available scenes, using first available scene`
      );
      return availableScenesList.length > 0
        ? String(availableScenesList[0].id)
        : "";
    }
  };

  // Initialize sceneId from props when component mounts
  useEffect(() => {
    if (open && sceneId && !formData.scene_id) {
      const validSceneId = getValidSceneId(sceneId, scenes);
      if (validSceneId) {
        console.log("Setting initial scene_id from props:", validSceneId);
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
      const sceneUniverseId =
        scene.universe_id !== undefined ? String(scene.universe_id) : null;
      return sceneUniverseId === universeIdStr;
    });

    console.log(
      `Found ${filteredScenes.length} scenes matching universe ${targetUniverseId}`
    );
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
      console.log("Using provided scenes:", availableScenes);
      setScenes(availableScenes);
      setSceneOptions(availableScenes);

      // Validate the current scene_id against the updated scenes list
      const validSceneId = getValidSceneId(formData.scene_id, availableScenes);

      // Only update if it's different to avoid infinite loops
      if (validSceneId !== formData.scene_id) {
        console.log("Updating scene_id after validation:", validSceneId);
        setFormData((prev) => ({
          ...prev,
          scene_id: validSceneId,
        }));
      }
    }
  }, [open, availableScenes, formData.scene_id]);

  // Fetch scenes for universe if needed
  useEffect(() => {
    if (!open || !universeId || loadedUniverseRef.current.has(universeId)) {
      return;
    }

    // Check if we already have appropriate scenes
    if (
      scenes.length > 0 &&
      scenes.some((scene) => String(scene.universe_id) === String(universeId))
    ) {
      console.log(
        `Already have scenes for universe ${universeId}, skipping fetch`
      );
      loadedUniverseRef.current.add(universeId);
      return;
    }

    // Fetch scenes for the selected universe
    setScenesLoading(true);
    console.log(`Fetching scenes for universeId: ${universeId}`);
    
    // Check cache first
    const cachedScenes = getCachedScenes(universeId);
    if (cachedScenes) {
      console.log(`Using ${cachedScenes.length} cached scenes for universe ${universeId}`);
      setScenes(cachedScenes);
      setSceneOptions(cachedScenes);
      setScenesLoading(false);
      loadedUniverseRef.current.add(universeId);
      return;
    }
    
    // Fetch from API
    apiClient
      .getScenes({ universeId: universeId })
      .then((response) => {
        const scenesData = response.data?.scenes || [];
        console.log(
          `Fetched ${scenesData.length} scenes for universe ${universeId}`
        );
        setScenes(scenesData);
        setSceneOptions(scenesData);
        
        // Cache the scenes for future use
        cacheScenes(universeId, scenesData);
        
        loadedUniverseRef.current.add(universeId);
      })
      .catch((error) => {
        console.error("Error fetching scenes:", error);
        setError("Failed to load scenes");
      })
      .finally(() => {
        setScenesLoading(false);
      });
  }, [open, universeId, scenes]);

  // Load character data for edit/view/delete modes
  useEffect(() => {
    if (!open || !characterId || !(isEditMode || isViewMode || isDeleteMode)) {
      return;
    }

    setLoading(true);
    setError(null);

    // Helper function to process character data
    const processCharacterData = (characterData) => {
      // Ensure we have a valid character object
      if (!characterData) {
        console.error("No character data to process");
        setError("Failed to load character data");
        setLoading(false);
        return;
      }

      // Store the complete character object
      setCharacter(characterData);

      // Get scene_id from character data or validate against available scenes
      const characterSceneId = characterData?.scene_id
        ? String(characterData.scene_id)
        : "";

      // Store the universe_id from the character data if available
      const characterUniverseId = characterData?.universe_id;

      // If we have a universe_id from the character but no scenes loaded yet, load them
      if (
        characterUniverseId &&
        !loadedUniverseRef.current.has(characterUniverseId)
      ) {
        // Load scenes for the character's universe
        loadScenesForUniverse(characterUniverseId);
      }

      const validSceneId = getValidSceneId(characterSceneId, scenes);

      // Set form data
      setFormData({
        name: characterData?.name || "",
        description: characterData?.description || "",
        scene_id: validSceneId,
        universe_id: characterData?.universe_id || universeId,
      });

      // Cache the character data for future use
      cacheCharacter(characterId, characterData);
      
      setLoading(false);
    };

    // Check cache first
    const cachedCharacter = getCachedCharacter(characterId);
    if (cachedCharacter) {
      // Use cached data
      console.log("Using cached character data");
      processCharacterData(cachedCharacter);
      return;
    }

    // Fetch character data
    getCharacterWithRetry(characterId)
      .then((data) => {
        // Extract character data - handle both response formats
        const characterData = data.character || data;
        processCharacterData(characterData);
      })
      .catch((retryError) => {
        console.error(
          "Retry utility failed, falling back to standard API:",
          retryError
        );

        // Fall back to regular API call
        apiClient
          .getCharacter(characterId)
          .then((response) => {
            const characterData = response.data.character;
            processCharacterData(characterData);
          })
          .catch((err) => {
            console.error(
              "Error fetching character (both methods failed):",
              err
            );
            setError(
              err.response?.data?.error ||
                "Failed to load character details. Please try again."
            );

            // Set minimal default data so the form isn't completely empty
            setFormData({
              name: "",
              description: "",
              scene_id: getValidSceneId("", scenes),
              universe_id: universeId,
            });

            setLoading(false);
          });
      });
  }, [open, characterId, mode, scenes, universeId, isEditMode, isViewMode, isDeleteMode]);

  // Reset form data when opening the modal for character creation
  useEffect(() => {
    if (open && isCreateMode && !characterId) {
      console.log("Resetting form data for new character creation");

      // Keep the existing scene_id if it's already set and valid
      const validSceneId = getValidSceneId(formData.scene_id, scenes);

      setFormData({
        name: "",
        description: "",
        scene_id: validSceneId,
        universe_id: universeId,
      });

      setCharacter(null);
      setError(null);
      setSuccessMessage(null);
    }
  }, [open, mode, characterId, scenes, universeId, isCreateMode]);

  // Reset loaded universes when the modal closes
  useEffect(() => {
    if (!open) {
      // Clear the tracked universes when the modal closes
      loadedUniverseRef.current.clear();
    }
  }, [open]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // Helper function to load scenes for a universe
  const loadScenesForUniverse = async (targetUniverseId) => {
    if (!targetUniverseId || loadedUniverseRef.current.has(targetUniverseId)) {
      return;
    }

    setScenesLoading(true);
    loadedUniverseRef.current.add(targetUniverseId);
    
    // Check cache first
    const cachedScenes = getCachedScenes(targetUniverseId);
    if (cachedScenes) {
      console.log(`Using ${cachedScenes.length} cached scenes for universe ${targetUniverseId}`);
      setScenes(cachedScenes);
      setSceneOptions(cachedScenes);
      setScenesLoading(false);
      return;
    }

    // Set a timeout to prevent hanging UI
    timeoutIdRef.current = setTimeout(() => {
      if (scenesLoading) {
        setScenesLoading(false);
        setFormErrors((prev) => ({
          ...prev,
          scene_id: "Loading scenes timed out. Please try again later.",
        }));
      }
    }, 10000); // 10 second timeout

    try {
      const response = await apiClient.getScenes({ universeId: targetUniverseId });
      let scenesData = [];

      // Try different possible data structures
      if (Array.isArray(response.data)) {
        scenesData = response.data;
      } else if (response.data && response.data.scenes && Array.isArray(response.data.scenes)) {
        scenesData = response.data.scenes;
      }

      if (scenesData.length > 0) {
        setScenes(scenesData);
        setSceneOptions(scenesData);
        cacheScenes(targetUniverseId, scenesData);
      } else {
        // Fallback to Redux thunk
        dispatch(fetchScenes(targetUniverseId))
          .unwrap()
          .then((result) => {
            const reduxScenes = result.scenes || [];
            if (reduxScenes.length > 0) {
              setScenes(reduxScenes);
              setSceneOptions(reduxScenes);
              cacheScenes(targetUniverseId, reduxScenes);
            }
          });
      }
    } catch (error) {
      console.error("Error loading scenes:", error);
      // Fallback to Redux thunk on API error
      dispatch(fetchScenes(targetUniverseId))
        .unwrap()
        .then((result) => {
          const fallbackScenes = result.scenes || [];
          if (fallbackScenes.length > 0) {
            setScenes(fallbackScenes);
            setSceneOptions(fallbackScenes);
            cacheScenes(targetUniverseId, fallbackScenes);
          }
        })
        .catch(() => {
          setError("Failed to load scenes");
        });
    } finally {
      setScenesLoading(false);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for scene_id to ensure it updates correctly
    if (name === "scene_id") {
      console.log(`Scene selection changed to ID:`, value);

      // Clear any scene_id error when the user selects a valid scene
      if (value) {
        setFormErrors((prev) => ({
          ...prev,
          scene_id: undefined,
        }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Character name is required";
    }
    
    if (!formData.scene_id) {
      errors.scene_id = "Please select a scene for the character";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isReadOnly) {
      onClose();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      let result;
      
      if (isCreateMode) {
        const data = {
          ...formData,
          universe_id: universeId,
        };
        
        result = await dispatch(createCharacter(data)).unwrap();
        setSuccessMessage("Character created successfully");
      } else if (isEditMode && characterId) {
        const data = {
          ...formData,
          universe_id: character?.universe_id || universeId,
        };
        
        result = await dispatch(
          updateCharacter({ characterId, characterData: data })
        ).unwrap();
        setSuccessMessage("Character updated successfully");
      } else if (isDeleteMode && characterId) {
        await dispatch(deleteCharacter(characterId)).unwrap();
        setSuccessMessage("Character deleted successfully");
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Close modal after a delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error submitting character form:", err);
      setError(
        err.response?.data?.error ||
        err.message ||
        "An error occurred while processing your request"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Create Character";
      case "edit":
        return "Edit Character";
      case "view":
        return character?.name
          ? `Character: ${character.name}`
          : "View Character";
      case "delete":
        return "Delete Character";
      default:
        return "Character";
    }
  };

  // Function to create a new scene if none exists
  const handleCreateScene = () => {
    if (!universeId) return;

    // Open the scene creation modal via redux
    dispatch(
      openModal({
        type: MODAL_TYPES.SCENE_FORM,
        props: {
          universeId: universeId,
          onSuccess: (newScene) => {
            console.log("New scene created:", newScene);
            // Add the new scene to our local state
            const updatedScenes = [...scenes, newScene];
            setScenes(updatedScenes);
            setSceneOptions(updatedScenes);

            // Set the new scene as selected
            setFormData((prev) => ({
              ...prev,
              scene_id: String(newScene.id),
            }));
          },
        },
      })
    );
  };

  // Render the dropdown for selecting a scene
  const renderSceneSelector = () => {
    return (
      <>
        <FormControl fullWidth margin="normal" error={!!formErrors.scene_id}>
          <InputLabel id="scene-select-label">Scene</InputLabel>
          <Select
            labelId="scene-select-label"
            id="scene_id"
            name="scene_id"
            value={formData.scene_id || ""}
            onChange={handleChange}
            label="Scene"
            displayEmpty
            disabled={!universeId || scenesLoading || isReadOnly}
          >
            <MenuItem value="" disabled>
              {scenesLoading ? "Loading scenes..." : "Select a scene"}
            </MenuItem>

            {sceneOptions.length > 0 ? (
              sceneOptions.map((scene) =>
                scene && scene.id ? (
                  <MenuItem key={scene.id} value={String(scene.id)}>
                    {scene.name || "Unnamed scene"}
                  </MenuItem>
                ) : null
              )
            ) : (
              <MenuItem value="" disabled>
                {universeId
                  ? "No scenes available. Please create a scene first."
                  : "Please select a universe first"}
              </MenuItem>
            )}
          </Select>

          {formErrors.scene_id && (
            <FormHelperText error>{formErrors.scene_id}</FormHelperText>
          )}
        </FormControl>

        {sceneOptions.length === 0 && universeId && !scenesLoading && !isReadOnly && (
          <Box mt={1} sx={{ textAlign: "center", py: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              No scenes found for this universe.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              You need to create at least one scene before adding characters.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleCreateScene}
            >
              Create Scene
            </Button>
          </Box>
        )}
      </>
    );
  };

  // Loading state
  if (loading && (isEditMode || isViewMode || isDeleteMode) && !character) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{getModalTitle()}</DialogTitle>
        <DialogContent
          sx={{
            minHeight: "300px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{getModalTitle()}</DialogTitle>
      
      <DialogContent>
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
        
        {isDeleteMode ? (
          <Box sx={{ py: 2 }}>
            <Typography>
              Are you sure you want to delete this character?
              {character?.name && (
                <Box component="span" fontWeight="bold"> "{character.name}"</Box>
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
              value={formData.name || ""}
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
              value={formData.description || ""}
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
                  scenes.find(
                    (s) => String(s.id) === String(formData.scene_id)
                  )?.name || "Scene not found"
                }
                disabled={true}
              />
            )}
          </Box>
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
            color={isDeleteMode ? "error" : "primary"}
            disabled={
              loading ||
              (isCreateMode && 
                (!formData.scene_id || sceneOptions.length === 0))
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

CharacterFormModalComponent.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  characterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mode: PropTypes.oneOf(["create", "edit", "view", "delete"]),
  onSuccess: PropTypes.func,
  availableScenes: PropTypes.array,
};

export default CharacterFormModalComponent; 
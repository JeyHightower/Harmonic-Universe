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
} from "@mui/material";
import apiClient from "../../services/api";
import { useDispatch } from "react-redux";
import "../character/Characters.css";
import PropTypes from "prop-types";
import { fetchScenes } from "../../store/thunks/consolidated/scenesThunks";
import { openModal } from "../../store/slices/modalSlice";
import { MODAL_TYPES } from "../../constants/modalTypes";
import { getCharacterWithRetry } from "../../utils/apiUtils";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "../../store/thunks/characterThunks";

// Import local storage utilities for caching
const CHARACTER_CACHE_KEY = "character_cache";
const CHARACTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Add scene caching
const SCENE_CACHE_KEY = "scene_cache";
const SCENE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Helper function to get cached character data
const getCachedCharacter = (characterId) => {
  try {
    const cacheString = localStorage.getItem(CHARACTER_CACHE_KEY);
    if (!cacheString) return null;

    const cache = JSON.parse(cacheString);
    const now = Date.now();

    // Check if we have this character in cache and it's not expired
    if (cache[characterId] && cache[characterId].expires > now) {
      console.log(`Using cached character data for id: ${characterId}`);
      return cache[characterId].data;
    }

    return null;
  } catch (error) {
    console.error("Error reading from character cache:", error);
    return null;
  }
};

// Helper function to cache character data
const cacheCharacter = (characterId, data) => {
  try {
    const cacheString = localStorage.getItem(CHARACTER_CACHE_KEY);
    const cache = cacheString ? JSON.parse(cacheString) : {};

    // Add or update the character in cache with expiration
    cache[characterId] = {
      data,
      expires: Date.now() + CHARACTER_CACHE_TTL,
    };

    // Clean up expired entries
    Object.keys(cache).forEach((key) => {
      if (cache[key].expires < Date.now()) {
        delete cache[key];
      }
    });

    localStorage.setItem(CHARACTER_CACHE_KEY, JSON.stringify(cache));
    console.log(`Cached character data for id: ${characterId}`);
  } catch (error) {
    console.error("Error writing to character cache:", error);
  }
};

// Helper function to get cached scenes data by universe ID
const getCachedScenes = (universeId) => {
  try {
    const cacheString = localStorage.getItem(SCENE_CACHE_KEY);
    if (!cacheString) return null;

    const cache = JSON.parse(cacheString);
    const now = Date.now();

    // Check if we have scenes for this universe in cache and they're not expired
    if (cache[universeId] && cache[universeId].expires > now) {
      console.log(`Using cached scenes for universe id: ${universeId}`);
      return cache[universeId].data;
    }

    return null;
  } catch (error) {
    console.error("Error reading from scene cache:", error);
    return null;
  }
};

// Helper function to cache scenes data
const cacheScenes = (universeId, scenesData) => {
  try {
    const cacheString = localStorage.getItem(SCENE_CACHE_KEY);
    const cache = cacheString ? JSON.parse(cacheString) : {};

    // Add or update the scenes in cache with expiration
    cache[universeId] = {
      data: scenesData,
      expires: Date.now() + SCENE_CACHE_TTL,
    };

    // Clean up expired entries
    Object.keys(cache).forEach((key) => {
      if (cache[key].expires < Date.now()) {
        delete cache[key];
      }
    });

    localStorage.setItem(SCENE_CACHE_KEY, JSON.stringify(cache));
    console.log(
      `Cached ${scenesData.length} scenes for universe id: ${universeId}`
    );
  } catch (error) {
    console.error("Error writing to scene cache:", error);
  }
};

const CharacterFormModal = ({
  isOpen,
  onClose,
  characterId = null,
  universeId,
  sceneId,
  type = "create",
  onSuccess,
  availableScenes = [],
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scene_id: "", // Initialize as empty string to avoid undefined issues
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [scenes, setScenes] = useState(availableScenes);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [sceneOptions, setSceneOptions] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [scenesLoading, setScenesLoading] = useState(false);

  // Add a ref to store the timeout ID so it persists between renders
  const timeoutIdRef = useRef(null);
  // Add a ref to track which universes we've already loaded scenes for
  const loadedUniverseRef = useRef(new Set());

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

  // Initialize sceneId from props when component mounts - do this only once
  useEffect(() => {
    if (sceneId && !formData.scene_id) {
      const validSceneId = getValidSceneId(sceneId, scenes);
      if (validSceneId) {
        console.log("Setting initial scene_id from props:", validSceneId);
        setFormData((prev) => ({
          ...prev,
          scene_id: validSceneId,
        }));
      }
    }
  }, [sceneId, scenes, formData.scene_id]);

  // Update sceneOptions whenever scenes change
  useEffect(() => {
    if (scenes && Array.isArray(scenes)) {
      console.log(`Setting sceneOptions from ${scenes.length} scenes`);
      setSceneOptions(scenes);
    }
  }, [scenes]);

  // Use availableScenes when provided
  useEffect(() => {
    if (availableScenes.length > 0) {
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
  }, [availableScenes]);

  // Main useEffect that fetches scenes based on universeId
  useEffect(() => {
    if (universeId && !loadedUniverseRef.current.has(universeId)) {
      // Check if we already have appropriate scenes
      if (
        scenes.length > 0 &&
        scenes.some((scene) => scene.universe_id === universeId)
      ) {
        console.log(
          `Already have scenes for universe ${universeId}, skipping fetch`
        );
        loadedUniverseRef.current.add(universeId);
        return;
      }

      // Fetch scenes for the selected universe
      setScenesLoading(true);
      console.log(`Starting to fetch scenes for universeId: ${universeId}`);

      // Mark this universe as loaded to prevent repeated fetches
      loadedUniverseRef.current.add(universeId);

      // Check cache first
      const cachedScenes = getCachedScenes(universeId);
      if (cachedScenes) {
        // Use cached scenes
        console.log(
          `Using ${cachedScenes.length} cached scenes for universe ${universeId}`
        );
        setScenes(cachedScenes);
        setSceneOptions(cachedScenes);

        // Update form with first scene if needed
        if (!formData.scene_id && cachedScenes.length > 0) {
          setFormData((prev) => ({
            ...prev,
            scene_id: String(cachedScenes[0].id),
          }));
        }

        setScenesLoading(false);
        return;
      }

      // Add a timeout to prevent hanging UI if the API doesn't respond
      timeoutIdRef.current = setTimeout(() => {
        if (scenesLoading) {
          setScenesLoading(false);
          setFormErrors({
            ...formErrors,
            scene_id: "Loading scenes timed out. Please try again later.",
          });
        }
      }, 10000); // 10 second timeout

      // First try direct API call to get scenes
      apiClient
        .getScenes({ universeId: universeId })
        .then((response) => {
          console.log("Direct API scenes response:", response);
          let scenesData = [];

          // Try different possible data structures
          if (Array.isArray(response.data)) {
            scenesData = response.data;
          } else if (
            response.data &&
            response.data.scenes &&
            Array.isArray(response.data.scenes)
          ) {
            scenesData = response.data.scenes;
          } else if (response.data && typeof response.data === "object") {
            // If we have an object but not a clear scenes array, look for it
            const possibleArrays = Object.entries(response.data)
              .filter(([_, value]) => Array.isArray(value))
              .sort(([_, a], [__, b]) => b.length - a.length); // Sort by array length

            if (possibleArrays.length > 0) {
              console.log(
                `Found array in response.data.${possibleArrays[0][0]}`
              );
              scenesData = response.data[possibleArrays[0][0]];
            }
          }

          console.log("Processed scenes data:", scenesData);

          if (scenesData && scenesData.length > 0) {
            // We found scenes through direct API call
            setScenes(scenesData);
            setSceneOptions(scenesData);
            console.log(
              "Set scene options from direct API call:",
              scenesData.length
            );

            // Cache the scenes for future use
            cacheScenes(universeId, scenesData);

            // Update form with first scene if needed
            if (!formData.scene_id && scenesData.length > 0) {
              setFormData((prev) => ({
                ...prev,
                scene_id: String(scenesData[0].id),
              }));
            }
          } else {
            // If direct API call doesn't return scenes, try through Redux
            console.log("No scenes from direct API, trying Redux thunk");
            dispatch(fetchScenes(universeId))
              .unwrap()
              .then((result) => {
                console.log("Redux thunk scenes result:", result);
                let reduxScenes = result.scenes || [];

                if (Array.isArray(reduxScenes) && reduxScenes.length > 0) {
                  setScenes(reduxScenes);
                  setSceneOptions(reduxScenes);
                  console.log(
                    "Set scene options from Redux:",
                    reduxScenes.length
                  );

                  // Cache the scenes for future use
                  cacheScenes(universeId, reduxScenes);

                  // Update form with first scene if needed
                  if (!formData.scene_id && reduxScenes.length > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      scene_id: String(reduxScenes[0].id),
                    }));
                  }
                } else {
                  console.log("No scenes found from Redux thunk either");
                  setSceneOptions([]);
                }
              })
              .catch((error) => {
                console.error("Redux thunk error:", error);
                setSceneOptions([]);
              });
          }

          setScenesLoading(false);
          clearTimeout(timeoutIdRef.current);
        })
        .catch((error) => {
          console.error("Direct API error:", error);
          // Fallback to Redux thunk on API error
          dispatch(fetchScenes(universeId))
            .unwrap()
            .then((result) => {
              console.log("Fallback Redux scenes:", result);
              const fallbackScenes = result.scenes || [];
              if (Array.isArray(fallbackScenes) && fallbackScenes.length > 0) {
                setScenes(fallbackScenes);
                setSceneOptions(fallbackScenes);

                // Cache the scenes for future use
                cacheScenes(universeId, fallbackScenes);

                // Update form with first scene if needed
                if (!formData.scene_id && fallbackScenes.length > 0) {
                  setFormData((prev) => ({
                    ...prev,
                    scene_id: String(fallbackScenes[0].id),
                  }));
                }
              } else {
                setSceneOptions([]);
              }
            })
            .catch(() => {
              setSceneOptions([]);
            })
            .finally(() => {
              setScenesLoading(false);
              clearTimeout(timeoutIdRef.current);
            });
        });
    } else {
      if (!universeId) {
        console.log("No universeId provided, skipping scene fetch");
        setSceneOptions([]);
      } else {
        console.log(`Universe ${universeId} already loaded, skipping fetch`);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      // Clear any existing timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [universeId, dispatch, formData.scene_id]);

  useEffect(() => {
    if (isOpen && characterId && (type === "edit" || type === "view")) {
      setLoading(true);
      setError(null);

      // Helper function to process character data, centralized to avoid code duplication
      const processCharacterData = (characterData) => {
        setCharacter(characterData);

        // Get scene_id from character data or validate against available scenes
        const characterSceneId = characterData?.scene_id
          ? String(characterData.scene_id)
          : "";

        // Store the universe_id from the character data if available
        const characterUniverseId = characterData?.universe_id;

        // If we have a universe_id from the character but no scenes loaded yet, load them now
        // Only load scenes if we haven't already loaded them for this universe
        if (
          characterUniverseId &&
          (scenes.length === 0 || type === "edit") &&
          !loadedUniverseRef.current.has(characterUniverseId)
        ) {
          console.log(
            "Loading scenes for character's universe:",
            characterUniverseId
          );
          setScenesLoading(true);

          // Mark this universe as loaded to prevent repeated fetches
          loadedUniverseRef.current.add(characterUniverseId);

          // Store the existing scenes first to prevent UI flicker
          const existingScenes = [...scenes];

          // Only make one API call instead of potentially many redundant ones
          apiClient
            .getUniverseScenes(characterUniverseId)
            .then((scenesResponse) => {
              const scenesData = scenesResponse.data?.scenes || [];
              console.log(
                `Found ${scenesData.length} scenes for universe ${characterUniverseId}`
              );

              if (scenesData.length > 0) {
                setScenes(scenesData);
                setSceneOptions(scenesData);
              } else if (existingScenes.length > 0) {
                // If we got no scenes but had some before, keep the existing ones
                console.log("No new scenes found, keeping existing scenes");
                setScenes(existingScenes);
                setSceneOptions(existingScenes);
              }
              setScenesLoading(false);
            })
            .catch((err) => {
              console.error(
                `Error loading scenes for universe ${characterUniverseId}:`,
                err
              );
              // In case of error, keep existing scenes to prevent UI breakage
              if (existingScenes.length > 0) {
                setScenes(existingScenes);
                setSceneOptions(existingScenes);
              }
              setScenesLoading(false);
            });
        }

        const validSceneId = getValidSceneId(characterSceneId, scenes);

        // Use default empty values if data is missing
        setFormData({
          name: characterData?.name || "",
          description: characterData?.description || "",
          scene_id: validSceneId,
          // Store universe_id in form data to ensure it's available for updates
          universe_id: characterData?.universe_id || universeId,
        });

        // Cache the character data for future use
        cacheCharacter(characterId, characterData);
      };

      // Check cache first
      const cachedCharacter = getCachedCharacter(characterId);
      if (cachedCharacter) {
        // Use cached data
        console.log("Using cached character data");
        processCharacterData(cachedCharacter);
        setLoading(false);
        return;
      }

      // Try using the retry utility first
      getCharacterWithRetry(characterId)
        .then((data) => {
          // Extract character data - handle both response formats
          const characterData = data.character || data;
          console.log(
            "Character data received with retry utility:",
            characterData
          );
          processCharacterData(characterData);
          setLoading(false);
        })
        .catch((retryError) => {
          console.error(
            "Retry utility failed, falling back to standard API:",
            retryError
          );

          // Fall back to regular API call if retry utility fails for some reason
          apiClient
            .getCharacter(characterId)
            .then((response) => {
              console.log(
                "Character data received from fallback:",
                response.data
              );
              const characterData = response.data.character;
              processCharacterData(characterData);
              setLoading(false);
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
                universe_id: universeId, // Ensure universe_id is set
              });

              setLoading(false);
            });
        });
    }
  }, [isOpen, characterId, type, scenes, universeId]);

  // Reset form data when opening the modal for character creation
  useEffect(() => {
    if (isOpen && type === "create" && !characterId) {
      console.log(
        "Resetting form data for new character creation, current scene_id:",
        formData.scene_id
      );

      // Keep the existing scene_id if it's already set and valid
      const validSceneId = getValidSceneId(formData.scene_id, scenes);

      setFormData({
        name: "",
        description: "",
        scene_id: validSceneId,
        universe_id: universeId, // Ensure universe_id is set for new characters too
      });

      setCharacter(null);
      setError(null);
    }
  }, [isOpen, type, characterId, scenes, universeId]);

  // Reset loaded universes when the modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear the tracked universes when the modal closes
      loadedUniverseRef.current.clear();
    }
  }, [isOpen]);

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

      setFormData((prev) => {
        const updated = {
          ...prev,
          scene_id: value,
        };
        console.log(`Form data updated for ${name}:`, updated);
        return updated;
      });
      return;
    }

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      console.log(`Form data updated for ${name}:`, updated);
      return updated;
    });
  };

  // Custom close handler to reset form data
  const handleClose = () => {
    // Reset form data when closing
    setFormData({
      name: "",
      description: "",
      scene_id: getValidSceneId("", scenes),
    });
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === "create") {
        const data = {
          ...formData,
          universe_id: universeId,
        };

        // Use Redux thunk action
        try {
          // Use imported createCharacter thunk directly
          const newCharacter = await dispatch(createCharacter(data));
          console.log("Character created through Redux:", newCharacter);

          // Call onSuccess with the created character
          if (onSuccess) onSuccess(newCharacter);
        } catch (reduxError) {
          console.error("Error using Redux to create character:", reduxError);

          // Fallback to direct API call if Redux fails
          const response = await apiClient.createCharacter(data);
          if (onSuccess) onSuccess(response.data.character);
        }
      } else if (type === "edit" && characterId) {
        // Include universe_id when editing to prevent the warning
        const data = {
          ...formData,
          universe_id: character?.universe_id || universeId,
        };

        // Use Redux thunk action
        try {
          // Use imported updateCharacter thunk directly
          const updatedCharacter = await dispatch(
            updateCharacter(characterId, data)
          );
          console.log("Character updated through Redux:", updatedCharacter);

          // Call onSuccess with the updated character
          if (onSuccess) onSuccess(updatedCharacter);
        } catch (reduxError) {
          console.error("Error using Redux to update character:", reduxError);

          // Fallback to direct API call if Redux fails
          const response = await apiClient.updateCharacter(characterId, data);
          if (onSuccess) onSuccess(response.data.character);
        }
      } else if (type === "delete" && characterId) {
        // Use Redux thunk action
        try {
          // Use imported deleteCharacter thunk directly
          await dispatch(deleteCharacter(characterId));
          console.log("Character deleted through Redux");

          // Call onSuccess
          if (onSuccess) onSuccess();
        } catch (reduxError) {
          console.error("Error using Redux to delete character:", reduxError);

          // Fallback to direct API call if Redux fails
          await apiClient.deleteCharacter(characterId);
          if (onSuccess) onSuccess();
        }
      }

      handleClose(); // Use handleClose instead of onClose to properly reset the form
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "An error occurred while processing your request"
      );
      console.error("Error submitting character form:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get modal title based on type
  const getTitle = () => {
    switch (type) {
      case "create":
        return "Create Character";
      case "edit":
        return "Edit Character";
      case "view":
        return character?.name
          ? `View Character: ${character.name}`
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

  // Add handleCreateScene button to the UI
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
            disabled={!universeId || scenesLoading}
          >
            <MenuItem value="" disabled>
              {scenesLoading ? "Loading scenes..." : "Select a scene"}
            </MenuItem>

            {Array.isArray(sceneOptions) && sceneOptions.length > 0 ? (
              sceneOptions.map((scene) =>
                scene && scene.id ? (
                  <MenuItem key={scene.id} value={scene.id}>
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

        {sceneOptions.length === 0 && universeId && !scenesLoading && (
          <Box mt={1} sx={{ textAlign: "center", py: 1 }}>
            <Typography
              variant="subtitle2"
              color="primary"
              display="block"
              gutterBottom
            >
              No scenes found for this universe.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              display="block"
              gutterBottom
              sx={{ mb: 2 }}
            >
              You need to create at least one scene before adding characters.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleCreateScene}
              startIcon={<span>+</span>}
            >
              Create Scene
            </Button>
          </Box>
        )}
      </>
    );
  };

  if (loading && (type === "edit" || type === "view") && !character) {
    return (
      <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {type === "create" ? "Create " : type === "edit" ? "Edit " : "View "}
          Character
        </DialogTitle>
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
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="character-form-modal"
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Box mb={3}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}

          {type === "delete" ? (
            <Typography variant="body1">
              Are you sure you want to delete this character? This action cannot
              be undone.
            </Typography>
          ) : (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                disabled={loading || type === "view"}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required={type !== "view"}
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
                disabled={loading || type === "view"}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />

              {/* Show scene selector for both create and edit modes */}
              {(type === "create" || type === "edit") && renderSceneSelector()}

              {/* Only show this non-editable field in view mode */}
              {type === "view" && (
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
            </>
          )}
        </DialogContent>
        <DialogActions className="character-form-actions">
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {type !== "view" && (
            <Button
              type="submit"
              variant="contained"
              color={type === "delete" ? "error" : "primary"}
              disabled={
                loading ||
                (type === "create" &&
                  (!formData.scene_id || sceneOptions.length === 0))
              }
              title={
                type === "create" && sceneOptions.length === 0
                  ? "Please create a scene first"
                  : type === "create" && !formData.scene_id
                  ? "Please select a scene"
                  : ""
              }
            >
              {loading
                ? "Processing..."
                : type === "create"
                ? "Create"
                : type === "edit"
                ? "Save"
                : "Delete"}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

CharacterFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  characterId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  type: PropTypes.oneOf(["create", "edit", "view", "delete"]),
  onSuccess: PropTypes.func,
  availableScenes: PropTypes.array,
};

export default CharacterFormModal;

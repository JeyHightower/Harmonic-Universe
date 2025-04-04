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

  // Fetch scenes for the universe when the modal opens if availableScenes is empty
  useEffect(() => {
    if (
      isOpen &&
      universeId &&
      type === "create" &&
      availableScenes.length === 0
    ) {
      setLoadingScenes(true);
      console.log(`Fetching scenes for universe ${universeId}`);

      // Use a single robust approach to fetch scenes
      apiClient
        .getUniverseScenes(universeId)
        .then((response) => {
          console.log("Scenes API raw response:", response);

          // Extract scenes data with comprehensive error handling
          let scenesData = [];

          try {
            // Case 1: Direct array in data
            if (Array.isArray(response.data)) {
              console.log("Found scenes as direct array in response.data");
              scenesData = response.data;
            }
            // Case 2: Scenes array in data.scenes
            else if (
              response.data?.scenes &&
              Array.isArray(response.data.scenes)
            ) {
              console.log("Found scenes in response.data.scenes");
              scenesData = response.data.scenes;
            }
            // Case 3: Nested in universe object
            else if (
              response.data?.universe?.scenes &&
              Array.isArray(response.data.universe.scenes)
            ) {
              console.log("Found scenes in response.data.universe.scenes");
              scenesData = response.data.universe.scenes;
            }
            // Case 4: Search for any array in the response
            else if (response.data && typeof response.data === "object") {
              console.log(
                "Searching for scene arrays in response object properties"
              );
              for (const [key, value] of Object.entries(response.data)) {
                if (
                  Array.isArray(value) &&
                  value.length > 0 &&
                  value[0].universe_id
                ) {
                  console.log(`Found potential scenes array in data.${key}`);
                  scenesData = value;
                  break;
                }
              }
            }
          } catch (err) {
            console.error("Error extracting scenes data:", err);
          }

          console.log(
            `Found ${scenesData.length} scenes for universe ${universeId}:`,
            scenesData
          );

          // Try to get scenes from Redux store as fallback
          if (scenesData.length === 0) {
            console.log(
              "No scenes found in API response, checking Redux store"
            );
            dispatch(fetchScenes(universeId))
              .unwrap()
              .then((reduxResult) => {
                console.log("Redux store scenes result:", reduxResult);
                if (reduxResult.scenes && reduxResult.scenes.length > 0) {
                  scenesData = reduxResult.scenes;
                  console.log(
                    `Found ${scenesData.length} scenes in Redux store`
                  );
                  setScenes(scenesData);

                  // Update scene_id if we found valid scenes
                  const validSceneId = getValidSceneId(
                    formData.scene_id,
                    scenesData
                  );
                  if (validSceneId && validSceneId !== formData.scene_id) {
                    setFormData((prev) => ({
                      ...prev,
                      scene_id: validSceneId,
                    }));
                  }
                }

                // If we still have no scenes data, try a direct API call as a last resort
                if (
                  (!reduxResult || !reduxResult.length) &&
                  scenesData.length === 0
                ) {
                  console.log("Trying direct API call as final fallback");

                  // Try multiple potential endpoints
                  const fallbackEndpoints = [
                    `/api/universes/${universeId}/scenes`,
                    `/api/scenes?universe_id=${universeId}`,
                    `/api/scenes/universe/${universeId}`,
                  ];

                  // Try each endpoint in sequence
                  const tryNextEndpoint = (index) => {
                    if (index >= fallbackEndpoints.length) {
                      console.log("All fallback endpoints failed");
                      setScenes([]);
                      setLoadingScenes(false);
                      return;
                    }

                    const endpoint = fallbackEndpoints[index];
                    console.log(`Trying fallback endpoint: ${endpoint}`);

                    fetch(endpoint)
                      .then((res) => res.json())
                      .then((data) => {
                        console.log(
                          `Fallback endpoint ${endpoint} response:`,
                          data
                        );

                        // Try to extract scenes from the response
                        let extractedScenes = [];
                        if (Array.isArray(data)) {
                          extractedScenes = data;
                        } else if (data.scenes && Array.isArray(data.scenes)) {
                          extractedScenes = data.scenes;
                        } else if (data.data && Array.isArray(data.data)) {
                          extractedScenes = data.data;
                        }

                        if (extractedScenes.length > 0) {
                          console.log(
                            `Found ${extractedScenes.length} scenes using fallback`
                          );
                          setScenes(extractedScenes);
                          setLoadingScenes(false);
                        } else {
                          // Try next endpoint
                          tryNextEndpoint(index + 1);
                        }
                      })
                      .catch((err) => {
                        console.error(
                          `Fallback endpoint ${endpoint} failed:`,
                          err
                        );
                        tryNextEndpoint(index + 1);
                      });
                  };

                  // Start trying endpoints
                  tryNextEndpoint(0);
                } else {
                  // Update scene_id if we found valid scenes
                  if (scenesData.length > 0) {
                    const validSceneId = getValidSceneId(
                      formData.scene_id,
                      scenesData
                    );
                    if (validSceneId && validSceneId !== formData.scene_id) {
                      setFormData((prev) => ({
                        ...prev,
                        scene_id: validSceneId,
                      }));
                    }
                  }
                }
              })
              .catch((reduxError) => {
                console.error("Error fetching scenes from Redux:", reduxError);
              });
          }

          // Update UI state with found scenes
          setScenes(scenesData);

          // Update scene_id if we found valid scenes
          if (scenesData.length > 0) {
            const validSceneId = getValidSceneId(formData.scene_id, scenesData);
            if (validSceneId && validSceneId !== formData.scene_id) {
              setFormData((prev) => ({
                ...prev,
                scene_id: validSceneId,
              }));
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching scenes:", error);
          // Continue with empty scenes array
          setScenes([]);
        })
        .finally(() => {
          setLoadingScenes(false);
        });
    }
  }, [
    isOpen,
    universeId,
    type,
    availableScenes.length,
    dispatch,
    formData.scene_id,
  ]);

  useEffect(() => {
    if (isOpen && characterId && (type === "edit" || type === "view")) {
      setLoading(true);
      setError(null);

      apiClient
        .getCharacter(characterId)
        .then((response) => {
          console.log("Character data received:", response.data);
          const characterData = response.data.character;
          setCharacter(characterData);

          // Get scene_id from character data or validate against available scenes
          const characterSceneId = characterData?.scene_id
            ? String(characterData.scene_id)
            : "";

          const validSceneId = getValidSceneId(characterSceneId, scenes);

          // Use default empty values if data is missing
          setFormData({
            name: characterData?.name || "",
            description: characterData?.description || "",
            scene_id: validSceneId,
          });

          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching character:", err);
          setError(
            err.response?.data?.error ||
              "Failed to load character details. Please try again."
          );

          // Set minimal default data so the form isn't completely empty
          setFormData({
            name: "",
            description: "",
            scene_id: getValidSceneId("", scenes),
          });

          setLoading(false);
        });
    }
  }, [isOpen, characterId, type, scenes]);

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
      });

      setCharacter(null);
      setError(null);
    }
  }, [isOpen, type, characterId, scenes]);

  useEffect(() => {
    if (universeId) {
      // Fetch scenes for the selected universe
      setScenesLoading(true);
      console.log(
        "DEBUG: Starting to fetch scenes for universeId:",
        universeId
      );

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
          console.log("DEBUG: Direct API scenes response:", response);
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
                `DEBUG: Found array in response.data.${possibleArrays[0][0]}`
              );
              scenesData = response.data[possibleArrays[0][0]];
            }
          }

          console.log("DEBUG: Processed scenes data:", scenesData);

          if (scenesData && scenesData.length > 0) {
            // We found scenes through direct API call
            setScenes(scenesData);
            setSceneOptions(scenesData);
            console.log(
              "DEBUG: Set scene options from direct API call:",
              scenesData.length
            );

            // Update form with first scene if needed
            if (!formData.scene_id && scenesData.length > 0) {
              setFormData((prev) => ({
                ...prev,
                scene_id: String(scenesData[0].id),
              }));
            }
          } else {
            // If direct API call doesn't return scenes, try through Redux
            console.log("DEBUG: No scenes from direct API, trying Redux thunk");
            dispatch(fetchScenes(universeId))
              .unwrap()
              .then((result) => {
                console.log("DEBUG: Redux thunk scenes result:", result);
                let reduxScenes = result.scenes || [];

                if (Array.isArray(reduxScenes) && reduxScenes.length > 0) {
                  setScenes(reduxScenes);
                  setSceneOptions(reduxScenes);
                  console.log(
                    "DEBUG: Set scene options from Redux:",
                    reduxScenes.length
                  );

                  // Update form with first scene if needed
                  if (!formData.scene_id && reduxScenes.length > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      scene_id: String(reduxScenes[0].id),
                    }));
                  }
                } else {
                  console.log("DEBUG: No scenes found from Redux thunk either");
                  setSceneOptions([]);
                }
              })
              .catch((error) => {
                console.error("DEBUG: Redux thunk error:", error);
                setSceneOptions([]);
              });
          }

          setScenesLoading(false);
          clearTimeout(timeoutIdRef.current);
        })
        .catch((error) => {
          console.error("DEBUG: Direct API error:", error);
          // Fallback to Redux thunk on API error
          dispatch(fetchScenes(universeId))
            .unwrap()
            .then((result) => {
              console.log("DEBUG: Fallback Redux scenes:", result);
              const fallbackScenes = result.scenes || [];
              if (Array.isArray(fallbackScenes) && fallbackScenes.length > 0) {
                setScenes(fallbackScenes);
                setSceneOptions(fallbackScenes);

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
      console.log("DEBUG: No universeId provided, skipping scene fetch");
      setSceneOptions([]);
    }

    // Cleanup timeout on unmount
    return () => {
      // Clear any existing timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [universeId, dispatch]);

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

        const response = await apiClient.createCharacter(data);
        if (onSuccess) onSuccess(response.data.character);
      } else if (type === "edit" && characterId) {
        const response = await apiClient.updateCharacter(characterId, formData);
        if (onSuccess) onSuccess(response.data.character);
      } else if (type === "delete" && characterId) {
        await apiClient.deleteCharacter(characterId);
        if (onSuccess) onSuccess();
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

              {type === "create" && renderSceneSelector()}

              <TextField
                fullWidth
                margin="normal"
                label="Scene"
                name="scene_display"
                value={
                  scenes.find((s) => String(s.id) === String(formData.scene_id))
                    ?.name || "Scene not found"
                }
                disabled={true}
                sx={{ display: type !== "create" ? "block" : "none" }}
              />
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

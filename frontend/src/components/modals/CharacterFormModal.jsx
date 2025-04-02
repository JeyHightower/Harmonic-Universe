import React, { useState, useEffect } from "react";
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

  // Use availableScenes when provided
  useEffect(() => {
    if (availableScenes.length > 0) {
      console.log("Using provided scenes:", availableScenes);
      setScenes(availableScenes);

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

      // First try the getUniverseScenes method
      apiClient
        .getUniverseScenes(universeId)
        .then((response) => {
          console.log("getUniverseScenes API raw response:", response);
          console.log("getUniverseScenes API data:", response.data);

          // Try to extract scenes from different possible response formats
          let scenesData = [];
          if (Array.isArray(response.data)) {
            scenesData = response.data;
          } else if (
            response.data?.scenes &&
            Array.isArray(response.data.scenes)
          ) {
            scenesData = response.data.scenes;
          } else if (response.data?.universe?.scenes) {
            scenesData = response.data.universe.scenes;
          }

          console.log(
            "Scenes found (method 1):",
            scenesData.length,
            scenesData
          );

          if (scenesData.length === 0) {
            // Try the alternative method if no scenes found
            console.log(
              "No scenes found with getUniverseScenes, trying getScenes with universeId parameter"
            );
            return apiClient
              .getScenes({ universeId })
              .then((altResponse) => {
                let altScenesData = [];
                if (Array.isArray(altResponse.data)) {
                  altScenesData = altResponse.data;
                } else if (
                  altResponse.data?.scenes &&
                  Array.isArray(altResponse.data.scenes)
                ) {
                  altScenesData = altResponse.data.scenes;
                }

                if (altScenesData.length > 0) {
                  setScenes(altScenesData);
                  // Update with valid scene_id
                  const validSceneId = getValidSceneId(
                    formData.scene_id,
                    altScenesData
                  );
                  if (validSceneId !== formData.scene_id) {
                    setFormData((prev) => ({
                      ...prev,
                      scene_id: validSceneId,
                    }));
                  }
                }
              })
              .catch((altErr) => {
                // Gracefully handle error and continue
                console.error(
                  "Error fetching scenes with alternative method:",
                  altErr
                );
                // Just continue with empty scenes
              })
              .finally(() => {
                setLoadingScenes(false);
              });
          }

          if (scenesData.length > 0) {
            setScenes(scenesData);
            // Validate and update scene_id
            const validSceneId = getValidSceneId(formData.scene_id, scenesData);
            if (validSceneId !== formData.scene_id) {
              setFormData((prev) => ({
                ...prev,
                scene_id: validSceneId,
              }));
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching scenes with getUniverseScenes:", err);

          // If first method fails, try the alternative method
          console.log("Trying alternative method to fetch scenes");
          apiClient
            .getScenes({ universeId })
            .then((altResponse) => {
              let altScenesData = [];
              try {
                if (Array.isArray(altResponse.data)) {
                  altScenesData = altResponse.data;
                } else if (
                  altResponse.data?.scenes &&
                  Array.isArray(altResponse.data.scenes)
                ) {
                  altScenesData = altResponse.data.scenes;
                }
              } catch (parseErr) {
                console.error("Error parsing scene data:", parseErr);
                // Continue with empty array
              }

              console.log(
                "Scenes found (alternative method):",
                altScenesData.length,
                altScenesData
              );

              setScenes(altScenesData);
              // Validate and update scene_id if we have scenes
              if (altScenesData.length > 0) {
                const validSceneId = getValidSceneId(
                  formData.scene_id,
                  altScenesData
                );
                if (validSceneId !== formData.scene_id) {
                  setFormData((prev) => ({
                    ...prev,
                    scene_id: validSceneId,
                  }));
                }
              }
            })
            .catch((altErr) => {
              console.error(
                "Error fetching scenes with alternative method:",
                altErr
              );
              // Just continue with empty scenes array
            })
            .finally(() => {
              setLoadingScenes(false);
            });
        })
        .finally(() => {
          setLoadingScenes(false);
        });
    }
  }, [isOpen, universeId, type, availableScenes.length]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for scene_id to ensure it updates correctly
    if (name === "scene_id") {
      console.log(`Scene selection changed to ID:`, value);

      // For MUI Select, the value is already what was selected in the dropdown
      // No need for additional validation here as the dropdown only contains valid options
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

  const getTitle = () => {
    switch (type) {
      case "create":
        return "Create New Character";
      case "edit":
        return "Edit Character";
      case "view":
        return "Character Details";
      case "delete":
        return "Delete Character";
      default:
        return "Character";
    }
  };

  if (loading && (type === "edit" || type === "view") && !character) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="character-form-modal">
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="character-form-modal"
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box className="character-form-content">
            {error && (
              <Typography color="error" className="character-form-error">
                {error}
              </Typography>
            )}

            {type !== "delete" ? (
              <Box>
                <TextField
                  autoFocus
                  margin="dense"
                  name="name"
                  label="Character Name"
                  type="text"
                  fullWidth
                  value={formData.name}
                  onChange={handleChange}
                  disabled={type === "view" || loading}
                  required
                  className="character-form-field"
                />

                {type === "create" && (
                  <FormControl
                    fullWidth
                    margin="dense"
                    required
                    error={!formData.scene_id && !loadingScenes}
                    disabled={loadingScenes || type === "view" || loading}
                  >
                    <InputLabel id="scene-select-label">Scene</InputLabel>
                    <Select
                      labelId="scene-select-label"
                      id="scene-select"
                      name="scene_id"
                      value={formData.scene_id}
                      onChange={handleChange}
                      label="Scene"
                      displayEmpty
                    >
                      {loadingScenes ? (
                        <MenuItem disabled>Loading scenes...</MenuItem>
                      ) : scenes.length === 0 ? (
                        <MenuItem disabled>
                          No scenes available - please create a scene first
                        </MenuItem>
                      ) : (
                        scenes.map((scene) => {
                          if (!scene || scene.error) {
                            return null; // Skip invalid scenes
                          }

                          const sceneId = String(scene.id);
                          const displayName =
                            scene.title ||
                            scene.name ||
                            (scene.description
                              ? scene.description.substring(0, 20) + "..."
                              : `Scene ${scene.id}`);

                          return (
                            <MenuItem key={sceneId} value={sceneId}>
                              {displayName}
                            </MenuItem>
                          );
                        })
                      )}
                    </Select>
                    {!formData.scene_id &&
                      !loadingScenes &&
                      scenes.length === 0 && (
                        <FormHelperText error>
                          Please create a scene in this universe first
                        </FormHelperText>
                      )}
                    {!loadingScenes && scenes.length === 0 && (
                      <Button
                        size="small"
                        onClick={() =>
                          window.open(`/universes/${universeId}`, "_blank")
                        }
                        style={{ marginTop: 8 }}
                      >
                        Go to Universe to Create Scenes
                      </Button>
                    )}
                  </FormControl>
                )}

                <TextField
                  margin="dense"
                  name="description"
                  label="Description"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={type === "view" || loading}
                  className="character-form-field"
                />
              </Box>
            ) : (
              <Typography>
                Are you sure you want to delete this character? This action
                cannot be undone.
              </Typography>
            )}
          </Box>
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
                  (!formData.scene_id || scenes.length === 0))
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

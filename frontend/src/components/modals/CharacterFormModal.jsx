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
    scene_id: sceneId || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(null);
  const [scenes, setScenes] = useState(availableScenes);
  const [loadingScenes, setLoadingScenes] = useState(false);

  // Use availableScenes when provided
  useEffect(() => {
    if (availableScenes.length > 0) {
      console.log("Using provided scenes:", availableScenes);
      setScenes(availableScenes);

      // If no scene_id is selected yet, select the first available scene
      if (!formData.scene_id && availableScenes.length > 0) {
        console.log("Setting default scene to:", String(availableScenes[0].id));
        setFormData((prev) => ({
          ...prev,
          scene_id: String(availableScenes[0].id),
        }));
      }
    }
  }, [availableScenes, formData.scene_id]);

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

          // Debug the response structure
          if (response.data) {
            console.log("Response data keys:", Object.keys(response.data));
            for (const key in response.data) {
              console.log(
                `Key ${key} type:`,
                typeof response.data[key],
                Array.isArray(response.data[key])
              );
            }
          }

          // Try to extract scenes from different possible response formats
          let scenesData = [];
          if (Array.isArray(response.data)) {
            // If response.data is directly an array of scenes
            scenesData = response.data;
            console.log("Found scenes in direct array", scenesData);
          } else if (
            response.data.scenes &&
            Array.isArray(response.data.scenes)
          ) {
            // If response.data has a scenes property that is an array
            scenesData = response.data.scenes;
            console.log("Found scenes in scenes property", scenesData);
          } else if (response.data.universe && response.data.universe.scenes) {
            // If response.data has a universe property with scenes
            scenesData = response.data.universe.scenes;
            console.log("Found scenes in universe.scenes property", scenesData);
          } else {
            // Try to find any array property that could be scenes
            console.log("Searching for scenes in any array property");
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                console.log(
                  `Found array in property: ${key}`,
                  response.data[key]
                );
                if (
                  response.data[key].length > 0 &&
                  (response.data[key][0].name || response.data[key][0].title)
                ) {
                  scenesData = response.data[key];
                  console.log(
                    `Identified scenes array in property: ${key}`,
                    scenesData
                  );
                  break;
                }
              }
            }
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
            return apiClient.getScenes({ universeId }).then((altResponse) => {
              console.log("getScenes API raw response:", altResponse);
              console.log("getScenes API data:", altResponse.data);

              let altScenesData = [];
              if (Array.isArray(altResponse.data)) {
                altScenesData = altResponse.data;
                console.log(
                  "Found scenes in direct array (alt method)",
                  altScenesData
                );
              } else if (
                altResponse.data.scenes &&
                Array.isArray(altResponse.data.scenes)
              ) {
                altScenesData = altResponse.data.scenes;
                console.log(
                  "Found scenes in scenes property (alt method)",
                  altScenesData
                );
              } else {
                // Try to find any array property that could be scenes
                console.log(
                  "Searching for scenes in any array property (alt method)"
                );
                for (const key in altResponse.data) {
                  if (Array.isArray(altResponse.data[key])) {
                    console.log(
                      `Found array in property: ${key}`,
                      altResponse.data[key]
                    );
                    if (
                      altResponse.data[key].length > 0 &&
                      (altResponse.data[key][0].name ||
                        altResponse.data[key][0].title)
                    ) {
                      altScenesData = altResponse.data[key];
                      console.log(
                        `Identified scenes array in property: ${key}`,
                        altScenesData
                      );
                      break;
                    }
                  }
                }
              }

              console.log(
                "Scenes found (method 2):",
                altScenesData.length,
                altScenesData
              );

              if (altScenesData.length > 0) {
                setScenes(altScenesData);
                // Only set default scene if none is selected
                if (!formData.scene_id) {
                  console.log("Setting default scene to:", altScenesData[0].id);
                  setFormData((prev) => ({
                    ...prev,
                    scene_id: altScenesData[0].id,
                  }));
                }
              }
            });
          }

          if (scenesData.length > 0) {
            setScenes(scenesData);
            // Only set default scene if none is selected
            if (!formData.scene_id) {
              console.log("Setting default scene to:", scenesData[0].id);
              setFormData((prev) => ({
                ...prev,
                scene_id: scenesData[0].id,
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
              console.log("getScenes API response:", altResponse.data);

              let altScenesData = [];
              if (Array.isArray(altResponse.data)) {
                altScenesData = altResponse.data;
              } else if (
                altResponse.data.scenes &&
                Array.isArray(altResponse.data.scenes)
              ) {
                altScenesData = altResponse.data.scenes;
              }

              console.log(
                "Scenes found (alternative method):",
                altScenesData.length,
                altScenesData
              );

              setScenes(altScenesData);
              // If scenes exist and no sceneId was provided, default to the first scene
              if (altScenesData.length > 0 && !formData.scene_id) {
                setFormData((prev) => ({
                  ...prev,
                  scene_id: altScenesData[0].id,
                }));
              }
            })
            .catch((altErr) => {
              console.error(
                "Error fetching scenes with alternative method:",
                altErr
              );
            })
            .finally(() => {
              setLoadingScenes(false);
            });
        })
        .finally(() => {
          setLoadingScenes(false);
        });
    }
  }, [isOpen, universeId, type, formData.scene_id, availableScenes.length]);

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

          // Use default empty values if data is missing
          setFormData({
            name: characterData?.name || "",
            description: characterData?.description || "",
            scene_id:
              characterData?.scene_id ||
              (scenes.length > 0 ? scenes[0].id : ""),
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
            scene_id: scenes.length > 0 ? scenes[0].id : "",
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

      // Keep the existing scene_id if it's already set
      const currentSceneId = formData.scene_id;

      setFormData({
        name: "",
        description: "",
        scene_id: currentSceneId || (scenes.length > 0 ? scenes[0].id : ""),
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
      console.log(
        `Selected scene:`,
        scenes.find((scene) => scene.id === parseInt(value))
      );
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
      scene_id: scenes.length > 0 ? scenes[0].id : "",
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
                    >
                      {loadingScenes ? (
                        <MenuItem disabled>Loading scenes...</MenuItem>
                      ) : scenes.length === 0 ? (
                        <MenuItem disabled>
                          No scenes available - please create a scene first
                        </MenuItem>
                      ) : (
                        <>
                          {console.log(
                            "Available scenes for dropdown:",
                            scenes
                          )}
                          {console.log(
                            "Current selected scene_id:",
                            formData.scene_id
                          )}
                          {scenes.map((scene) => {
                            // Ensure scene id is a string for consistent comparison
                            const sceneId = String(scene.id);

                            // Create a display name based on available properties
                            const displayName =
                              scene.title ||
                              scene.name ||
                              (scene.description
                                ? scene.description.substring(0, 20) + "..."
                                : `Scene ${scene.id}`);

                            console.log(
                              "Rendering scene option:",
                              sceneId,
                              displayName,
                              "selected:",
                              formData.scene_id === sceneId
                            );

                            return (
                              <MenuItem key={sceneId} value={sceneId}>
                                {displayName}
                              </MenuItem>
                            );
                          })}
                        </>
                      )}
                    </Select>
                    {!formData.scene_id &&
                      !loadingScenes &&
                      scenes.length === 0 && (
                        <FormHelperText error>
                          Please create a scene in this universe first
                        </FormHelperText>
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
  characterId: PropTypes.number,
  universeId: PropTypes.number,
  sceneId: PropTypes.number,
  type: PropTypes.oneOf(["create", "edit", "view", "delete"]),
  onSuccess: PropTypes.func,
  availableScenes: PropTypes.array,
};

export default CharacterFormModal;

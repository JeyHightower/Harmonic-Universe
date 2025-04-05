import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
  fetchCharacter,
} from "../../store/thunks/characterThunks";
import { closeModal } from "../../store/slices/characterSlice";
import "./Characters.css";

const CharacterForm = ({ open, type, sceneId, characterId }) => {
  const dispatch = useDispatch();
  const { currentCharacter, loading, error } = useSelector(
    (state) => state.characters
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (type === "edit" || type === "view") {
      dispatch(fetchCharacter(characterId));
    }
  }, [dispatch, type, characterId]);

  useEffect(() => {
    if (currentCharacter) {
      setFormData({
        name: currentCharacter.name,
        description: currentCharacter.description || "",
      });
    }
  }, [currentCharacter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === "create") {
        await dispatch(
          createCharacter({
            ...formData,
            scene_id: sceneId,
          })
        );
      } else if (type === "edit") {
        await dispatch(updateCharacter({ id: characterId, ...formData }));
      } else if (type === "delete") {
        await dispatch(deleteCharacter(characterId));
      }
      dispatch(closeModal());
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleClose = () => {
    dispatch(closeModal());
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

  if (loading && (type === "edit" || type === "view")) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        className="character-form-modal"
      >
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
      open={open}
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
                  disabled={type === "view"}
                  required
                  className="character-form-field"
                />
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
                  disabled={type === "view"}
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
          <Button onClick={handleClose}>Cancel</Button>
          {type !== "view" && (
            <Button
              type="submit"
              variant="contained"
              color={type === "delete" ? "error" : "primary"}
              disabled={loading}
            >
              {loading
                ? "Deleting..."
                : type === "create"
                ? "Create"
                : "Delete"}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CharacterForm;

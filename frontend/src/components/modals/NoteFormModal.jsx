import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  InputAdornment,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Close as CloseIcon, Add as AddIcon } from "@mui/icons-material";
import apiClient from "../../services/api";
import "../note/Notes.css";
import PropTypes from "prop-types";

const NoteFormModal = ({
  isOpen,
  onClose,
  noteId = null,
  universeId,
  sceneId,
  characterId,
  type = "create",
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [],
    is_public: false,
    universe_id: universeId,
    scene_id: sceneId,
    character_id: characterId,
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (isOpen && noteId && (type === "edit" || type === "view")) {
      setLoading(true);
      apiClient
        .getNote(noteId)
        .then((response) => {
          setNote(response.data.note);
          setFormData({
            title: response.data.note.title || "",
            content: response.data.note.content || "",
            tags: response.data.note.tags || [],
            is_public: response.data.note.is_public || false,
            universe_id: response.data.note.universe_id,
            scene_id: response.data.note.scene_id,
            character_id: response.data.note.character_id,
          });
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load note details");
          setLoading(false);
          console.error("Error fetching note:", err);
        });
    } else {
      // Reset form for new notes or when modal is opened
      setFormData({
        title: "",
        content: "",
        tags: [],
        is_public: false,
        universe_id: universeId,
        scene_id: sceneId,
        character_id: characterId,
      });
    }
  }, [isOpen, noteId, type, universeId, sceneId, characterId]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "is_public" ? checked : value,
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleAddTag = (e) => {
    if ((e.key === "Enter" || e.type === "click") && tagInput.trim()) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === "create") {
        const response = await apiClient.createNote(formData);
        if (onSuccess) onSuccess(response.data.note);
      } else if (type === "edit" && noteId) {
        const response = await apiClient.updateNote(noteId, formData);
        if (onSuccess) onSuccess(response.data.note);
      } else if (type === "delete" && noteId) {
        await apiClient.deleteNote(noteId);
        if (onSuccess) onSuccess();
      }

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "An error occurred while processing your request"
      );
      console.error("Error submitting note form:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "create":
        return "Create New Note";
      case "edit":
        return "Edit Note";
      case "view":
        return "Note Details";
      case "delete":
        return "Delete Note";
      default:
        return "Note";
    }
  };

  if (loading && (type === "edit" || type === "view") && !note) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="note-form-modal">
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
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="note-form-modal"
    >
      <DialogTitle>
        {getTitle()}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="note-form-content">
          {error && (
            <Typography color="error" className="note-form-error">
              {error}
            </Typography>
          )}

          {type !== "delete" ? (
            <Box>
              <TextField
                autoFocus
                margin="dense"
                name="title"
                label="Title"
                type="text"
                fullWidth
                value={formData.title}
                onChange={handleChange}
                disabled={type === "view" || loading}
                required
                className="note-form-field"
              />
              <TextField
                margin="dense"
                name="content"
                label="Content"
                type="text"
                fullWidth
                multiline
                rows={6}
                value={formData.content}
                onChange={handleChange}
                disabled={type === "view" || loading}
                required
                className="note-form-field"
              />

              {type !== "view" && (
                <TextField
                  margin="dense"
                  label="Add Tags"
                  type="text"
                  fullWidth
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyPress={handleAddTag}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || loading}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  className="note-form-field"
                />
              )}

              <Box className="note-form-tags">
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={
                      type !== "view" ? () => handleRemoveTag(tag) : undefined
                    }
                    className="note-tag"
                    disabled={loading}
                  />
                ))}
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_public}
                    onChange={handleChange}
                    name="is_public"
                    disabled={type === "view" || loading}
                  />
                }
                label="Make Note Public"
                className="note-form-field"
              />
            </Box>
          ) : (
            <Typography>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions className="note-form-actions">
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {type !== "view" && (
            <Button
              type="submit"
              variant="contained"
              color={type === "delete" ? "error" : "primary"}
              disabled={loading}
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

NoteFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  noteId: PropTypes.number,
  universeId: PropTypes.number,
  sceneId: PropTypes.number,
  characterId: PropTypes.number,
  type: PropTypes.oneOf(["create", "edit", "view", "delete"]),
  onSuccess: PropTypes.func,
};

export default NoteFormModal;

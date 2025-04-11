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
import PropTypes from "prop-types";
import apiClient from "../../../services/api";
import "../styles/NoteFormModal.css";

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
      disableEnforceFocus
      container={() => document.body}
      aria-labelledby="note-form-title"
      aria-describedby="note-form-description"
      BackdropProps={{
        "aria-hidden": null,
      }}
    >
      <DialogTitle id="note-form-title">
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
      <DialogContent>
        {error && (
          <Box
            sx={{
              bgcolor: "error.light",
              color: "error.dark",
              p: 2,
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        {type === "delete" ? (
          <Typography variant="body1">
            Are you sure you want to delete this note? This action cannot be
            undone.
          </Typography>
        ) : (
          <>
            <TextField
              autoFocus
              margin="dense"
              id="note-title"
              name="title"
              label="Title"
              type="text"
              fullWidth
              value={formData.title}
              onChange={handleChange}
              required={type !== "view"}
              disabled={type === "view"}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="note-content"
              name="content"
              label="Content"
              multiline
              rows={6}
              fullWidth
              value={formData.content}
              onChange={handleChange}
              required={type !== "view"}
              disabled={type === "view"}
              sx={{ mb: 2 }}
            />

            {type !== "view" && (
              <TextField
                margin="dense"
                id="note-tags"
                label="Add Tags"
                fullWidth
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyPress={handleAddTag}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleAddTag} edge="end">
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Press Enter or click + to add a tag"
                sx={{ mb: 1 }}
              />
            )}

            <Box sx={{ display: "flex", flexWrap: "wrap", mb: 2, gap: 1 }}>
              {formData.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={type !== "view" ? () => handleRemoveTag(tag) : undefined}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={handleChange}
                  name="is_public"
                  disabled={type === "view"}
                />
              }
              label="Make note public"
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {type === "view" ? "Close" : "Cancel"}
        </Button>
        {type !== "view" && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color={type === "delete" ? "error" : "primary"}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : type === "create" ? (
              "Create"
            ) : type === "edit" ? (
              "Save"
            ) : (
              "Delete"
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

NoteFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  noteId: PropTypes.string,
  universeId: PropTypes.string,
  sceneId: PropTypes.string,
  characterId: PropTypes.string,
  type: PropTypes.oneOf(["create", "edit", "view", "delete"]),
  onSuccess: PropTypes.func,
};

export default NoteFormModal; 
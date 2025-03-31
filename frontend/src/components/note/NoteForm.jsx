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
  FormControlLabel,
  Switch,
  Chip,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { createNote, updateNoteById } from "../../store/thunks/noteThunks";
import "./Notes.css";

const NoteForm = ({ note, universeId, sceneId, characterId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.notes);
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

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || "",
        content: note.content || "",
        tags: note.tags || [],
        is_public: note.is_public || false,
        universe_id: note.universe_id || universeId,
        scene_id: note.scene_id || sceneId,
        character_id: note.character_id || characterId,
      });
    }
  }, [note, universeId, sceneId, characterId]);

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
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()],
        }));
        setTagInput("");
      }
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
    try {
      if (note) {
        await dispatch(updateNoteById(note.id, formData));
      } else {
        await dispatch(createNote(formData));
      }
    } catch (error) {
      console.error("Error submitting note:", error);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={() => dispatch({ type: "notes/closeModal" })}
      maxWidth="md"
      fullWidth
      className="note-form-modal"
    >
      <DialogTitle>
        {note ? "Edit Note" : "Create New Note"}
        <IconButton
          aria-label="close"
          onClick={() => dispatch({ type: "notes/closeModal" })}
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
          {error && <div className="note-form-error">{error}</div>}
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            type="text"
            fullWidth
            value={formData.title}
            onChange={handleChange}
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
            required
            className="note-form-field"
          />
          <TextField
            margin="dense"
            label="Add Tags"
            type="text"
            fullWidth
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyPress={handleAddTag}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      if (tagInput.trim()) {
                        handleAddTag({
                          key: "Enter",
                          preventDefault: () => {},
                        });
                      }
                    }}
                  >
                    +
                  </IconButton>
                </InputAdornment>
              ),
            }}
            className="note-form-field"
          />
          <Box className="note-form-tags">
            {formData.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                className="note-tag"
              />
            ))}
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public}
                onChange={handleChange}
                name="is_public"
              />
            }
            label="Make Note Public"
            className="note-form-field"
          />
        </DialogContent>
        <DialogActions className="note-form-actions">
          <Button
            onClick={() => dispatch({ type: "notes/closeModal" })}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? "Saving..." : note ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NoteForm;

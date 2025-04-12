import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TextField,
  Button,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { createNote, updateNote } from "../../../store/thunks/noteThunks";
import "../styles/NoteForm.css";

const NoteForm = ({ note, universeId, sceneId, characterId, onSuccess, onCancel }) => {
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
    } else {
      // Reset form for new notes
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
    try {
      if (note) {
        await dispatch(updateNote({ noteId: note.id, noteData: formData }));
      } else {
        await dispatch(createNote(formData));
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting note:", error);
    }
  };

  return (
    <Paper className="note-form-container" elevation={3}>
      <Typography variant="h5" className="note-form-title">
        {note ? "Edit Note" : "Create New Note"}
      </Typography>
      
      <form onSubmit={handleSubmit} className="note-form">
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
                <IconButton onClick={handleAddTag} edge="end">
                  <AddIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText="Press Enter or click + to add a tag"
          className="note-form-field"
        />
        <Box className="note-form-tags">
          {formData.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleRemoveTag(tag)}
              color="primary"
              variant="outlined"
              size="small"
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
        <Box className="note-form-actions">
          <Button 
            onClick={onCancel} 
            color="primary"
            variant="outlined"
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
        </Box>
      </form>
    </Paper>
  );
};

export default NoteForm; 
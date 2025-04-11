import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { fetchNote } from "../../../store/thunks/noteThunks";
import "../styles/NoteDetail.css";

const NoteDetail = ({ noteId }) => {
  const dispatch = useDispatch();
  const { currentNote, loading, error } = useSelector((state) => state.notes);

  useEffect(() => {
    if (noteId) {
      dispatch(fetchNote(noteId));
    }
  }, [dispatch, noteId]);

  if (loading) {
    return (
      <Dialog
        open={true}
        onClose={() => dispatch({ type: "notes/closeModal" })}
      >
        <DialogContent>
          <Typography>Loading...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog
        open={true}
        onClose={() => dispatch({ type: "notes/closeModal" })}
      >
        <DialogContent>
          <Typography color="error">{error}</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentNote) {
    return null;
  }

  return (
    <Dialog
      open={true}
      onClose={() => dispatch({ type: "notes/closeModal" })}
      maxWidth="md"
      fullWidth
      className="note-detail-modal"
    >
      <DialogTitle>
        {currentNote.title}
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
      <DialogContent className="note-detail-content">
        <Box className="note-detail-meta">
          <Typography variant="subtitle2" color="text.secondary">
            Created: {new Date(currentNote.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Last Updated:{" "}
            {new Date(currentNote.updated_at).toLocaleDateString()}
          </Typography>
        </Box>
        <Typography variant="body1" className="note-detail-text">
          {currentNote.content}
        </Typography>
        {currentNote.tags && currentNote.tags.length > 0 && (
          <Box className="note-detail-tags">
            {currentNote.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" className="note-tag" />
            ))}
          </Box>
        )}
        <Box className="note-detail-status">
          <Chip
            label={currentNote.is_public ? "Public" : "Private"}
            color={currentNote.is_public ? "primary" : "default"}
            size="small"
          />
          {currentNote.is_archived && (
            <Chip
              label="Archived"
              color="secondary"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions className="note-detail-actions">
        <Button
          onClick={() => dispatch({ type: "notes/closeModal" })}
          color="primary"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NoteDetail; 
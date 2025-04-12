import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Typography, IconButton, Box } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { openModal } from "../../../store/slices/noteSlice";
import { deleteNote as _deleteNote } from "../../../store/thunks/noteThunks";
import "../styles/NoteCard.css";

const NoteCard = ({ note }) => {
  const dispatch = useDispatch();

  const handleEdit = () => {
    dispatch(openModal({ type: "edit", note }));
  };

  const handleDelete = () => {
    dispatch(openModal({ type: "delete", note }));
  };

  return (
    <Card sx={{ mb: 2 }} className="note-card">
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          className="note-card-header"
        >
          <Typography variant="h6" component="div" className="note-card-title">
            {note.title}
          </Typography>
          <Box className="note-card-actions">
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mt: 1 }}
          className="note-card-content"
        >
          {note.content}
        </Typography>
      </CardContent>
    </Card>
  );
};

NoteCard.propTypes = {
  note: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  }).isRequired
};

export default NoteCard; 
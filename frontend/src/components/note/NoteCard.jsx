import React from "react";
import { Card, CardContent, Typography, IconButton, Box } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { openModal } from "../../store/slices/noteSlice";
import { deleteNote } from "../../store/thunks/noteThunks";

const NoteCard = ({ note }) => {
  const dispatch = useDispatch();

  const handleEdit = () => {
    dispatch(openModal({ type: "edit", note }));
  };

  const handleDelete = () => {
    dispatch(deleteNote(note.id));
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Typography variant="h6" component="div">
            {note.title}
          </Typography>
          <Box>
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {note.content}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default NoteCard;

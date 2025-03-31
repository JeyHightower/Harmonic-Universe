import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchCharacter,
  deleteCharacterById,
} from "../../store/thunks/characterThunks";
import { openModal } from "../../store/slices/modalSlice";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

const CharacterDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const character = useSelector((state) => state.characters.currentCharacter);
  const loading = useSelector((state) => state.characters.loading);
  const error = useSelector((state) => state.characters.error);

  useEffect(() => {
    if (id) {
      dispatch(fetchCharacter(id));
    }
  }, [dispatch, id]);

  const handleEdit = () => {
    dispatch(openModal({ type: "editCharacter", props: { characterId: id } }));
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this character?")) {
      await dispatch(deleteCharacterById(id));
      navigate("/characters");
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!character) {
    return <Typography>Character not found</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, margin: "0 auto", padding: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {character.name}
          </Typography>
          <Typography variant="body1" paragraph>
            {character.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(character.createdAt).toLocaleDateString()}
          </Typography>
        </CardContent>
        <CardActions>
          <Button onClick={handleEdit} color="primary">
            Edit
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default CharacterDetail;

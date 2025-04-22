import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { fetchCharacter, deleteCharacter } from '../../../store/thunks/characterThunks';
import { openModal } from '../../../store/slices/modalSlice';
import { getCharacterWithRetry } from '../../../utils/apiUtils';

const CharacterDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const character = useSelector((state) => state.characters.currentCharacter);
  const loading = useSelector((state) => state.characters.loading);
  const error = useSelector((state) => state.characters.error);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          // First try with our standard Redux approach
          dispatch(fetchCharacter(id));
        } catch (err) {
          // If that fails, especially with 429, we'll try our retry utility
          if (err.response?.status === 429) {
            setLocalLoading(true);
            setLocalError(null);

            try {
              // Use our utility with retry logic
              const characterData = await getCharacterWithRetry(id);
              // Update Redux state manually
              dispatch({
                type: 'characters/setCurrentCharacter',
                payload: characterData.character || characterData,
              });
            } catch (retryError) {
              setLocalError(
                'Failed to fetch character after multiple retries. Please try again later.'
              );
              console.error('Retry failed:', retryError);
            } finally {
              setLocalLoading(false);
            }
          }
        }
      }
    };

    fetchData();
  }, [dispatch, id]);

  const handleEdit = () => {
    dispatch(openModal({ type: 'editCharacter', props: { characterId: id } }));
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      await dispatch(deleteCharacter(id));
      navigate('/characters');
    }
  };

  if (loading || localLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || localError) {
    return <Alert severity="error">{error || localError}</Alert>;
  }

  if (!character) {
    return <Typography>Character not found</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', padding: 2 }}>
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

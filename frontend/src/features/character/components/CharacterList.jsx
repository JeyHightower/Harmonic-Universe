import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { fetchCharacters } from '../../../store/thunks/characterThunks';
import { openModal } from '../../../store/slices/characterSlice';
import { CharacterForm } from '..';
import CharacterCard from './CharacterCard';
import '../styles/Character.css';

const CharacterList = ({ sceneId }) => {
  const dispatch = useDispatch();
  const { characters, loading, error, modalOpen, modalType } = useSelector(
    (state) => state.characters
  );

  useEffect(() => {
    if (sceneId) {
      dispatch(fetchCharacters(sceneId));
    }
  }, [dispatch, sceneId]);

  const handleAddCharacter = () => {
    dispatch(openModal('create'));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <div className="character-list">
      <div className="character-list-header">
        <Typography variant="h5" component="h2">
          Characters
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCharacter}
        >
          Add Character
        </Button>
      </div>

      <div className="character-grid">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>

      {modalOpen && <CharacterForm open={modalOpen} type={modalType} sceneId={sceneId} />}
    </div>
  );
};

export default CharacterList;

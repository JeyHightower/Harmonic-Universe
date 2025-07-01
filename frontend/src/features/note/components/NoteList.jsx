import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { openModal } from '../../../store/slices/noteSlice';
import {
  fetchCharacterNotes,
  fetchSceneNotes,
  fetchUniverseNotes,
} from '../../../store/thunks/noteThunks';
import '../styles/NoteList.css';
import NoteCard from './NoteCard';
const NoteFormModal = lazy(() => import('../modals/NoteFormModal'));

const NoteList = () => {
  const dispatch = useDispatch();
  const { universeId, sceneId, characterId } = useParams();
  const { notes, loading, error, modalOpen, modalType, selectedNote } = useSelector(
    (state) => state.notes
  );

  useEffect(() => {
    if (universeId) {
      dispatch(fetchUniverseNotes(universeId));
    } else if (sceneId) {
      dispatch(fetchSceneNotes(sceneId));
    } else if (characterId) {
      dispatch(fetchCharacterNotes(characterId));
    }
  }, [dispatch, universeId, sceneId, characterId]);

  const handleAddNote = () => {
    dispatch(openModal('create'));
  };

  const handleCloseModal = () => {
    dispatch({ type: 'notes/closeModal' });
  };

  const handleSuccess = () => {
    // Refresh notes after successful action
    if (universeId) {
      dispatch(fetchUniverseNotes(universeId));
    } else if (sceneId) {
      dispatch(fetchSceneNotes(sceneId));
    } else if (characterId) {
      dispatch(fetchCharacterNotes(characterId));
    }
  };

  if (loading) {
    return (
      <Box className="note-loading">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="note-error">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="note-list">
      <Box className="note-list-header">
        <Typography variant="h4" className="note-list-title">
          Notes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddNote}
          className="note-list-add-button"
        >
          Add Note
        </Button>
      </Box>
      <Grid container spacing={3}>
        {notes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note.id}>
            <NoteCard note={note} />
          </Grid>
        ))}
      </Grid>
      {modalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <NoteFormModal
            isOpen={modalOpen}
            onClose={handleCloseModal}
            noteId={selectedNote?.id}
            universeId={universeId}
            sceneId={sceneId}
            characterId={characterId}
            type={modalType}
            onSuccess={handleSuccess}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default NoteList;

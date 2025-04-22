import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { NoteFormModal } from '..';
import apiClient from '../../../services/api.adapter';

const NotesPage = () => {
  const { universeId, sceneId, characterId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parent, setParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let response;

        // Determine which API to call based on available IDs
        if (characterId) {
          response = await apiClient.getNotesByCharacter(characterId);
          const characterResponse = await apiClient.getCharacter(characterId);
          setParent({
            type: 'character',
            data: characterResponse.data.character,
          });
        } else if (sceneId) {
          response = await apiClient.getNotesByScene(sceneId);
          const sceneResponse = await apiClient.getScene(sceneId);
          setParent({
            type: 'scene',
            data: sceneResponse.data.scene,
          });
        } else if (universeId) {
          response = await apiClient.getNotesByUniverse(universeId);
          const universeResponse = await apiClient.getUniverse(universeId);
          setParent({
            type: 'universe',
            data: universeResponse.data.universe,
          });
        }

        if (response && response.data && response.data.notes) {
          setNotes(response.data.notes);

          // Extract all unique tags
          const tags = new Set();
          response.data.notes.forEach((note) => {
            if (note.tags && Array.isArray(note.tags)) {
              note.tags.forEach((tag) => tags.add(tag));
            }
          });
          setAllTags(Array.from(tags));
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load notes. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [universeId, sceneId, characterId]);

  const handleCreateNote = () => {
    setModalType('create');
    setSelectedNoteId(null);
    setModalOpen(true);
  };

  const handleEditNote = (noteId) => {
    setModalType('edit');
    setSelectedNoteId(noteId);
    setModalOpen(true);
  };

  const handleViewNote = (noteId) => {
    setModalType('view');
    setSelectedNoteId(noteId);
    setModalOpen(true);
  };

  const handleDeleteNote = (noteId) => {
    setModalType('delete');
    setSelectedNoteId(noteId);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleNoteSuccess = (updatedNote) => {
    if (modalType === 'create') {
      setNotes([...notes, updatedNote]);

      // Update all tags
      const newTags = new Set(allTags);
      if (updatedNote.tags && Array.isArray(updatedNote.tags)) {
        updatedNote.tags.forEach((tag) => newTags.add(tag));
      }
      setAllTags(Array.from(newTags));
    } else if (modalType === 'edit') {
      setNotes(notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)));

      // Recalculate all tags
      const tagsSet = new Set();
      notes.forEach((note) => {
        if (note.id !== updatedNote.id && note.tags && Array.isArray(note.tags)) {
          note.tags.forEach((tag) => tagsSet.add(tag));
        }
      });
      if (updatedNote.tags && Array.isArray(updatedNote.tags)) {
        updatedNote.tags.forEach((tag) => tagsSet.add(tag));
      }
      setAllTags(Array.from(tagsSet));
    } else if (modalType === 'delete') {
      setNotes(notes.filter((note) => note.id !== selectedNoteId));

      // Recalculate all tags
      const deletedNote = notes.find((note) => note.id === selectedNoteId);
      if (deletedNote && deletedNote.tags && deletedNote.tags.length > 0) {
        const tagsSet = new Set();
        notes.forEach((note) => {
          if (note.id !== selectedNoteId && note.tags && Array.isArray(note.tags)) {
            note.tags.forEach((tag) => tagsSet.add(tag));
          }
        });
        setAllTags(Array.from(tagsSet));
      }
    }
  };

  const handleBack = () => {
    // Safe navigation for the case when parent data is not loaded yet
    if (characterId) {
      // Get the universeId from the parent data or fall back to the URL param
      const universeIdToUse = parent?.data?.universe_id || universeId;
      if (universeIdToUse) {
        navigate(`/universes/${universeIdToUse}/characters`);
      } else {
        navigate(`/universes`);
      }
    } else if (sceneId) {
      // Get the universeId from the parent data or fall back to the URL param
      const universeIdToUse = parent?.data?.universe_id || universeId;
      if (universeIdToUse) {
        navigate(`/universes/${universeIdToUse}/scenes`);
      } else {
        navigate(`/universes`);
      }
    } else if (universeId) {
      navigate(`/universes/${universeId}`);
    } else {
      // Fallback to universes list
      navigate('/universes');
    }
  };

  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredNotes = notes.filter((note) => {
    // Skip notes with invalid structure
    if (!note || typeof note !== 'object') return false;

    // Text search - with null checks
    const noteTitle = note.title || '';
    const noteContent = note.content || '';

    const matchesSearch =
      noteTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      noteContent.toLowerCase().includes(searchTerm.toLowerCase());

    // Tag filtering
    const matchesTags =
      selectedTags.length === 0 ||
      (note.tags &&
        Array.isArray(note.tags) &&
        selectedTags.every((tag) => note.tags.includes(tag)));

    return matchesSearch && matchesTags;
  });

  const getParentTitle = () => {
    // Safe check for parent and parent.data
    if (!parent || !parent.data) return '';

    // Safe check for parent.data.name
    const name = parent.data.name || 'Untitled';

    switch (parent.type) {
      case 'universe':
        return `for Universe: ${name}`;
      case 'scene':
        return `for Scene: ${name}`;
      case 'character':
        return `for Character: ${name}`;
      default:
        return '';
    }
  };

  return (
    <Container maxWidth="lg" className="notes-page">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Notes {getParentTitle()}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNote}
        >
          Create Note
        </Button>
      </Box>

      <Box mb={4}>
        <TextField
          fullWidth
          margin="normal"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {allTags.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, mt: 2, backgroundColor: 'rgba(0,0,0,0.03)' }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="subtitle2" sx={{ mr: 1 }}>
                <LabelIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Filter by tags:
              </Typography>
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  clickable
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => handleTagSelect(tag)}
                  size="small"
                />
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : filteredNotes.length === 0 ? (
        <Box my={4} textAlign="center">
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No notes found
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateNote}
            sx={{ mt: 2 }}
          >
            Create your first note
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredNotes.map((note) => (
            <Grid item xs={12} sm={6} md={4} key={note.id}>
              <Card elevation={3} className="note-card">
                <CardContent>
                  <Typography variant="h6" component="h2" className="note-card-title">
                    {note.title || 'Untitled Note'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" className="note-card-content">
                    {note.content && note.content.length > 150
                      ? `${note.content.substring(0, 150)}...`
                      : note.content || 'No content'}
                  </Typography>

                  {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                    <Box mt={2} className="note-card-tags">
                      {note.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag || ''}
                          size="small"
                          className="note-tag"
                          onClick={() => handleTagSelect(tag)}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <CardActions className="note-card-actions">
                  <IconButton onClick={() => handleViewNote(note.id)} size="small" title="View">
                    <ViewIcon />
                  </IconButton>
                  <IconButton onClick={() => handleEditNote(note.id)} size="small" title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteNote(note.id)}
                    size="small"
                    title="Delete"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <NoteFormModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        noteId={selectedNoteId}
        universeId={universeId ? Number(universeId) : parent?.data?.universe_id || null}
        sceneId={sceneId ? Number(sceneId) : null}
        characterId={characterId ? Number(characterId) : null}
        type={modalType}
        onSuccess={handleNoteSuccess}
      />
    </Container>
  );
};

export default NotesPage;

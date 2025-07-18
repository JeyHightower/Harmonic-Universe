import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { useModalState } from '../../../hooks/useModalState';

// Redux modal system imports
import { useDispatch, useSelector } from 'react-redux';
import api from '../../../services/api.adapter';
import { clearCharacters } from '../../../store/slices/characterSlice';
import { fetchCharactersByUniverse } from '../../../store/thunks/characterThunks';

// Remove test console.log
// console.log(
//   "CharactersPage hot reload verification - Hot Reloading IS working! " +
//     new Date().toISOString()
// );

// Create a wrapper component that handles redirection logic
const CharactersPageWrapper = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  // Validate the universeId immediately when component mounts
  useEffect(() => {
    // Comprehensive validation check for universeId
    const isValidUniverseId =
      universeId !== undefined &&
      universeId !== null &&
      universeId !== 'undefined' &&
      universeId !== 'null' &&
      universeId !== '' &&
      !isNaN(parseInt(universeId, 10)) &&
      parseInt(universeId, 10) > 0;

    if (!isValidUniverseId) {
      console.log(`Invalid universe ID detected (${universeId}), redirecting to dashboard`);
      navigate('/dashboard', { replace: true });
    } else {
      setIsValidating(false);
    }
  }, [universeId, navigate]);

  // Show loading while validating
  if (isValidating) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Validating universe...
        </Typography>
      </Box>
    );
  }

  // Validation is complete and universeId is valid
  // Parse universeId to make sure it's a number
  const parsedUniverseId = parseInt(universeId, 10);
  console.log(`CharactersPageWrapper: Rendering for valid universe ID: ${parsedUniverseId}`);

  // If universeId is valid, render the main component
  return <CharactersPageContent universeId={parsedUniverseId} />;
};

// Main component with actual content
const CharactersPageContent = ({ universeId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Double-check universeId is valid, even after wrapper validation
  const safeUniverseId =
    universeId && !isNaN(parseInt(universeId, 10)) && parseInt(universeId, 10) > 0
      ? parseInt(universeId, 10)
      : null;

  // Get characters from Redux store
  const { universeCharacters, isLoading: reduxLoading } = useSelector((state) => state.characters);
  const characters =
    universeId && universeCharacters[universeId] ? universeCharacters[universeId] : [];
  const loading = reduxLoading;
  const error = useSelector((state) => state.characters.error);
  const [universe, setUniverse] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Use Redux modal system
  const { open: openModal } = useModalState();

  // Update local state when Redux state changes
  useEffect(() => {
    if (universeId) {
      dispatch(fetchCharactersByUniverse(universeId));
    }

    // Clean up Redux state on unmount
    return () => {
      dispatch(clearCharacters());
    };
  }, [dispatch, universeId]);

  useEffect(() => {
    // Early return to prevent any API calls if universeId is invalid or null
    if (!safeUniverseId) {
      console.warn(`Invalid universeId for API calls: ${universeId}, skipping data fetch`);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      return;
    }

    const fetchData = async () => {
      try {
        console.log(`Fetching data for valid universe ID: ${safeUniverseId}`);

        // Check for cached characters first
        const CHARACTER_CACHE_KEY = 'harmonic_universe_character_cache';
        try {
          // Try to get characters from cache first before making any API calls
          const cacheString = localStorage.getItem(CHARACTER_CACHE_KEY);
          if (cacheString) {
            const cache = JSON.parse(cacheString);
            const universeCache = cache[safeUniverseId];

            // Check if cache exists and is not too old (24 hours)
            if (
              universeCache &&
              universeCache.characters &&
              Date.now() - universeCache.timestamp < 24 * 60 * 60 * 1000
            ) {
              console.log(
                `Using ${universeCache.characters.length} cached characters for universe ${safeUniverseId}`
              );
            }
          }
        } catch (cacheError) {
          console.error('Error reading characters from cache:', cacheError);
          // Continue with normal fetching if cache fails
        }

        // Get universe details
        try {
          const universeResponse = await api.getUniverse(safeUniverseId, {
            includeScenes: true,
          });
          console.log('Universe response:', universeResponse);

          // Add null checks before accessing data
          if (!universeResponse || !universeResponse.data) {
            console.error('Empty response from getUniverse API');
            throw new Error('Failed to fetch universe data');
          }

          // Set universe with fallback to empty object if undefined
          const universeData = universeResponse.data.universe || {};
          console.log('Extracted universe data:', universeData);
          setUniverse(universeData);

          // Improved scene fetching and processing
          let universeScenes = [];

          // First check if scenes are in the universe response
          if (
            universeResponse.data.universe?.scenes &&
            Array.isArray(universeResponse.data.universe.scenes)
          ) {
            console.log(
              'Found scenes in universe response:',
              universeResponse.data.universe.scenes.length
            );
            universeScenes = universeResponse.data.universe.scenes;
          } else if (universeResponse.data.scenes && Array.isArray(universeResponse.data.scenes)) {
            console.log(
              'Found scenes at top level of response:',
              universeResponse.data.scenes.length
            );
            universeScenes = universeResponse.data.scenes;
          }

          // If no scenes found in universe response, fetch them directly
          if (universeScenes.length === 0) {
            try {
              console.log(
                'No scenes in universe response, fetching directly for universe',
                safeUniverseId
              );
              const scenesResponse = await api.getUniverseScenes(safeUniverseId);
              console.log('Direct scenes response:', scenesResponse);

              // Handle various response formats
              if (scenesResponse.data?.scenes && Array.isArray(scenesResponse.data.scenes)) {
                console.log(
                  'Found scenes in dedicated scenes array:',
                  scenesResponse.data.scenes.length
                );
                universeScenes = scenesResponse.data.scenes;
              } else if (Array.isArray(scenesResponse.data)) {
                console.log('Found scenes as direct array:', scenesResponse.data.length);
                universeScenes = scenesResponse.data;
              } else if (scenesResponse.data) {
                // Search for any array property that might contain scenes
                console.log('Searching response object for scene arrays');
                const responseObj = scenesResponse.data;

                for (const key in responseObj) {
                  if (Array.isArray(responseObj[key])) {
                    const potentialScenes = responseObj[key];
                    if (
                      potentialScenes.length > 0 &&
                      (potentialScenes[0].universe_id || potentialScenes[0].id)
                    ) {
                      console.log(
                        `Found potential scenes in property '${key}':`,
                        potentialScenes.length
                      );
                      universeScenes = potentialScenes;
                      break;
                    }
                  }
                }
              }
            } catch (sceneError) {
              console.error('Error fetching scenes:', sceneError);
              // Continue with other data fetching even if scenes fail
            }
          }

          // Log the final result of scene fetching
          console.log('Final scenes for universe:', universeScenes);
          setScenes(universeScenes || []);
        } catch (universeErr) {
          console.error(`Error fetching universe ${safeUniverseId}:`, universeErr);
          // Initialize with empty data to prevent null errors
          setUniverse({});
          setScenes([]);
          // We'll continue with character fetching even if universe fails
        }

        // Get characters for this universe using Redux thunk action
        try {
          console.log(`Fetching characters for universe ID: ${safeUniverseId} from Redux`);

          // Characters will be updated via the useEffect that watches characters
          console.log('Characters fetched from Redux store');
        } catch (charactersErr) {
          console.error('Error fetching characters from Redux:', charactersErr);
          // Don't call setError, just log the error
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
      }
    };

    // Only run fetchData if universeId is valid and defined
    if (safeUniverseId && safeUniverseId > 0) {
      console.log(`CharactersPageContent: useEffect triggered with universeId=${safeUniverseId}`);
      fetchData();
    } else {
      console.warn(
        `CharactersPageContent: useEffect triggered with invalid universeId=${safeUniverseId}`
      );
    }
  }, [safeUniverseId, navigate, dispatch]);

  const handleCreateCharacter = () => {
    console.log('Creating character for universe:', safeUniverseId);
    console.log('Available scenes for character:', scenes);
    openModal(MODAL_TYPES.CHARACTER_FORM, {
      universeId: String(safeUniverseId),
      mode: 'create',
      onSuccess: handleCharacterSuccess,
      availableScenes: scenes,
    });
  };

  const handleEditCharacter = (characterId) => {
    openModal(MODAL_TYPES.CHARACTER_FORM, {
      universeId: String(safeUniverseId),
      characterId: String(characterId),
      mode: 'edit',
      onSuccess: handleCharacterSuccess,
      availableScenes: scenes,
    });
  };

  const handleViewCharacter = (characterId) => {
    openModal(MODAL_TYPES.CHARACTER_FORM, {
      universeId: String(safeUniverseId),
      characterId: String(characterId),
      mode: 'view',
      onSuccess: handleCharacterSuccess,
      availableScenes: scenes,
    });
  };

  const handleDeleteCharacter = (characterId) => {
    openModal(MODAL_TYPES.CONFIRMATION, {
      title: 'Delete Character',
      message: 'Are you sure you want to delete this character? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.deleteCharacter(characterId);
          handleCharacterSuccess('delete');
        } catch (error) {
          console.error('Error deleting character:', error);
        }
      },
      confirmText: 'Delete',
      dangerMode: true,
    });
  };

  const handleCharacterSuccess = () => {
    // Refresh the character list from API
    dispatch(fetchCharactersByUniverse(safeUniverseId));
  };

  const handleBackToUniverse = () => {
    navigate(`/universes/${safeUniverseId}`);
  };

  const handleCreateScene = () => {
    if (!safeUniverseId) return;

    // Open the scene creation modal
    navigate(`/universes/${safeUniverseId}/scenes/new`);
  };

  const filteredCharacters = characters.filter(
    (character) =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (character.description &&
        character.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderCreateSceneButton = () => {
    if (scenes.length === 0 && !loading) {
      return (
        <Box textAlign="center" my={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
          <Typography variant="h6" gutterBottom>
            No Scenes Available
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Characters need to be placed in a scene. Create your first scene to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateScene}
            startIcon={<AddIcon />}
          >
            Create First Scene
          </Button>
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="lg" className="characters-page">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBackToUniverse} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Characters {universe ? `for ${universe.name}` : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateCharacter}
        >
          Create Character
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        placeholder="Search characters..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 4 }}
      />

      {renderCreateSceneButton()}

      {loading ? (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {typeof error === 'object' ? error.message || 'Failed to load characters' : error}
        </Alert>
      ) : filteredCharacters.length === 0 ? (
        <Box my={4} textAlign="center">
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No characters found
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateCharacter}
            sx={{ mt: 2 }}
            disabled={scenes.length === 0}
          >
            Create your first character
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCharacters.map((character) => (
            <Grid item xs={12} sm={6} md={4} key={character.id}>
              <Card elevation={3} className="character-card">
                <CardContent>
                  <Typography variant="h6" component="h2" className="character-card-title">
                    {character.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className="character-card-description"
                  >
                    {character.description || 'No description available'}
                  </Typography>
                </CardContent>
                <CardActions className="character-card-actions">
                  <IconButton
                    onClick={() => handleViewCharacter(character.id)}
                    size="small"
                    title="View"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleEditCharacter(character.id)}
                    size="small"
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteCharacter(character.id)}
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
    </Container>
  );
};

// Export the wrapper component instead
export default CharactersPageWrapper;

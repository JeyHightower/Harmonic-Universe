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
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { SceneModal } from '..';
import { apiClient } from '../../../services/api.adapter.mjs';
import { deleteScene, fetchScenes } from '../../../store/thunks/consolidated/scenesThunks';

// Create a wrapper component that handles redirection logic
const ScenesPageWrapper = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [validatedId, setValidatedId] = useState(null);

  // Add debug logging
  useEffect(() => {
    console.log('ScenesPageWrapper: universeId from params:', universeId);
  }, [universeId]);

  // Validate the universeId immediately when component mounts
  useEffect(() => {
    // Skip validation if we already validated this ID (prevents re-validation on re-renders)
    if (validatedId === universeId) {
      console.log('ScenesPageWrapper: Already validated this universeId, skipping validation');
      return;
    }

    // Comprehensive validation check for universeId
    const isValidUniverseId =
      universeId !== undefined &&
      universeId !== null &&
      universeId !== 'undefined' &&
      universeId !== 'null' &&
      universeId !== '' &&
      !isNaN(parseInt(universeId, 10)) &&
      parseInt(universeId, 10) > 0;

    console.log('ScenesPageWrapper: isValidUniverseId =', isValidUniverseId);

    if (!isValidUniverseId) {
      console.log(`Invalid universe ID detected (${universeId}), redirecting to dashboard`);
      navigate('/dashboard', { replace: true });
    } else {
      setIsValidating(false);
      // Store the validated ID to prevent re-validation
      setValidatedId(universeId);
    }
  }, [universeId, navigate, validatedId]);

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
  console.log(`ScenesPageWrapper: Rendering for valid universe ID: ${parsedUniverseId}`);

  // If universeId is valid, render the main component
  return <ScenesPageContent universeId={parsedUniverseId} />;
};

// Main component with actual content
const ScenesPageContent = ({ universeId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Add more comprehensive debug logging
  console.log('ScenesPageContent props:', { universeId, type: typeof universeId });

  // Double-check universeId is valid, even after wrapper validation
  const safeUniverseId = universeId && !isNaN(universeId) && universeId > 0 ? universeId : null;

  // Store the universe ID in localStorage for recovery
  useEffect(() => {
    if (safeUniverseId) {
      localStorage.setItem('lastViewedUniverseId', safeUniverseId.toString());
    }
  }, [safeUniverseId]);

  // Add more debug logging
  console.log('Calculated safeUniverseId:', safeUniverseId);
  console.log('Type of safeUniverseId:', typeof safeUniverseId);

  // Get scenes from Redux store
  const scenesFromStore = useSelector((state) => state.scenes?.scenes || []);
  const universeScenes = useSelector((state) => {
    const scenes = state.scenes?.universeScenes?.[safeUniverseId] || [];
    console.log(
      `ScenesPage - Found ${scenes.length} scenes for universe ${safeUniverseId} in universeScenes collection`
    );
    return scenes;
  });
  const loadingFromStore = useSelector((state) => state.scenes?.loading);
  const errorFromStore = useSelector((state) => state.scenes?.error);

  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universe, setUniverse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Update local state when Redux state changes - now prioritize universeScenes over scenesFromStore
  useEffect(() => {
    // First check if we have universe-specific scenes
    if (universeScenes && universeScenes.length > 0) {
      console.log('ScenesPage - Using universe-specific scenes from store:', universeScenes.length);
      setScenes(universeScenes);
    }
    // Fall back to filtered scenes from the main collection
    else if (scenesFromStore && scenesFromStore.length > 0) {
      console.log('ScenesPage - Filtering from all scenes in store:', scenesFromStore.length);
      // Filter scenes that belong to this universe
      const filteredScenes = scenesFromStore.filter((scene) => {
        return String(scene.universe_id) === String(safeUniverseId);
      });
      console.log('ScenesPage - Filtered scenes for current universe:', filteredScenes.length);
      setScenes(filteredScenes);
    }

    if (loadingFromStore !== undefined) {
      setLoading(loadingFromStore);
    }
    if (errorFromStore) {
      setError(errorFromStore);
    }
  }, [scenesFromStore, universeScenes, loadingFromStore, errorFromStore, safeUniverseId]);

  useEffect(() => {
    // Early return to prevent any API calls if universeId is invalid or null
    if (!safeUniverseId) {
      console.warn(`Invalid universeId for API calls: ${universeId}, skipping data fetch`);
      setLoading(false);
      setError('Invalid universe ID. Redirecting to dashboard.');
      // Only redirect if this is initial load, not after scene creation
      if (!scenes.length) {
        console.log('ScenesPageContent: No scenes loaded yet, redirecting to dashboard');
        window.setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } else {
        console.log('ScenesPageContent: Scenes already loaded, skipping redirect');
      }
      return;
    }

    const fetchData = async () => {
      try {
        console.log(`Fetching data for valid universe ID: ${safeUniverseId}`);
        setLoading(true);
        setError(null);

        // Get universe details
        try {
          // Make sure you're passing the ID directly, not as an object
          console.log('About to call getUniverse with:', safeUniverseId);
          console.log('Type of ID being passed:', typeof safeUniverseId);

          // Ensure we're passing the ID directly, not wrapped in an object
          const universeResponse = await apiClient.universes.getUniverse(safeUniverseId);
          console.log('Universe response:', universeResponse);

          // Add null checks before accessing data
          if (!universeResponse || !universeResponse.data) {
            console.error('Empty response from getUniverse API');
            throw new Error('Failed to fetch universe data');
          }

          // Set universe with fallback to empty object if undefined
          const universeData = universeResponse.data.universe || universeResponse.data || {};
          console.log('Extracted universe data:', universeData);
          setUniverse(universeData);
        } catch (universeError) {
          console.error('Error fetching universe:', universeError);
          setError('Failed to fetch universe details. Please try again.');
          setLoading(false);
          return;
        }

        // Fetch scenes for the universe using multiple methods to ensure we get data
        try {
          // First try to get scenes using Redux action
          console.log('About to call fetchScenes with:', safeUniverseId);
          const scenesResult = await dispatch(fetchScenes(safeUniverseId));
          console.log('Redux fetchScenes result:', scenesResult);

          // If we didn't get any scenes, try direct API call as backup
          if (!scenesResult.payload?.scenes || scenesResult.payload.scenes.length === 0) {
            console.log('No scenes from Redux, trying direct API call');

            try {
              // Try different API endpoints
              console.log('Trying universes.getUniverseScenes');
              const directResponse = await apiClient.universes.getUniverseScenes(safeUniverseId);
              console.log('Direct API call result:', directResponse);

              if (directResponse?.data?.scenes || Array.isArray(directResponse?.data)) {
                const scenesData = directResponse.data?.scenes || directResponse.data;
                console.log('Got scenes from direct API call:', scenesData.length);

                // Add these scenes to our local state
                setScenes((prevScenes) => {
                  // Create a map to remove duplicates
                  const scenesMap = new Map();
                  // Add existing scenes
                  prevScenes.forEach((scene) => {
                    if (scene && scene.id) {
                      scenesMap.set(scene.id, scene);
                    }
                  });
                  // Add new scenes from API
                  scenesData.forEach((scene) => {
                    // Ensure universe_id is set
                    const updatedScene = {
                      ...scene,
                      universe_id: scene.universe_id || safeUniverseId,
                    };
                    if (scene && scene.id) {
                      scenesMap.set(scene.id, updatedScene);
                    }
                  });
                  return Array.from(scenesMap.values());
                });
              }
            } catch (directError) {
              console.error('Direct API call failed:', directError);
              // We don't throw here, just log, as we've already tried Redux
            }
          }
        } catch (scenesError) {
          console.error('Error fetching scenes:', scenesError);
          setError('Failed to fetch scenes. Please try again.');
        }

        setLoading(false);
      } catch (error) {
        console.error('General error in fetchData:', error);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, navigate, safeUniverseId, universeId]);

  const handleCreateScene = () => {
    console.log('ScenesPage - Opening create scene modal with universeId:', safeUniverseId);
    setModalType('create');
    setSelectedSceneId(null);
    setModalOpen(true);
  };

  const handleEditScene = (sceneId) => {
    setModalType('edit');
    setSelectedSceneId(sceneId);
    setModalOpen(true);
  };

  const handleViewScene = (sceneId) => {
    try {
      console.log(`Navigating to scene: ${sceneId}`);

      // First check if the scene exists in our local state
      const sceneExists = scenes.some((scene) => scene.id === sceneId);

      if (!sceneExists) {
        console.error(`Scene ${sceneId} not found in local state`);
        return;
      }

      // Use navigate with state to pass the universe ID as well
      navigate(`/scenes/${sceneId}`, {
        state: { universeId: safeUniverseId },
      });
    } catch (error) {
      console.error('Error navigating to scene:', error);
      // Show an error instead of navigating away
      setError('Failed to navigate to scene view. Please try again.');
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (window.confirm('Are you sure you want to delete this scene?')) {
      try {
        // Use the Redux thunk instead of directly calling the API
        await dispatch(deleteScene(sceneId)).unwrap();
        console.log(`Scene ${sceneId} deleted successfully`);

        // Refresh the scenes list for this universe
        dispatch(fetchScenes(safeUniverseId));
      } catch (error) {
        console.error('Error deleting scene:', error);
        setError('Failed to delete scene. Please try again.');
      }
    }
  };

  const handleModalClose = () => {
    console.log('ScenesPage - Closing scene modal');
    setModalOpen(false);

    // We're already handling refreshes in the onSuccess handler,
    // so we don't need to refresh again here which could cause issues
    // with the validation logic rerunning
  };

  const handleBackToUniverse = () => {
    navigate(`/universes/${safeUniverseId}`);
  };

  // Handlers for filter and sort changes
  const handleTypeFilterChange = (newTypeFilter) => {
    setTypeFilter(newTypeFilter);
  };

  const handleStatusFilterChange = (newStatusFilter) => {
    setStatusFilter(newStatusFilter);
  };

  const handleSortByChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleSortDirectionChange = (newSortDirection) => {
    setSortDirection(newSortDirection);
  };

  // Filter and sort scenes
  const filteredScenes = useMemo(() => {
    console.log('ScenesPage - Calculating filteredScenes, input length:', scenes.length);

    // Debug scenes data to find potential issues
    if (scenes.length > 0) {
      const sampleScene = scenes[0];
      console.log('ScenesPage - Sample scene structure:', {
        id: sampleScene.id,
        name: sampleScene.name || sampleScene.title,
        universe_id: sampleScene.universe_id,
        universeId: sampleScene.universeId,
      });
    }

    let result = [...scenes]; // Create a copy to avoid mutation issues

    // Filter scenes by universe ID if we have a valid ID
    if (safeUniverseId) {
      result = result.filter((scene) => {
        // Get universe ID with support for different property names
        const sceneUniverseId = scene.universe_id || scene.universeId;

        // Convert both to strings to ensure consistent comparison
        const sceneIdStr = String(sceneUniverseId || '');
        const targetIdStr = String(safeUniverseId);

        const isMatch = sceneIdStr === targetIdStr;

        if (!isMatch) {
          console.log(
            `ScenesPage - Filtering out scene ${scene.id || 'unknown'} with universeId ${sceneUniverseId} (expecting ${safeUniverseId})`
          );
        } else {
          // For matched scenes, ensure universe_id is consistently set
          if (!scene.universe_id && scene.universeId) {
            scene.universe_id = scene.universeId;
          }
        }

        return isMatch;
      });
      console.log(`ScenesPage - After universe filtering: ${result.length} scenes`);
    }

    // Filter out deleted scenes
    result = result.filter((scene) => {
      const isActive = scene && scene.is_deleted !== true;
      if (!isActive) {
        console.log(`ScenesPage - Filtering out deleted scene ${scene.id}`);
      }
      return isActive;
    });
    console.log(`ScenesPage - After deletion filtering: ${result.length} scenes`);

    // Apply search filter if search term is present
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (scene) =>
          scene.name?.toLowerCase().includes(term) ||
          scene.description?.toLowerCase().includes(term) ||
          scene.content?.toLowerCase().includes(term) ||
          scene.summary?.toLowerCase().includes(term) ||
          scene.location?.toLowerCase().includes(term)
      );
      console.log(`ScenesPage - After search filtering: ${result.length} scenes`);
    }

    // Apply type filter if not set to "all"
    if (typeFilter && typeFilter !== 'all') {
      result = result.filter((scene) => scene.scene_type === typeFilter);
      console.log(`ScenesPage - After type filtering: ${result.length} scenes`);
    }

    // Apply status filter if not set to "all"
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((scene) => scene.status === statusFilter);
      console.log(`ScenesPage - After status filtering: ${result.length} scenes`);
    }

    // Apply sort
    if (sortBy) {
      result = [...result].sort((a, b) => {
        if (sortBy === 'name') {
          return sortDirection === 'asc'
            ? (a.name || '').localeCompare(b.name || '')
            : (b.name || '').localeCompare(a.name || '');
        } else if (sortBy === 'date_of_scene') {
          // Sorting by scene date
          const aDate = a.date_of_scene ? new Date(a.date_of_scene) : new Date(0);
          const bDate = b.date_of_scene ? new Date(b.date_of_scene) : new Date(0);
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        } else if (sortBy === 'created_at') {
          // Sorting by creation date
          const aDate = a.created_at ? new Date(a.created_at) : new Date(0);
          const bDate = b.created_at ? new Date(b.created_at) : new Date(0);
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        } else if (sortBy === 'updated_at') {
          // Sorting by update date
          const aDate = a.updated_at ? new Date(a.updated_at) : new Date(0);
          const bDate = b.updated_at ? new Date(b.updated_at) : new Date(0);
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        } else if (sortBy === 'order') {
          // Sorting by order field (numeric)
          const aOrder = typeof a.order === 'number' ? a.order : 0;
          const bOrder = typeof b.order === 'number' ? b.order : 0;
          return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }
        return 0;
      });
      console.log(`ScenesPage - After sorting: ${result.length} scenes`);
    }

    console.log('ScenesPage - Final filtered scenes:', result);
    return result;
  }, [scenes, searchTerm, typeFilter, statusFilter, sortBy, sortDirection, safeUniverseId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToUniverse}
            sx={{ mb: 2 }}
          >
            Back to Universe
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {universe?.title || 'Universe'} Scenes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {scenes.length} scenes loaded, {filteredScenes.length} shown after filtering
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateScene}
        >
          Create Scene
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        placeholder="Search scenes..."
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

      {filteredScenes.length === 0 ? (
        <Box textAlign="center" my={6}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No scenes found
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {searchTerm
              ? 'No scenes match your search criteria.'
              : 'Start by creating your first scene!'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredScenes.map((scene) => (
            <Grid item xs={12} sm={6} md={4} key={scene.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom noWrap>
                    {scene.title || scene.name || 'Untitled Scene'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {scene.description || 'No description available'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewScene(scene.id)}
                    title="View Scene"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleEditScene(scene.id)}
                    title="Edit Scene"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteScene(scene.id)}
                    title="Delete Scene"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {modalOpen && (
        <SceneModal
          open={modalOpen}
          onClose={handleModalClose}
          universeId={String(safeUniverseId)}
          sceneId={selectedSceneId}
          mode={modalType}
          onSuccess={(data) => {
            console.log(`ScenesPage - Scene ${modalType} successful:`, data);
            try {
              // Store the current scene to prevent it from being lost during refresh
              const currentScene = data;

              // Ensure the universe_id is set correctly on the scene
              if (currentScene && !currentScene.universe_id && safeUniverseId) {
                currentScene.universe_id = safeUniverseId;
                console.log('ScenesPage - Adding missing universe_id to scene:', safeUniverseId);
              }

              // Don't clear scenes - this might trigger validation to run again
              // Instead, immediately add the new scene to current list
              if (currentScene && currentScene.id) {
                console.log('ScenesPage - Immediately adding new scene to state');
                setScenes((prevScenes) => {
                  // Check if scene already exists
                  const exists = prevScenes.some((scene) => scene.id === currentScene.id);
                  if (!exists) {
                    return [...prevScenes, currentScene];
                  }
                  return prevScenes;
                });
              }

              // Force a refresh of scenes for this universe
              console.log('ScenesPage - Refreshing scenes for universe:', safeUniverseId);
              dispatch(fetchScenes(safeUniverseId))
                .then((result) => {
                  console.log('ScenesPage - Refresh scenes result:', result);
                  // Force update scenes with both local and API data
                  if (result.payload && result.payload.scenes) {
                    const apiScenes = result.payload.scenes;
                    setScenes((prevScenes) => {
                      // Merge API scenes with our local scenes
                      const scenesMap = new Map();
                      // Add API scenes first
                      apiScenes.forEach((scene) => {
                        if (scene && scene.id) {
                          scenesMap.set(scene.id, scene);
                        }
                      });
                      // Then add local scenes that might not be in API yet
                      prevScenes.forEach((scene) => {
                        if (scene && scene.id && !scenesMap.has(scene.id)) {
                          scenesMap.set(scene.id, scene);
                        }
                      });
                      // Add our current scene which might not be in either
                      if (currentScene && currentScene.id) {
                        scenesMap.set(currentScene.id, currentScene);
                      }
                      return Array.from(scenesMap.values());
                    });
                  }
                })
                .catch((error) => {
                  console.error('ScenesPage - Error refreshing scenes:', error);
                  // Scene is already added above, no need to add again
                });
            } catch (error) {
              console.error('ScenesPage - Error in scene success handler:', error);
              // Last resort - set the scene directly in state if not already done
              if (data && data.id) {
                // Ensure universe_id is set
                const sceneWithUniverseId = {
                  ...data,
                  universe_id: data.universe_id || safeUniverseId,
                };
                setScenes((prevScenes) => {
                  const exists = prevScenes.some((scene) => scene.id === data.id);
                  if (!exists) {
                    return [...prevScenes, sceneWithUniverseId];
                  }
                  return prevScenes;
                });
              }
            }
          }}
        />
      )}
    </Container>
  );
};

export default ScenesPageWrapper;

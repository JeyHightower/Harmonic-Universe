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
import { safeId } from '../../../services/endpoints.mjs';
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

    // Comprehensive validation check for universeId using safeId utility
    try {
      const safeUniverseId = safeId(universeId);

      // Check if safeId returned the invalid-id string or if it's not a positive number
      const isValidUniverseId =
        safeUniverseId !== 'invalid-id' && typeof safeUniverseId === 'number' && safeUniverseId > 0;

      console.log(
        'ScenesPageWrapper: safeUniverseId =',
        safeUniverseId,
        'isValidUniverseId =',
        isValidUniverseId
      );

      if (!isValidUniverseId) {
        console.log(`Invalid universe ID detected (${universeId}), redirecting to dashboard`);
        navigate('/dashboard', { replace: true });
        return;
      } else {
        setIsValidating(false);
        // Store the validated ID to prevent re-validation
        setValidatedId(universeId);
      }
    } catch (error) {
      console.error('Error validating universe ID:', error);
      navigate('/dashboard', { replace: true });
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

  // Extra safety check - if somehow we still have an invalid ID after all the validations,
  // don't render the component
  if (isNaN(parsedUniverseId) || parsedUniverseId <= 0) {
    console.error(
      'ScenesPageWrapper: Unexpected invalid universe ID after validation:',
      universeId
    );
    return (
      <Box display="flex" justifyContent="center" my={6}>
        <Typography variant="body1" color="error">
          Invalid universe ID. Redirecting to dashboard...
        </Typography>
      </Box>
    );
  }

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
  // Make this a separate effect to ensure it runs on component mount
  const [safeUniverseId, setSafeUniverseId] = useState(null);

  // Initialize safeUniverseId
  useEffect(() => {
    try {
      // Use the safeId utility to validate and normalize the universeId
      const validatedId = safeId(universeId);

      // Check if the ID is valid (not 'invalid-id' string and is a positive number)
      const isValid =
        validatedId !== 'invalid-id' && typeof validatedId === 'number' && validatedId > 0;

      if (isValid) {
        console.log('ScenesPageContent: Valid universeId detected:', validatedId);
        setSafeUniverseId(validatedId);

        // Store the universe ID in localStorage for recovery
        localStorage.setItem('lastViewedUniverseId', validatedId.toString());
      } else {
        console.error('ScenesPageContent: Invalid universeId detected:', universeId);
        setSafeUniverseId(null);
        // Will trigger the redirect in the fetchData effect
      }
    } catch (error) {
      console.error('Error processing universe ID:', error);
      setSafeUniverseId(null);
    }
  }, [universeId]);

  // Add more debug logging for the safe ID
  useEffect(() => {
    console.log('ScenesPageContent: safeUniverseId updated to:', safeUniverseId);
    console.log('Type of safeUniverseId:', typeof safeUniverseId);
  }, [safeUniverseId]);

  // Get scenes from Redux store
  const scenesFromStore = useSelector((state) => state.scenes?.scenes || []);

  // Memoized selector function for universe scenes
  const memoizedUniverseSceneSelector = useMemo(() => {
    return (state) => {
      const scenes = state.scenes?.universeScenes?.[safeUniverseId] || [];
      console.log(
        `ScenesPage - Found ${scenes.length} scenes for universe ${safeUniverseId} in universeScenes collection`
      );
      return scenes;
    };
  }, [safeUniverseId]);

  // Use the memoized selector
  const universeScenes = useSelector(memoizedUniverseSceneSelector);

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
    if (safeUniverseId === null || safeUniverseId === undefined) {
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

    // Only fetch data if safeUniverseId is valid
    if (safeUniverseId) {
      fetchData();
    }
  }, [dispatch, navigate, safeUniverseId, scenes.length, universeId]);

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

  // Handle scene modal success
  const handleModalSuccess = (result) => {
    console.log('ScenesPage - Scene modal success:', result);

    // Refresh scenes for this universe
    if (safeUniverseId) {
      console.log('ScenesPage - Refreshing scenes for universe:', safeUniverseId);
      dispatch(fetchScenes(safeUniverseId));
    }
  };

  // Render UI
  const renderScenesList = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading scenes...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ my: 3 }}>
          {error}
        </Alert>
      );
    }

    if (scenes.length === 0) {
      return (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No scenes found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Create your first scene to get started
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateScene}
          >
            Create Scene
          </Button>
        </Box>
      );
    }

    // Filter and sort scenes
    const filteredScenes = useMemo(() => {
      return scenes
        .filter((scene) => {
          // Filter by search term
          const matchesSearch =
            searchTerm === '' ||
            scene.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            scene.description?.toLowerCase().includes(searchTerm.toLowerCase());

          // Filter by type
          const matchesType =
            typeFilter === 'all' || (scene.scene_type && scene.scene_type === typeFilter);

          // Filter by status
          const matchesStatus =
            statusFilter === 'all' || (scene.status && scene.status === statusFilter);

          return matchesSearch && matchesType && matchesStatus;
        })
        .sort((a, b) => {
          // Sort by selected field
          let valueA, valueB;

          switch (sortBy) {
            case 'name':
              valueA = a.name || '';
              valueB = b.name || '';
              break;
            case 'created':
              valueA = a.created_at || '';
              valueB = b.created_at || '';
              break;
            case 'updated':
              valueA = a.updated_at || '';
              valueB = b.updated_at || '';
              break;
            default:
              valueA = a.name || '';
              valueB = b.name || '';
          }

          // Apply sort direction
          if (sortDirection === 'asc') {
            return valueA.localeCompare(valueB);
          } else {
            return valueB.localeCompare(valueA);
          }
        });
    }, [scenes, searchTerm, typeFilter, statusFilter, sortBy, sortDirection]);

    return (
      <Grid container spacing={3}>
        {filteredScenes.map((scene) => (
          <Grid item xs={12} sm={6} md={4} key={scene.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {scene.name}
                </Typography>
                {scene.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {scene.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <IconButton
                  aria-label="view"
                  color="primary"
                  onClick={() => handleViewScene(scene.id)}
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  aria-label="edit"
                  color="secondary"
                  onClick={() => handleEditScene(scene.id)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  color="error"
                  onClick={() => handleDeleteScene(scene.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" className="scenes-page">
      <Box my={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Scenes {universe && `- ${universe.name}`}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToUniverse}
              sx={{ mr: 2 }}
            >
              Back to Universe
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateScene}
            >
              Create Scene
            </Button>
          </Box>
        </Box>

        <Box mb={4}>
          <TextField
            label="Search scenes"
            variant="outlined"
            fullWidth
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
        </Box>

        {renderScenesList()}
      </Box>

      {/* Scene Modal */}
      {modalOpen && safeUniverseId && (
        <SceneModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          universeId={String(safeUniverseId)}
          sceneId={selectedSceneId ? String(selectedSceneId) : undefined}
          modalType={modalType}
        />
      )}
    </Container>
  );
};

export default ScenesPageWrapper;

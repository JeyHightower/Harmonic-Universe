import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { CharacterFormModal } from "../components/modals";
import apiClient from "../services/api";
import "../components/character/Characters.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchCharactersByUniverse } from "../store/thunks/characterThunks";

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
      universeId !== "undefined" &&
      universeId !== "null" &&
      universeId !== "" &&
      !isNaN(parseInt(universeId, 10)) &&
      parseInt(universeId, 10) > 0;

    if (!isValidUniverseId) {
      console.log(
        `Invalid universe ID detected (${universeId}), redirecting to dashboard`
      );
      navigate("/dashboard", { replace: true });
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
  console.log(
    `CharactersPageWrapper: Rendering for valid universe ID: ${parsedUniverseId}`
  );

  // If universeId is valid, render the main component
  return <CharactersPageContent universeId={parsedUniverseId} />;
};

// Main component with actual content
const CharactersPageContent = ({ universeId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Double-check universeId is valid, even after wrapper validation
  const safeUniverseId = universeId && !isNaN(parseInt(universeId, 10)) && parseInt(universeId, 10) > 0 
    ? parseInt(universeId, 10) 
    : null;

  // Get characters from Redux store
  const charactersFromStore = useSelector(
    (state) => state.characters.characters
  );
  const loadingFromStore = useSelector((state) => state.characters.loading);
  const errorFromStore = useSelector((state) => state.characters.error);

  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universe, setUniverse] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);

  // Update local state when Redux state changes
  useEffect(() => {
    if (charactersFromStore) {
      setCharacters(charactersFromStore);
    }
    if (loadingFromStore !== undefined) {
      setLoading(loadingFromStore);
    }
    if (errorFromStore) {
      setError(errorFromStore);
    }
  }, [charactersFromStore, loadingFromStore, errorFromStore]);

  useEffect(() => {
    // Early return to prevent any API calls if universeId is invalid or null
    if (!safeUniverseId) {
      console.warn(`Invalid universeId for API calls: ${universeId}, skipping data fetch`);
      setLoading(false);
      setError("Invalid universe ID. Redirecting to dashboard.");
      // Additional safety - redirect if we somehow got here with an invalid ID
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      return;
    }

    const fetchData = async () => {
      try {
        console.log(`Fetching data for valid universe ID: ${safeUniverseId}`);
        setLoading(true);
        setError(null);

        // Get universe details
        try {
          const universeResponse = await apiClient.getUniverse(safeUniverseId, {
            includeScenes: true,
          });
          console.log("Universe response:", universeResponse);

          // Add null checks before accessing data
          if (!universeResponse || !universeResponse.data) {
            console.error("Empty response from getUniverse API");
            throw new Error("Failed to fetch universe data");
          }

          // Set universe with fallback to empty object if undefined
          const universeData = universeResponse.data.universe || {};
          console.log("Extracted universe data:", universeData);
          setUniverse(universeData);

          // Improved scene fetching and processing
          let universeScenes = [];

          // First check if scenes are in the universe response
          if (
            universeResponse.data.universe?.scenes &&
            Array.isArray(universeResponse.data.universe.scenes)
          ) {
            console.log(
              "Found scenes in universe response:",
              universeResponse.data.universe.scenes.length
            );
            universeScenes = universeResponse.data.universe.scenes;
          } else if (
            universeResponse.data.scenes &&
            Array.isArray(universeResponse.data.scenes)
          ) {
            console.log(
              "Found scenes at top level of response:",
              universeResponse.data.scenes.length
            );
            universeScenes = universeResponse.data.scenes;
          }

          // If no scenes found in universe response, fetch them directly
          if (universeScenes.length === 0) {
            try {
              console.log(
                "No scenes in universe response, fetching directly for universe",
                safeUniverseId
              );
              const scenesResponse = await apiClient.getUniverseScenes(
                safeUniverseId
              );
              console.log("Direct scenes response:", scenesResponse);

              // Handle various response formats
              if (
                scenesResponse.data?.scenes &&
                Array.isArray(scenesResponse.data.scenes)
              ) {
                console.log(
                  "Found scenes in dedicated scenes array:",
                  scenesResponse.data.scenes.length
                );
                universeScenes = scenesResponse.data.scenes;
              } else if (Array.isArray(scenesResponse.data)) {
                console.log(
                  "Found scenes as direct array:",
                  scenesResponse.data.length
                );
                universeScenes = scenesResponse.data;
              } else if (scenesResponse.data) {
                // Search for any array property that might contain scenes
                console.log("Searching response object for scene arrays");
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
              console.error("Error fetching scenes:", sceneError);
              // Continue with other data fetching even if scenes fail
            }
          }

          // Log the final result of scene fetching
          console.log("Final scenes for universe:", universeScenes);
          setScenes(universeScenes || []);
        } catch (universeErr) {
          console.error(`Error fetching universe ${safeUniverseId}:`, universeErr);
          setError("Failed to load universe details. Please try again.");
          // Initialize with empty data to prevent null errors
          setUniverse({});
          setScenes([]);
          // We'll continue with character fetching even if universe fails
        }

        // Get characters for this universe using Redux thunk action
        try {
          console.log(
            `Fetching characters for universe ID: ${safeUniverseId} from Redux`
          );

          // Dispatch the Redux action to fetch characters with the validated ID
          await dispatch(fetchCharactersByUniverse(safeUniverseId));

          // Characters will be updated via the useEffect that watches charactersFromStore
          console.log("Characters fetched from Redux store");
        } catch (charactersErr) {
          console.error("Error fetching characters from Redux:", charactersErr);
          setError("Failed to load characters. Please try again.");
          // Initialize with empty data to prevent null errors
          setCharacters([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    // Only run fetchData if universeId is valid and defined
    if (safeUniverseId && safeUniverseId > 0) {
      console.log(
        `CharactersPageContent: useEffect triggered with universeId=${safeUniverseId}`
      );
      fetchData();
    } else {
      console.warn(
        `CharactersPageContent: useEffect triggered with invalid universeId=${safeUniverseId}`
      );
      setLoading(false);
      setError("Invalid universe ID");
    }
  }, [safeUniverseId, navigate, dispatch]);

  const handleCreateCharacter = () => {
    console.log("Creating character for universe:", safeUniverseId);
    console.log("Available scenes for character:", scenes);
    setModalType("create");
    setSelectedCharacterId(null);
    setModalOpen(true);
  };

  const handleEditCharacter = (characterId) => {
    setModalType("edit");
    setSelectedCharacterId(characterId);
    setModalOpen(true);
  };

  const handleViewCharacter = (characterId) => {
    setModalType("view");
    setSelectedCharacterId(characterId);
    setModalOpen(true);
  };

  const handleDeleteCharacter = (characterId) => {
    setModalType("delete");
    setSelectedCharacterId(characterId);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Reset modal state
    if (modalType === "create") {
      setSelectedCharacterId(null);
    }
  };

  const handleCharacterSuccess = (updatedCharacter) => {
    // After character operations, refresh characters from Redux
    if (!safeUniverseId) {
      console.error("Cannot refresh characters: universeId is undefined");
      return;
    }

    // Ensure universeId is a number
    const parsedUniverseId = parseInt(safeUniverseId, 10);
    if (isNaN(parsedUniverseId) || parsedUniverseId <= 0) {
      console.error(
        `Invalid universe ID for refreshing characters: ${safeUniverseId}`
      );
      return;
    }

    console.log(`Refreshing characters for universe ID: ${parsedUniverseId}`);
    dispatch(fetchCharactersByUniverse(parsedUniverseId));
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
            Characters need to be placed in a scene. Create your first scene to
            get started.
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBackToUniverse} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Characters {universe ? `for ${universe.name}` : ""}
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
          {error}
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
                  <Typography
                    variant="h6"
                    component="h2"
                    className="character-card-title"
                  >
                    {character.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className="character-card-description"
                  >
                    {character.description || "No description available"}
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

      <CharacterFormModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        characterId={selectedCharacterId}
        universeId={Number(safeUniverseId)}
        type={modalType}
        onSuccess={handleCharacterSuccess}
        availableScenes={scenes}
      />
    </Container>
  );
};

// Export the wrapper component instead
export default CharactersPageWrapper;

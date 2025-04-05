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

// Remove test console.log
// console.log(
//   "CharactersPage hot reload verification - Hot Reloading IS working! " +
//     new Date().toISOString()
// );

// Create a wrapper component that handles redirection logic
const CharactersPageWrapper = () => {
  const { universeId } = useParams();
  const navigate = useNavigate();

  // Check if universeId is valid - more comprehensive check
  const isValidUniverseId =
    universeId &&
    universeId !== "undefined" &&
    universeId !== "null" &&
    !isNaN(parseInt(universeId, 10)) &&
    parseInt(universeId, 10) > 0;

  // If no valid universeId, show loading and redirect
  if (!isValidUniverseId) {
    console.log(
      `Invalid universe ID detected (${universeId}), redirecting to dashboard`
    );

    // Use useEffect to handle navigation side effect
    useEffect(() => {
      console.log("Redirecting to dashboard due to invalid universeId");
      navigate("/dashboard", { replace: true });
    }, [navigate]);

    // Return a loading state instead of immediate redirect
    return (
      <Box
        display="flex"
        justifyContent="center"
        flexDirection="column"
        alignItems="center"
        my={6}
      >
        <CircularProgress />
        <Typography variant="body2" color="textSecondary" mt={2}>
          Redirecting to dashboard...
        </Typography>
      </Box>
    );
  }

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
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universe, setUniverse] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate universeId before making API requests
        if (!universeId || universeId === undefined || universeId === null) {
          console.warn(`Missing universeId for API calls: ${universeId}`);
          setError("Please select a valid universe first.");
          setLoading(false);
          navigate("/dashboard", { replace: true });
          return;
        }

        // Log the universeId being used
        console.log(
          `CharactersPageContent: Fetching data with universeId=${universeId}`
        );

        // Ensure universeId is a valid number
        const parsedUniverseId = parseInt(universeId, 10);
        if (isNaN(parsedUniverseId) || parsedUniverseId <= 0) {
          console.warn(`Invalid universe ID for fetching data: ${universeId}`);
          setError("Please select a valid universe first.");
          setLoading(false);
          navigate("/dashboard", { replace: true });
          return;
        }

        console.log("Fetching data for universe ID:", parsedUniverseId);

        // Get universe details
        try {
          const universeResponse = await apiClient.getUniverse(
            parsedUniverseId,
            {
              includeScenes: true,
            }
          );
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
                parsedUniverseId
              );
              const scenesResponse = await apiClient.getUniverseScenes(
                parsedUniverseId
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
          console.error(
            `Error fetching universe ${parsedUniverseId}:`,
            universeErr
          );
          setError("Failed to load universe details. Please try again.");
          // Initialize with empty data to prevent null errors
          setUniverse({});
          setScenes([]);
          // We'll continue with character fetching even if universe fails
        }

        // Get characters for this universe - only if we have a valid universeId
        try {
          console.log(
            `Fetching characters for universe ID: ${parsedUniverseId}`
          );
          const charactersResponse = await apiClient.getCharactersByUniverse(
            parsedUniverseId
          );

          // Add null checks before accessing data
          if (!charactersResponse || !charactersResponse.data) {
            console.error("Empty response from getCharactersByUniverse API");
            throw new Error("Failed to fetch characters data");
          }

          // Set characters with fallback to empty array if undefined
          const charactersData = charactersResponse.data.characters || [];
          console.log("Extracted characters data:", charactersData);
          setCharacters(charactersData);
          console.log("Successfully loaded characters:", charactersData.length);
        } catch (charactersErr) {
          console.error("Error fetching characters:", charactersErr);
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

    if (universeId) {
      console.log(
        `CharactersPageContent: useEffect triggered with universeId=${universeId}`
      );
      fetchData();
    } else {
      console.warn(
        "CharactersPageContent: useEffect triggered with no universeId"
      );
      setLoading(false);
      setError("No universe selected");
    }
  }, [universeId, navigate]);

  const handleCreateCharacter = () => {
    console.log("Creating character for universe:", universeId);
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
    if (modalType === "create") {
      setCharacters([...characters, updatedCharacter]);
    } else if (modalType === "edit") {
      setCharacters(
        characters.map((char) =>
          char.id === updatedCharacter.id ? updatedCharacter : char
        )
      );
    } else if (modalType === "delete") {
      setCharacters(
        characters.filter((char) => char.id !== selectedCharacterId)
      );
    }
  };

  const handleBackToUniverse = () => {
    navigate(`/universes/${universeId}`);
  };

  const handleCreateScene = () => {
    if (!universeId) return;

    // Open the scene creation modal
    navigate(`/universes/${universeId}/scenes/new`);
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
        universeId={Number(universeId)}
        type={modalType}
        onSuccess={handleCharacterSuccess}
        availableScenes={scenes}
      />
    </Container>
  );
};

// Export the wrapper component instead
export default CharactersPageWrapper;

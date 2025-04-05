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

  // Check if universeId is valid
  const isValidUniverseId =
    universeId && universeId !== "undefined" && universeId !== "null";

  // If no valid universeId, show loading and redirect
  if (!isValidUniverseId) {
    console.log(
      `Invalid universe ID detected (${universeId}), redirecting to dashboard`
    );

    // Return immediate redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If universeId is valid, render the main component
  return <CharactersPageContent universeId={universeId} />;
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
        console.log("Fetching data for universe ID:", universeId);

        // Get universe details
        const universeResponse = await apiClient.getUniverse(universeId, {
          includeScenes: true,
        });
        console.log("Universe response:", universeResponse.data);
        setUniverse(universeResponse.data.universe);

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
              universeId
            );
            const scenesResponse = await apiClient.getUniverseScenes(
              universeId
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
          } catch (err) {
            console.error("Error fetching scenes:", err);
          }
        }

        // Log the final result of scene fetching
        console.log("Final scenes for universe:", universeScenes);
        setScenes(universeScenes || []);

        // Get characters for this universe
        const charactersResponse = await apiClient.getCharactersByUniverse(
          universeId
        );
        setCharacters(charactersResponse.data.characters || []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load characters. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [universeId]);

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

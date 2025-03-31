import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const CharactersPage = () => {
  const { universeId } = useParams();
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
        // Get universe details
        const universeResponse = await apiClient.getUniverse(universeId, {
          includeScenes: true,
        });
        console.log("Universe response:", universeResponse.data);
        setUniverse(universeResponse.data.universe);

        // Check if scenes are included in the universe response
        let universeScenes = [];
        if (universeResponse.data.universe?.scenes) {
          universeScenes = universeResponse.data.universe.scenes;
        } else if (universeResponse.data.scenes) {
          universeScenes = universeResponse.data.scenes;
        }

        // If no scenes found in the universe response, try to fetch them directly
        if (universeScenes.length === 0) {
          try {
            console.log("Fetching scenes for universe", universeId);
            const scenesResponse = await apiClient.getUniverseScenes(
              universeId
            );
            console.log("Scenes response:", scenesResponse.data);
            if (scenesResponse.data.scenes) {
              universeScenes = scenesResponse.data.scenes;
            } else if (Array.isArray(scenesResponse.data)) {
              universeScenes = scenesResponse.data;
            }
          } catch (err) {
            console.error("Error fetching scenes:", err);
          }
        }

        console.log("Available scenes:", universeScenes);
        setScenes(universeScenes);

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

  const filteredCharacters = characters.filter(
    (character) =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (character.description &&
        character.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

export default CharactersPage;

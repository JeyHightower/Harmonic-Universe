import {
  Box,
  Button,
  Container,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { universeService } from "../../services/universeService";

const UniverseForm = ({ universe, isEdit = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: universe?.name || "",
    description: universe?.description || "",
    is_public: universe?.is_public ?? true,
    physics_enabled: universe?.physics_enabled ?? true,
    music_enabled: universe?.music_enabled ?? true,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await universeService.updateUniverse(universe.id, formData);
      } else {
        await universeService.createUniverse(formData);
      }
      navigate("/universes");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? "Edit Universe" : "Create Universe"}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Universe Name"
            name="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            error={!!error}
          />

          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={handleChange}
                  name="is_public"
                />
              }
              label="Make Universe Public"
            />
          </Box>

          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.physics_enabled}
                  onChange={handleChange}
                  name="physics_enabled"
                />
              }
              label="Enable Physics"
            />
          </Box>

          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.music_enabled}
                  onChange={handleChange}
                  name="music_enabled"
                />
              }
              label="Enable Music"
            />
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Universe"
                  : "Create Universe"}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/universes")}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default UniverseForm;

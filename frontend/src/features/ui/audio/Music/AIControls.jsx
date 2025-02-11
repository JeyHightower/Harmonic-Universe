import { AutoFixHigh, Transform } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { musicService } from "../../services/musicService";
import { selectUniverseList } from "../../store/slices/universeSlice";
import styles from "./AIControls.module.css";

const AIControls = ({ currentUniverseId }) => {
  const dispatch = useDispatch();
  const universes = useSelector(selectUniverseList);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceUniverse, setSourceUniverse] = useState("");
  const [complexity, setComplexity] = useState(0.5);
  const [mood, setMood] = useState("neutral");

  const handleGenerateMusic = async () => {
    try {
      setLoading(true);
      setError(null);

      const parameters = {
        complexity,
        mood,
        // Add current physics parameters
        gravity: 9.81, // TODO: Get from physics state
        friction: 0.5,
      };

      const response = await musicService.generateAIMusic(
        currentUniverseId,
        parameters,
      );

      if (response.success) {
        // Update music parameters in store
        dispatch(updateMusicParameters(response.parameters));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleTransfer = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await musicService.applyStyleTransfer(
        sourceUniverse,
        currentUniverseId,
        ["music"],
      );

      if (response.success) {
        dispatch(updateMusicParameters(response.parameters));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Typography variant="h6" gutterBottom>
        AI Music Controls
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Complexity</Typography>
        <Slider
          value={complexity}
          onChange={(_, value) => setComplexity(value)}
          min={0}
          max={1}
          step={0.1}
          marks
          valueLabelDisplay="auto"
          disabled={loading}
        />
      </Box>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Mood</InputLabel>
        <Select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          disabled={loading}
        >
          <MenuItem value="energetic">Energetic</MenuItem>
          <MenuItem value="calm">Calm</MenuItem>
          <MenuItem value="mysterious">Mysterious</MenuItem>
          <MenuItem value="happy">Happy</MenuItem>
          <MenuItem value="sad">Sad</MenuItem>
          <MenuItem value="neutral">Neutral</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="contained"
        startIcon={<AutoFixHigh />}
        onClick={handleGenerateMusic}
        disabled={loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : "Generate Music"}
      </Button>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Style Transfer
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Source Universe</InputLabel>
        <Select
          value={sourceUniverse}
          onChange={(e) => setSourceUniverse(e.target.value)}
          disabled={loading}
        >
          {universes
            .filter((u) => u.id !== currentUniverseId)
            .map((universe) => (
              <MenuItem key={universe.id} value={universe.id}>
                {universe.name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        startIcon={<Transform />}
        onClick={handleStyleTransfer}
        disabled={loading || !sourceUniverse}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : "Apply Style Transfer"}
      </Button>
    </div>
  );
};

export default AIControls;

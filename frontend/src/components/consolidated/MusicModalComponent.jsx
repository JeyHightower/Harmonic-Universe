import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Paper,
  Alert,
  Slider,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import DeleteIcon from '@mui/icons-material/Delete';
import "../../styles/Music.css";
import { Pause, PlayArrow } from '@mui/icons-material';
import { 
  generateMusic, 
  saveMusic, 
  getMusic, 
  deleteMusic 
} from "../../services/api/musicApi";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxWidth: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflow: 'auto'
};

// Default music parameters
const DEFAULT_MUSIC_PARAMS = {
  name: "",
  description: "",
  tempo: 120,
  scale_type: "major",
  root_note: "C",
  melody_complexity: 0.5,
  universe_id: null,
};

// Scale options for the dropdown
const SCALE_OPTIONS = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "harmonic_minor", label: "Harmonic Minor" },
  { value: "melodic_minor", label: "Melodic Minor" },
  { value: "pentatonic", label: "Pentatonic" },
  { value: "blues", label: "Blues" },
  { value: "dorian", label: "Dorian" },
  { value: "phrygian", label: "Phrygian" },
  { value: "lydian", label: "Lydian" },
  { value: "mixolydian", label: "Mixolydian" },
  { value: "locrian", label: "Locrian" },
];

// Root note options for the dropdown
const ROOT_NOTE_OPTIONS = [
  { value: "C", label: "C" },
  { value: "C#", label: "C#" },
  { value: "D", label: "D" },
  { value: "D#", label: "D#" },
  { value: "E", label: "E" },
  { value: "F", label: "F" },
  { value: "F#", label: "F#" },
  { value: "G", label: "G" },
  { value: "G#", label: "G#" },
  { value: "A", label: "A" },
  { value: "A#", label: "A#" },
  { value: "B", label: "B" },
];

/**
 * Consolidated Music Modal Component
 * 
 * A single component that handles creating, editing, generating, viewing, 
 * and deleting music for universes
 * 
 * Replaces:
 * - MusicModal.jsx
 * - MusicGenerationModal.jsx
 * - AudioDetailsModal.jsx (new)
 */
const MusicModalComponent = ({
  open,
  onClose,
  universeId,
  musicId = null,
  onSuccess,
  mode = "create", // 'create', 'edit', 'view', 'delete', or 'generate'
  initialData = {},
}) => {
  const [formData, setFormData] = useState({
    ...DEFAULT_MUSIC_PARAMS,
    universe_id: universeId,
    ...initialData,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(mode === "edit" || mode === "view");
  const [generateInProgress, setGenerateInProgress] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // References for audio playback
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const animationRef = useRef(null);

  // Modal title based on the mode
  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Create New Music";
      case "edit":
        return "Edit Music Settings";
      case "view":
        return "Music Details";
      case "delete":
        return "Delete Music";
      case "generate":
        return "Generate Music";
      default:
        return "Music";
    }
  };

  // Fetch music data if in edit or view mode
  useEffect(() => {
    const fetchMusicData = async () => {
      if (musicId && (mode === "edit" || mode === "view")) {
        try {
          setLoading(true);
          // Use musicApi service instead of direct fetch
          const response = await getMusic(universeId, musicId);
          
          if (response.success) {
            setFormData({
              ...response.data,
              universe_id: universeId,
            });
          } else {
            throw new Error(response.message || 'Failed to load music data');
          }
        } catch (error) {
          console.error("Error fetching music data:", error);
          setErrors({ api: "Failed to load music data. Please try again." });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMusicData();
  }, [musicId, mode, universeId]);

  // Update form data with values from initialData prop
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        universe_id: universeId,
      }));
    }
  }, [initialData, universeId]);

  // Handle input changes and clear errors
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field being changed
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate individual field
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value && mode !== "generate") return "Name is required";
        if (value && value.length > 100) return "Name cannot exceed 100 characters";
        return null;
      case "description":
        if (value && value.length > 500)
          return "Description cannot exceed 500 characters";
        return null;
      case "tempo":
        if (value < 60 || value > 200)
          return "Tempo must be between 60 and 200 BPM";
        return null;
      default:
        return null;
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};

    // Validate each field
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      let response;
      const submitData = { ...formData };

      if (mode === "create" || mode === "edit") {
        // Use musicApi service instead of direct fetch
        response = await saveMusic(universeId, submitData);
        
        if (response.success) {
          setSuccessMessage(`Music ${mode === "create" ? "created" : "updated"} successfully!`);
          if (onSuccess) {
            onSuccess(response.data);
          }
          
          // Close modal after short delay
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          throw new Error(response.message || `Failed to ${mode} music`);
        }
      } else if (mode === "edit") {
        // Use musicApi service instead of direct fetch
        response = await saveMusic(universeId, submitData);
        
        if (response.success) {
          setSuccessMessage("Music updated successfully!");
          if (onSuccess) {
            onSuccess(response.data);
          }
          
          // Close modal after short delay
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          throw new Error(response.message || "Failed to update music");
        }
      }
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} music:`, error);
      setErrors({ api: error.message || `Failed to ${mode} music. Please try again.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle music deletion
  const handleDelete = async () => {
    if (!musicId) {
      setErrors({ api: "No music ID provided for deletion" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Use musicApi service instead of direct fetch
      const response = await deleteMusic(universeId, musicId);
      
      if (response.success) {
        setSuccessMessage("Music deleted successfully!");
        if (onSuccess) {
          onSuccess({ deleted: true, id: musicId });
        }
        
        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to delete music");
      }
    } catch (error) {
      console.error("Error deleting music:", error);
      setErrors({ api: error.message || "Failed to delete music. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle music generation
  const handleGenerate = async () => {
    // Validate essential fields
    const validationErrors = {};
    if (mode === "create" && !formData.name) {
      validationErrors.name = "Name is required for saving generated music";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setGenerateInProgress(true);
    setErrors({});

    try {
      // Build generation parameters
      const genParams = {
        tempo: formData.tempo,
        scale_type: formData.scale_type,
        root_note: formData.root_note,
        melody_complexity: formData.melody_complexity,
        ai_style: formData.ai_style || "default"
      };

      // Use musicApi service instead of direct fetch
      const response = await generateMusic(universeId, genParams);
      
      if (response.success && response.data.music_data) {
        // Update form data with generated music
        setFormData(prev => ({
          ...prev,
          music_data: response.data.music_data
        }));
        
        setSuccessMessage("Music generated successfully!");
        
        // If save after generate is enabled, save the music
        if (formData.save_after_generate) {
          handleSubmit();
        }
      } else {
        throw new Error(response.message || "Failed to generate music");
      }
    } catch (error) {
      console.error("Error generating music:", error);
      setErrors({ api: error.message || "Failed to generate music. Please try again." });
    } finally {
      setGenerateInProgress(false);
    }
  };

  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);

      // Update progress bar
      if (progressRef.current && audioRef.current.duration) {
        const progress =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        progressRef.current.style.width = `${progress}%`;
      }
    }
  };

  // Handle audio duration change
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (progressRef.current) {
      const percentage =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      progressRef.current.style.width = `${percentage}%`;
    }
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  // Format time in MM:SS format
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Handle click on progress bar to seek
  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressRef.current) return;

    const progressContainer = e.currentTarget;
    const bounds = progressContainer.getBoundingClientRect();
    const clickPosition = (e.clientX - bounds.left) / bounds.width;

    const newTime = clickPosition * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (progressRef.current) {
      progressRef.current.style.width = `${clickPosition * 100}%`;
    }
  };

  // Add audio element to cleanup in useEffect
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Initialize audio when in view mode and music data is loaded
  useEffect(() => {
    if (mode === "view" && formData && formData.audio_url && !loading) {
      if (audioRef.current) {
        audioRef.current.src = formData.audio_url;
        audioRef.current.load();
      }
    }
  }, [mode, formData, loading]);

  // Render delete confirmation content
  const renderDeleteContent = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h6" gutterBottom>
          Delete Music
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Are you sure you want to delete this music? This action cannot be undone.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </Box>
      </Box>
    );
  };

  // Render form content
  const renderFormContent = () => {
    const isViewOnly = mode === "view";
    const isGenerateOnly = mode === "generate";

    return (
      <Grid container spacing={3}>
        {successMessage && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          </Grid>
        )}

        {errors.api && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.api}
            </Alert>
          </Grid>
        )}

        {/* Only show name and description for create/edit/view modes */}
        {!isGenerateOnly && (
          <>
            <Grid item xs={12}>
              <TextField
                label="Name"
                fullWidth
                required={mode !== "view"}
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={isViewOnly}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                disabled={isViewOnly}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            label="Tempo (BPM)"
            type="number"
            fullWidth
            value={formData.tempo || 120}
            onChange={(e) => handleInputChange("tempo", parseInt(e.target.value))}
            InputProps={{ inputProps: { min: 60, max: 200 } }}
            error={!!errors.tempo}
            helperText={errors.tempo}
            disabled={isViewOnly}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={isViewOnly}>
            <InputLabel id="scale-type-label">Scale Type</InputLabel>
            <Select
              labelId="scale-type-label"
              value={formData.scale_type || "major"}
              label="Scale Type"
              onChange={(e) => handleInputChange("scale_type", e.target.value)}
            >
              {SCALE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={isViewOnly}>
            <InputLabel id="root-note-label">Root Note</InputLabel>
            <Select
              labelId="root-note-label"
              value={formData.root_note || "C"}
              label="Root Note"
              onChange={(e) => handleInputChange("root_note", e.target.value)}
            >
              {ROOT_NOTE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography id="melody-complexity-slider" gutterBottom>
            Melody Complexity
          </Typography>
          <Slider
            aria-labelledby="melody-complexity-slider"
            value={formData.melody_complexity || 0.5}
            min={0}
            max={1}
            step={0.1}
            onChange={(_, value) => handleInputChange("melody_complexity", value)}
            marks={[
              { value: 0, label: 'Simple' },
              { value: 1, label: 'Complex' }
            ]}
            disabled={isViewOnly}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSubmitting || generateInProgress}>
              Cancel
            </Button>

            {!isViewOnly && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || generateInProgress}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 
                  (mode === "create" ? "Create" : 
                  mode === "edit" ? "Update" : 
                  mode === "generate" ? "Generate" : "Submit")}
              </Button>
            )}

            {(mode === "create" || mode === "edit" || mode === "generate") && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<MusicNoteIcon />}
                onClick={handleGenerate}
                disabled={isSubmitting || generateInProgress}
              >
                {generateInProgress ? <CircularProgress size={24} /> : "Generate Music"}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    );
  };

  // Add rendering for audio player in View mode
  const renderViewContent = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {/* Music Details */}
        <Typography variant="h6" gutterBottom>
          {formData.name}
        </Typography>
        
        {formData.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {formData.description}
          </Typography>
        )}
        
        {/* Audio Player */}
        <Box sx={{ mt: 3 }}>
          <audio
            ref={audioRef}
            style={{ display: "none" }}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onEnded={handleEnded}
          >
            <source src={formData.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          
          {/* Player controls */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <IconButton onClick={handlePlayPause} color="primary">
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            
            <Box 
              sx={{ 
                flexGrow: 1, 
                mx: 2, 
                height: "12px", 
                bgcolor: "rgba(0,0,0,0.1)",
                borderRadius: 1,
                overflow: "hidden",
                cursor: "pointer"
              }}
              onClick={handleProgressClick}
            >
              <Box
                ref={progressRef}
                sx={{
                  height: "100%",
                  width: "0%",
                  bgcolor: "primary.main",
                  transition: "width 0.1s"
                }}
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Box>
        </Box>
        
        {/* Music Parameters */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Music Parameters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Tempo
              </Typography>
              <Typography variant="body1">
                {formData.tempo || '-'} BPM
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Key
              </Typography>
              <Typography variant="body1">
                {formData.key || '-'}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Scale
              </Typography>
              <Typography variant="body1">
                {formData.scale ? formData.scale.charAt(0).toUpperCase() + formData.scale.slice(1) : '-'}
              </Typography>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Algorithm
              </Typography>
              <Typography variant="body1">
                {formData.algorithm ? formData.algorithm.replace(/_/g, ' ') : '-'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={onClose}
          >
            Close
          </Button>
          
          <Box>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => {
                onClose();
                // Here you could add logic to open edit mode if needed
              }}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  // Update rendering based on mode to include view content
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (errors.api) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.api}
        </Alert>
      );
    }

    switch (mode) {
      case "delete":
        return renderDeleteContent();
      case "view":
        return renderViewContent();
      default:
        return renderFormContent();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="music-modal-title"
    >
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography id="music-modal-title" variant="h5" component="h2">
            <MusicNoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {getModalTitle()}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {renderContent()}
      </Box>
    </Modal>
  );
};

export default MusicModalComponent; 
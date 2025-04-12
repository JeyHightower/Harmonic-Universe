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
import "../styles/Music.css";
import { Pause, PlayArrow } from '@mui/icons-material';
import { 
  generateMusic, 
  saveMusic, 
  getMusic, 
  deleteMusic 
} from "../../../services/api/musicApi";

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
 * Music Modal Component
 * 
 * A single component that handles creating, editing, generating, viewing, 
 * and deleting music for universes
 */
const MusicModal = ({
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
  
  // Validate a single field
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        return value.trim() ? "" : "Name is required";
      case "tempo":
        return value >= 20 && value <= 300 ? "" : "Tempo must be between 20 and 300";
      case "melody_complexity":
        return value >= 0 && value <= 1 ? "" : "Melody complexity must be between 0 and 1";
      default:
        return "";
    }
  };
  
  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    newErrors.name = validateField("name", formData.name);
    newErrors.tempo = validateField("tempo", formData.tempo);
    newErrors.melody_complexity = validateField("melody_complexity", formData.melody_complexity);
    
    setErrors(newErrors);
    
    // Return true if no errors (all empty strings)
    return Object.values(newErrors).every((error) => !error);
  };

  // Submit the form
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    try {
      // Use musicApi service instead of direct fetch
      const response = await saveMusic(universeId, {
        ...formData,
        universe_id: universeId,
      }, musicId);

      if (response.success) {
        setSuccessMessage("Music saved successfully!");
        if (onSuccess) {
          onSuccess(response.data);
        }
        // Close after a short delay so the user can see the success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to save music');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ api: "Failed to save music. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete music
  const handleDelete = async () => {
    if (!musicId) {
      setErrors({ api: "Cannot delete: No music ID provided." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Use musicApi service instead of direct fetch
      const response = await deleteMusic(universeId, musicId);
      
      if (response.success) {
        setSuccessMessage("Music deleted successfully!");
        if (onSuccess) {
          onSuccess({ deleted: true });
        }
        // Close after a short delay so the user can see the success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to delete music');
      }
    } catch (error) {
      console.error("Error deleting music:", error);
      setErrors({ api: "Failed to delete music. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate music
  const handleGenerate = async () => {
    if (!validateForm()) {
      return;
    }
    
    setGenerateInProgress(true);
    setErrors({});
    try {
      // Use musicApi service instead of direct fetch
      const response = await generateMusic(universeId, {
        ...formData,
        universe_id: universeId,
      });
      
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          ...response.data,
        }));
        setSuccessMessage("Music generated successfully!");
        
        // Play the audio automatically
        if (audioRef.current && response.data.audio_url) {
          setTimeout(() => {
            audioRef.current.load();
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(e => console.error("Error playing audio", e));
          }, 100);
        }
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error(response.message || 'Failed to generate music');
      }
    } catch (error) {
      console.error("Error generating music:", error);
      setErrors({ api: "Failed to generate music. Please try again." });
    } finally {
      setGenerateInProgress(false);
    }
  };
  
  // Audio player event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Update progress bar
      if (progressRef.current && duration) {
        const percent = (time / duration) * 100;
        progressRef.current.style.width = `${percent}%`;
      }
    }
  };
  
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (progressRef.current) {
      progressRef.current.style.width = "0%";
    }
    cancelAnimationFrame(animationRef.current);
  };
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Error playing audio", e));
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const updateProgress = () => {
    if (audioRef.current && progressRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      // Update progress bar
      if (duration) {
        const percent = (time / duration) * 100;
        progressRef.current.style.width = `${percent}%`;
      }
      
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handleProgressClick = (e) => {
    if (audioRef.current && duration) {
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      
      // Set time based on click position
      audioRef.current.currentTime = pos * duration;
      
      // Update UI
      if (progressRef.current) {
        progressRef.current.style.width = `${pos * 100}%`;
      }
      
      // If we're not already playing and we click the progress bar, start playing
      if (!isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            animationRef.current = requestAnimationFrame(updateProgress);
          })
          .catch(e => console.error("Error playing audio", e));
      }
    }
  };
  
  // Delete confirmation content
  const renderDeleteContent = () => {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" paragraph>
          Are you sure you want to delete this music?
        </Typography>
        <Typography variant="body2" color="error" paragraph>
          This action cannot be undone.
        </Typography>
        
        {/* Music details */}
        <Box sx={{ my: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Name:</strong> {formData.name}
          </Typography>
          {formData.description && (
            <Typography variant="body2">
              <strong>Description:</strong> {formData.description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>
    );
  };
  
  // Create/Edit form content
  const renderFormContent = () => {
    return (
      <Box component="form" sx={{ mt: 2 }}>
        {/* Name */}
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
          disabled={isSubmitting}
        />
        
        {/* Description */}
        <TextField
          fullWidth
          margin="normal"
          label="Description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          multiline
          rows={3}
          disabled={isSubmitting}
        />
        
        <Box sx={{ mt: 3 }}>
          <Typography gutterBottom>
            Music Parameters
          </Typography>
          
          <Grid container spacing={2}>
            {/* Tempo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!errors.tempo}>
                <TextField
                  label="Tempo (BPM)"
                  value={formData.tempo}
                  onChange={(e) => handleInputChange("tempo", Number(e.target.value))}
                  type="number"
                  inputProps={{
                    min: 20,
                    max: 300,
                    step: 1,
                  }}
                  error={!!errors.tempo}
                  helperText={errors.tempo}
                  disabled={isSubmitting}
                />
              </FormControl>
            </Grid>
            
            {/* Root Note */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="root-note-label">Root Note</InputLabel>
                <Select
                  labelId="root-note-label"
                  value={formData.root_note}
                  onChange={(e) => handleInputChange("root_note", e.target.value)}
                  label="Root Note"
                  disabled={isSubmitting}
                >
                  {ROOT_NOTE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Scale Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="scale-type-label">Scale Type</InputLabel>
                <Select
                  labelId="scale-type-label"
                  value={formData.scale_type}
                  onChange={(e) => handleInputChange("scale_type", e.target.value)}
                  label="Scale Type"
                  disabled={isSubmitting}
                >
                  {SCALE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Melody Complexity */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!errors.melody_complexity}>
                <Typography id="melody-complexity-label" gutterBottom>
                  Melody Complexity
                </Typography>
                <Slider
                  aria-labelledby="melody-complexity-label"
                  value={formData.melody_complexity}
                  onChange={(_, value) => handleInputChange("melody_complexity", value)}
                  min={0}
                  max={1}
                  step={0.01}
                  valueLabelDisplay="auto"
                  disabled={isSubmitting}
                />
                {errors.melody_complexity && (
                  <FormHelperText>{errors.melody_complexity}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        
        {/* Audio player if we have an audio URL */}
        {formData.audio_url && (
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>
              Preview
            </Typography>
            
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
        )}
        
        {/* Action buttons */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Generate button (for create mode) */}
            {(mode === "create" || mode === "generate") && (
              <Button
                onClick={handleGenerate}
                variant="contained"
                color="secondary"
                disabled={isSubmitting || generateInProgress}
                startIcon={generateInProgress ? <CircularProgress size={20} /> : <MusicNoteIcon />}
              >
                Generate
              </Button>
            )}
            
            {/* Save button */}
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={isSubmitting || generateInProgress}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };
  
  // View content
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
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Music Parameters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Tempo:</strong> {formData.tempo} BPM
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Root Note:</strong> {formData.root_note}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Scale:</strong> {formData.scale_type?.replace(/_/g, " ")}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Complexity:</strong> {(formData.melody_complexity * 100).toFixed(0)}%
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
          
          {/* Additional actions for view mode */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={() => window.open(formData.audio_url, "_blank")}
              variant="outlined"
              color="primary"
              disabled={!formData.audio_url}
            >
              Download
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };
  
  // Render appropriate content based on mode
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    switch (mode) {
      case "create":
      case "edit":
      case "generate":
        return renderFormContent();
      case "view":
        return renderViewContent();
      case "delete":
        return renderDeleteContent();
      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={!isSubmitting ? onClose : undefined}
      aria-labelledby="music-modal-title"
    >
      <Box sx={modalStyle}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography id="music-modal-title" variant="h6">
            {getModalTitle()}
          </Typography>
          
          {!isSubmitting && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Error message */}
        {errors.api && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.api}
          </Alert>
        )}
        
        {/* Success message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        {/* Modal content */}
        {renderContent()}
      </Box>
    </Modal>
  );
};

export default MusicModal; 
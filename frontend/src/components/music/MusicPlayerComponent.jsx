import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Stack
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Download,
  Visibility,
  Info,
  Settings,
  Sync,
  SkipNext,
  SkipPrevious
} from "@mui/icons-material";
import * as Tone from "tone";
import { MODAL_TYPES } from "../../constants/modalTypes";
import { createVisualizer, drawVisualization } from "../../utils/visualizerUtils";
import "../../styles/Music.css";

/**
 * Consolidated Music Player Component
 * 
 * A component for playing, visualizing, and generating music
 * Replaces the original MusicPlayer with a more maintainable implementation.
 */
const MusicPlayerComponent = ({
  universeId,
  initialMusic = null,
  onMusicGenerated = null,
  mode = "standard", // "standard", "minimal", "visualizer-only"
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicData, setMusicData] = useState(initialMusic);
  const [volume, setVolume] = useState(75);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiStyle, setAiStyle] = useState("default");
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [customParams, setCustomParams] = useState({
    tempo: 120,
    scale_type: "major",
    root_note: "C",
    melody_complexity: 0.5,
  });
  const [visualizationType, setVisualizationType] = useState("2D"); // '2D' or '3D'
  const [showMusicInfoModal, setShowMusicInfoModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // References for Tone.js instruments and sequences
  const synthRef = useRef(null);
  const sequenceRef = useRef(null);
  const visualizerRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize Tone.js on user interaction
  const initializeTone = async () => {
    try {
      console.log("Initializing Tone.js...");
      // Only start AudioContext after user interaction
      if (Tone.context.state !== "running") {
        await Tone.start();
        console.log("Tone.js AudioContext started successfully");
        setAudioContextInitialized(true);
      }

      // Initialize instruments
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();

      // Set initial volume
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);

      // Set up analyzer for visualizations
      analyzerRef.current = new Tone.Analyser("waveform", 128);
      synthRef.current.connect(analyzerRef.current);

      return true;
    } catch (error) {
      console.error("Error initializing Tone.js:", error);
      setError("Failed to initialize audio. Please try again.");
      return false;
    }
  };

  // Initialize Tone.js
  useEffect(() => {
    // Create a polyphonic synth
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();

    // Set initial volume
    synthRef.current.volume.value = Tone.gainToDb(volume / 100);

    // Setup analyzer for visualization
    analyzerRef.current = new Tone.Analyser("waveform", 128);
    synthRef.current.connect(analyzerRef.current);

    // Clean up on unmount
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
    }
  }, [volume]);

  // Setup visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzerRef.current) return;
    
    // Initialize the visualizer
    const visualizer = createVisualizer(canvas);
    visualizerRef.current = visualizer;
    
    // Animation loop for the visualizer
    const animate = () => {
      if (isPlaying && analyzerRef.current) {
        const dataArray = analyzerRef.current.getValue();
        drawVisualization(canvas, dataArray, visualizerRef.current, musicData);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, musicData]);

  // Generate music with specified parameters
  const generateMusic = async (params = null) => {
    await initializeTone();

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Stop any existing playback
      if (isPlaying) {
        await togglePlayback();
      }

      // Use provided params or the current customParams
      const musicParams =
        params || (customizationEnabled ? customParams : null);

      // Build query parameters
      let queryParams = "";
      if (musicParams && customizationEnabled) {
        queryParams = `?custom_params=${encodeURIComponent(
          JSON.stringify(musicParams)
        )}`;
      }

      // Add AI parameters if enabled
      if (aiEnabled) {
        const aiParams = queryParams ? "&" : "?";
        queryParams += `${aiParams}ai_style=${aiStyle}`;
      }

      // Make API request to generate music using the new endpoint directly
      const url = `/api/universes/${universeId}/generate-music${queryParams}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.music_data) {
        setMusicData(data.music_data);
        setSuccessMessage("Music generated successfully");

        // Call the callback if provided
        if (onMusicGenerated) {
          onMusicGenerated(data.music_data);
        }

        // Auto-play the generated music
        await createMusicSequence(data.music_data);
        await togglePlayback(true);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("No music data received from the server");
      }
    } catch (error) {
      console.error("Error generating music:", error);
      setError(
        error.response?.data?.error || 
        error.message || 
        "Failed to generate music. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Download generated music as an audio file
  const downloadMusic = async () => {
    if (!musicData) {
      setError("No music data available to download");
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);

      // Call our new endpoint directly to generate downloadable audio
      const response = await fetch(`/api/universes/${universeId}/download-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          music_data: musicData,
          format: 'mp3'
        })
      });

      const data = await response.json();
      
      // Get download URL
      const downloadUrl = data.download_url;
      
      if (downloadUrl) {
        // Create a temporary anchor element for download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `harmonic_universe_${universeId}_${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSuccessMessage("Music downloaded successfully");
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("No download URL received from the server");
      }
    } catch (error) {
      console.error("Error downloading music:", error);
      setError(
        error.response?.data?.error || 
        error.message || 
        "Failed to download music. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Create a Tone.js sequence from the provided music data
  const createMusicSequence = (data) => {
    if (!data || !data.melody || !data.melody.length) {
      setError("Invalid music data");
      return;
    }

    try {
      // Dispose of existing sequence if any
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }

      // Initialize Tone.js if not already
      if (!audioContextInitialized) {
        initializeTone();
      }

      // Calculate timings
      const tempo = data.tempo || 120;
      Tone.Transport.bpm.value = tempo;

      // Create new sequence
      const melody = data.melody;
      
      sequenceRef.current = new Tone.Sequence(
        (time, note) => {
          synthRef.current.triggerAttackRelease(
            Tone.Frequency(note.note, "midi").toFrequency(),
            note.duration,
            time,
            note.velocity
          );
        },
        melody.map(n => ({ 
          note: n.note, 
          duration: n.duration, 
          velocity: n.velocity || 0.7 
        })),
        "8n"
      );

      // Start transport if not started
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start();
      }

      sequenceRef.current.loop = true;
      
      return true;
    } catch (error) {
      console.error("Error creating music sequence:", error);
      setError("Failed to create music sequence");
      return false;
    }
  };

  // Toggle playback of the current music
  const togglePlayback = async (forcedState = null) => {
    if (!audioContextInitialized) {
      const initialized = await initializeTone();
      if (!initialized) return;
    }

    const targetState = forcedState !== null ? forcedState : !isPlaying;
    
    try {
      if (targetState) {
        // Start playback
        if (!musicData) {
          // Generate music if none exists
          await generateMusic();
          return;
        }

        if (!sequenceRef.current && musicData) {
          // Create sequence if not exists
          createMusicSequence(musicData);
        }

        if (sequenceRef.current) {
          sequenceRef.current.start(0);
        }
      } else {
        // Stop playback
        if (sequenceRef.current) {
          sequenceRef.current.stop();
        }
      }

      setIsPlaying(targetState);
    } catch (error) {
      console.error("Error toggling playback:", error);
      setError("Failed to toggle playback");
    }
  };

  // Handle parameter changes for music generation
  const handleParamChange = (param, value) => {
    setCustomParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Toggle between 2D and 3D visualization
  const toggleVisualizationType = () => {
    setVisualizationType(prev => prev === '2D' ? '3D' : '2D');
  };

  // Show music info modal
  const handleShowMusicInfo = () => {
    setShowMusicInfoModal(true);
  };

  // Convert MIDI note number to note name
  const getNoteNameFromMidi = (midiNote) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    return notes[noteIndex] + octave;
  };

  // Render the main control panel
  const renderControls = () => {
    return (
      <Stack spacing={2} sx={{ p: 2 }}>
        {/* Playback controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <IconButton 
            color="primary" 
            onClick={() => togglePlayback()}
            disabled={isLoading}
            size="large"
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={generateMusic}
            disabled={isLoading}
            size="large"
          >
            <Sync />
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={downloadMusic}
            disabled={isLoading || isDownloading || !musicData}
            size="large"
          >
            <Download />
          </IconButton>
        </Box>
        
        {/* Volume slider */}
        <Box sx={{ px: 3 }}>
          <Typography id="volume-slider" gutterBottom>
            Volume
          </Typography>
          <Slider
            value={volume}
            onChange={(_, newValue) => setVolume(newValue)}
            aria-labelledby="volume-slider"
            valueLabelDisplay="auto"
            min={0}
            max={100}
          />
        </Box>
        
        {/* Additional controls for standard mode */}
        {mode === "standard" && (
          <>
            <Divider />
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={customizationEnabled}
                    onChange={(e) => setCustomizationEnabled(e.target.checked)}
                  />
                }
                label="Customization"
              />
              
              {customizationEnabled && (
                <Box sx={{ mt: 2, mx: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>Tempo</Typography>
                      <Slider
                        value={customParams.tempo}
                        onChange={(_, newValue) => handleParamChange('tempo', newValue)}
                        min={60}
                        max={180}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>Complexity</Typography>
                      <Slider
                        value={customParams.melody_complexity}
                        onChange={(_, newValue) => handleParamChange('melody_complexity', newValue)}
                        min={0}
                        max={1}
                        step={0.1}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="scale-type-label">Scale</InputLabel>
                        <Select
                          labelId="scale-type-label"
                          value={customParams.scale_type}
                          label="Scale"
                          onChange={(e) => handleParamChange('scale_type', e.target.value)}
                        >
                          <MenuItem value="major">Major</MenuItem>
                          <MenuItem value="minor">Minor</MenuItem>
                          <MenuItem value="pentatonic">Pentatonic</MenuItem>
                          <MenuItem value="blues">Blues</MenuItem>
                          <MenuItem value="chromatic">Chromatic</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="root-note-label">Root Note</InputLabel>
                        <Select
                          labelId="root-note-label"
                          value={customParams.root_note}
                          label="Root Note"
                          onChange={(e) => handleParamChange('root_note', e.target.value)}
                        >
                          {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                            <MenuItem key={note} value={note}>{note}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                  />
                }
                label="AI Style"
              />
              
              {aiEnabled && (
                <Box sx={{ mt: 2, mx: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel id="ai-style-label">Style</InputLabel>
                    <Select
                      labelId="ai-style-label"
                      value={aiStyle}
                      label="Style"
                      onChange={(e) => setAiStyle(e.target.value)}
                    >
                      <MenuItem value="default">Default</MenuItem>
                      <MenuItem value="epic">Epic</MenuItem>
                      <MenuItem value="ambient">Ambient</MenuItem>
                      <MenuItem value="jazz">Jazz</MenuItem>
                      <MenuItem value="classical">Classical</MenuItem>
                      <MenuItem value="electronic">Electronic</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
          </>
        )}
      </Stack>
    );
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ m: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Canvas for visualization */}
      <Box 
        sx={{ 
          width: '100%', 
          height: 200, 
          bgcolor: 'rgba(0, 0, 0, 0.05)', 
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          mb: 2
        }}
      >
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={200} 
          style={{ 
            width: '100%', 
            height: '100%',
            display: visualizationType === '2D' ? 'block' : 'none'
          }}
        />
        
        {visualizationType === '3D' && (
          <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0 }}>
            {/* 3D visualization would go here */}
            <Typography 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                color: 'text.secondary' 
              }}
            >
              3D Visualization
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Controls */}
      {renderControls()}
    </Card>
  );
};

export default MusicPlayerComponent; 
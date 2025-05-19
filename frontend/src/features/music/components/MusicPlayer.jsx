import { Download, Pause, PlayArrow, Sync, Visibility } from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { initializeAudioContext, isAudioContextReady } from '../../../utils/audioManager';
import { createVisualizer, drawVisualization } from '../../../utils/visualizerUtils';
import '../styles/Music.css';

// Define window globals to fix ESLint errors
const { requestAnimationFrame, cancelAnimationFrame } = window;

/**
 * Music Player Component
 *
 * A component for playing, visualizing, and generating music
 */
const MusicPlayer = ({
  universeId,
  initialMusic = null,
  onMusicGenerated = null,
  mode = 'standard', // "standard", "minimal", "visualizer-only"
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
  const [aiStyle, setAiStyle] = useState('default');
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [customParams, setCustomParams] = useState({
    tempo: 120,
    scale_type: 'major',
    root_note: 'C',
    melody_complexity: 0.5,
  });
  const [visualizationType, setVisualizationType] = useState('2D'); // '2D' or '3D'
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
      // Use our audio manager to initialize AudioContext safely
      const success = await initializeAudioContext();

      if (!success) {
        throw new Error('Failed to initialize audio context');
      }

      if (!synthRef.current) {
        // Create synthesizer
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sine',
          },
          envelope: {
            attack: 0.05,
            decay: 0.3,
            sustain: 0.6,
            release: 1,
          },
        }).toDestination();

        // Set volume
        synthRef.current.volume.value = Tone.gainToDb(volume / 100);
      }

      // Create analyzer for visualization
      if (!analyzerRef.current) {
        analyzerRef.current = new Tone.Analyser('waveform', 128);
        synthRef.current.connect(analyzerRef.current);
      }

      setAudioContextInitialized(true);
      return true;
    } catch (error) {
      console.error('Failed to start audio context:', error);
      setError('Failed to start audio playback. Please try again.');
      return false;
    }
  };

  // Effect to update synth volume when it changes
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume / 100);
    }
  }, [volume]);

  // Initialize visualizer when canvas is ready
  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = createVisualizer(canvasRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }

      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  // Update visualizer when playing state changes
  useEffect(() => {
    if (isPlaying && analyzerRef.current && visualizerRef.current) {
      const updateVisualizer = () => {
        const data = analyzerRef.current.getValue();
        drawVisualization(visualizerRef.current, data, visualizationType);
        animationRef.current = requestAnimationFrame(updateVisualizer);
      };

      updateVisualizer();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, visualizationType]);

  // Create a music sequence from the provided data
  const createMusicSequence = (data) => {
    if (!data || !data.melody || !data.melody.length) {
      setError('Invalid music data');
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
            Tone.Frequency(note.note, 'midi').toFrequency(),
            note.duration,
            time,
            note.velocity
          );
        },
        melody.map((n) => ({
          note: n.note,
          duration: n.duration,
          velocity: n.velocity || 0.7,
        })),
        '8n'
      );

      // Start transport if not started
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
      }

      sequenceRef.current.loop = true;

      return true;
    } catch (error) {
      console.error('Error creating music sequence:', error);
      setError('Failed to create music sequence');
      return false;
    }
  };

  // Toggle playback of the current music
  const togglePlayback = async (forcedState = null) => {
    // Initialize Tone.js on user interaction
    if (!audioContextInitialized || !isAudioContextReady()) {
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
      console.error('Error toggling playback:', error);
      setError('Failed to toggle playback');
    }
  };

  // Generate music based on parameters
  const generateMusic = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Initialize audio context if needed
      if (!audioContextInitialized || !isAudioContextReady()) {
        const initialized = await initializeTone();
        if (!initialized) {
          throw new Error('Failed to initialize audio context');
        }
      }

      // Stop any current playback
      if (isPlaying) {
        await togglePlayback(false);
      }

      // Call your music generation API with parameters
      const params = {
        universe_id: universeId,
        ...customParams,
        ai_style: aiEnabled ? aiStyle : null,
      };

      // Example API call (replace with your actual API)
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate music');
      }

      const data = await response.json();

      // Update state with the generated music
      setMusicData(data);

      // Notify parent component if callback provided
      if (onMusicGenerated) {
        onMusicGenerated(data);
      }

      // Create and play the sequence
      const sequenceCreated = createMusicSequence(data);
      if (sequenceCreated) {
        togglePlayback(true);
        setSuccessMessage('Music generated successfully!');
      }
    } catch (error) {
      console.error('Error generating music:', error);
      setError('Failed to generate music. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download the current music as MIDI
  const downloadMusic = async () => {
    if (!musicData) {
      setError('No music to download');
      return;
    }

    setIsDownloading(true);

    try {
      // Example download logic (replace with your actual implementation)
      const response = await fetch(`/api/music/${musicData.id}/download`);
      if (!response.ok) {
        throw new Error('Failed to download music');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${musicData.name || 'harmonic-universe-music'}.mid`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('Music downloaded successfully!');
    } catch (error) {
      console.error('Error downloading music:', error);
      setError('Failed to download music. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle parameter changes for music generation
  const handleParamChange = (param, value) => {
    setCustomParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  // Toggle between 2D and 3D visualization
  const toggleVisualizationType = () => {
    setVisualizationType((prev) => (prev === '2D' ? '3D' : '2D'));
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

          <IconButton color="primary" onClick={generateMusic} disabled={isLoading} size="large">
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
        {mode === 'standard' && (
          <>
            <Divider />

            <Box sx={{ px: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={customizationEnabled}
                    onChange={(e) => setCustomizationEnabled(e.target.checked)}
                  />
                }
                label="Advanced Options"
              />
            </Box>

            {/* Advanced options when enabled */}
            {customizationEnabled && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Music Parameters
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel id="scale-type-label">Scale</InputLabel>
                      <Select
                        labelId="scale-type-label"
                        value={customParams.scale_type}
                        label="Scale"
                        onChange={(e) => handleParamChange('scale_type', e.target.value)}
                      >
                        <MenuItem value="major">Major</MenuItem>
                        <MenuItem value="minor">Minor</MenuItem>
                        <MenuItem value="harmonic_minor">Harmonic Minor</MenuItem>
                        <MenuItem value="pentatonic">Pentatonic</MenuItem>
                        <MenuItem value="blues">Blues</MenuItem>
                        <MenuItem value="chromatic">Chromatic</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel id="root-note-label">Root</InputLabel>
                      <Select
                        labelId="root-note-label"
                        value={customParams.root_note}
                        label="Root"
                        onChange={(e) => handleParamChange('root_note', e.target.value)}
                      >
                        <MenuItem value="C">C</MenuItem>
                        <MenuItem value="C#">C#</MenuItem>
                        <MenuItem value="D">D</MenuItem>
                        <MenuItem value="D#">D#</MenuItem>
                        <MenuItem value="E">E</MenuItem>
                        <MenuItem value="F">F</MenuItem>
                        <MenuItem value="F#">F#</MenuItem>
                        <MenuItem value="G">G</MenuItem>
                        <MenuItem value="G#">G#</MenuItem>
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="A#">A#</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 2 }}>
                  <Typography id="tempo-slider" gutterBottom variant="body2">
                    Tempo: {customParams.tempo} BPM
                  </Typography>
                  <Slider
                    value={customParams.tempo}
                    onChange={(_, newValue) => handleParamChange('tempo', newValue)}
                    aria-labelledby="tempo-slider"
                    min={60}
                    max={240}
                    step={1}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography id="complexity-slider" gutterBottom variant="body2">
                    Melody Complexity: {(customParams.melody_complexity * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={customParams.melody_complexity}
                    onChange={(_, newValue) => handleParamChange('melody_complexity', newValue)}
                    aria-labelledby="complexity-slider"
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <IconButton
                    onClick={toggleVisualizationType}
                    size="small"
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" component="span">
                    Visualization: {visualizationType}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box>
              <FormControlLabel
                control={
                  <Switch checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
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
          mb: 2,
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          style={{
            width: '100%',
            height: '100%',
            display: visualizationType === '2D' ? 'block' : 'none',
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
                color: 'text.secondary',
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

MusicPlayer.propTypes = {
  universeId: PropTypes.string,
  initialMusic: PropTypes.object,
  onMusicGenerated: PropTypes.func,
  mode: PropTypes.string,
};

MusicPlayer.defaultProps = {
  universeId: '',
  initialMusic: null,
  onMusicGenerated: () => {},
  mode: 'standalone',
};

export default MusicPlayer;

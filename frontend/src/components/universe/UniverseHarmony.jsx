import {
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Slider,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export const UniverseHarmony = ({ universe, onExport, socket, onUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(null);
  const sequenceRef = useRef(null);
  const [harmonyParams, setHarmonyParams] = useState({
    resonance: 1.0,
    dissonance: 0.2,
    harmony_scale: 1.5,
    balance: 0.6,
    base_frequency: 440,
    tempo: 120,
    volume: 0.7,
  });

  useEffect(() => {
    if (universe?.harmony_params) {
      setHarmonyParams(universe.harmony_params);
    }
  }, [universe]);

  useEffect(() => {
    // Initialize Tone.js synth with effects
    const reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).toDestination();
    const delay = new Tone.FeedbackDelay('8n', 0.3).connect(reverb);
    const synth = new Tone.PolySynth(Tone.Synth).connect(delay);
    synthRef.current = synth;

    return () => {
      synth.dispose();
      delay.dispose();
      reverb.dispose();
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, []);

  const generateScale = useCallback(baseFreq => {
    const ratios = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2]; // Major scale ratios
    return ratios.map(ratio => baseFreq * ratio);
  }, []);

  const generateHarmony = useCallback(() => {
    if (!synthRef.current || !universe?.physics_params || !universe?.harmony_params) return;

    // Base frequency modulation based on physics parameters
    const baseFreq =
      universe.harmony_params.base_frequency *
      (universe.physics_params.gravity / 9.81) *
      (1 + ((universe.physics_params.temperature - 293.15) / 293.15) * 0.1);

    const scale = generateScale(baseFreq);

    // Tempo modulation based on physics parameters
    const tempo =
      universe.harmony_params.tempo * (1 + (universe.physics_params.pressure / 101.325) * 0.1);

    Tone.Transport.bpm.value = tempo;

    // Calculate energy from physics parameters
    const energy =
      Object.entries(universe.physics_params)
        .filter(([key, _]) => ['gravity', 'air_resistance', 'elasticity', 'friction'].includes(key))
        .reduce((sum, [_, value]) => sum + value, 0) / 4;

    // Generate chord progression based on parameters
    const resonance = universe.harmony_params.resonance;
    const dissonance = universe.harmony_params.dissonance;
    const harmonyScale = universe.harmony_params.harmony_scale;
    const balance = universe.harmony_params.balance;

    const progression = [
      [scale[0], scale[2], scale[4]].map(f => f * harmonyScale), // I
      [scale[5], scale[0], scale[2]].map(f => f * (1 + dissonance * 0.1)), // VI
      [scale[3], scale[5], scale[0]].map(f => f * (1 + resonance * 0.1)), // IV
      [scale[4], scale[6], scale[1]].map(f => f * (1 + balance * 0.1)), // V
    ];

    // Create sequence with dynamic note length based on energy
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    const noteLength = energy < 0.5 ? '4n' : '8n';
    const sequence = new Tone.Sequence(
      (time, chord) => {
        synthRef.current?.triggerAttackRelease(chord, noteLength, time);
      },
      progression,
      noteLength
    );

    // Set volume based on parameters
    synthRef.current.volume.value = Tone.gainToDb(universe.harmony_params.volume);

    sequenceRef.current = sequence;
    sequence.start(0);
  }, [universe?.harmony_params, universe?.physics_params, generateScale]);

  // Handle real-time physics updates
  useEffect(() => {
    if (socket) {
      socket.on('physics_changed', data => {
        if (isPlaying) {
          generateHarmony();
        }
      });
    }
  }, [socket, isPlaying, generateHarmony]);

  const handlePlayStop = useCallback(async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      if (sequenceRef.current) {
        sequenceRef.current.stop();
      }
      setIsPlaying(false);
    } else {
      await Tone.start();
      Tone.Transport.start();
      generateHarmony();
      setIsPlaying(true);
    }
  }, [isPlaying, generateHarmony]);

  const handleHarmonyChange = (param, value) => {
    if (!universe) return;

    const newParams = {
      ...harmonyParams,
      [param]: value,
    };
    setHarmonyParams(newParams);

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      onUpdate(universe.id, { [param]: value });
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleHarmonyToggle = param => {
    if (!universe) return;

    const newParams = {
      ...harmonyParams,
      [param]: {
        ...harmonyParams[param],
        enabled: !harmonyParams[param].enabled,
      },
    };
    setHarmonyParams(newParams);

    onUpdate(universe.id, { [param]: newParams[param] });
  };

  const renderHarmonyParameter = (param, label, unit, min, max) => {
    if (!harmonyParams[param]) return null;

    return (
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {label} ({unit})
              </Typography>
              <Slider
                value={harmonyParams[param]}
                onChange={(_, value) => handleHarmonyChange(param, value)}
                min={min}
                max={max}
                step={(max - min) / 100}
                valueLabelDisplay="auto"
                valueLabelFormat={value => `${value} ${unit}`}
                marks={[
                  { value: min, label: min },
                  { value: max, label: max },
                ]}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (!universe) {
    return <Typography>No universe selected</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Harmony Parameters
      </Typography>
      <Grid container spacing={3}>
        {renderHarmonyParameter('resonance', 'Resonance', 'coefficient', 0, 10)}
        {renderHarmonyParameter('dissonance', 'Dissonance', 'coefficient', 0, 1)}
        {renderHarmonyParameter('harmony_scale', 'Harmony Scale', 'coefficient', 0.1, 10)}
        {renderHarmonyParameter('balance', 'Balance', 'coefficient', 0, 1)}
        {renderHarmonyParameter('base_frequency', 'Base Frequency', 'Hz', 20, 2000)}
        {renderHarmonyParameter('tempo', 'Tempo', 'BPM', 40, 240)}
        {renderHarmonyParameter('volume', 'Volume', 'coefficient', 0, 1)}
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <IconButton
          size="large"
          onClick={handlePlayStop}
          color={isPlaying ? 'secondary' : 'primary'}
        >
          {isPlaying ? <StopIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={onExport}>
          Export Harmony
        </Button>
      </Box>
    </Box>
  );
};

UniverseHarmony.propTypes = {
  universe: PropTypes.shape({
    id: PropTypes.number.isRequired,
    harmony_params: PropTypes.object,
  }),
  onExport: PropTypes.func.isRequired,
  socket: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
};

export default UniverseHarmony;

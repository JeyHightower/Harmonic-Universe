import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Slider,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const scaleTypes = ['major', 'minor', 'harmonic minor', 'melodic minor', 'pentatonic'];

const MusicParametersEditor = ({ value, onChange }) => {
  const [parameters, setParameters] = useState({
    tempo: 60.0,
    scale: 'C major',
    volume: 0.8,
    reverb: 0.3,
    delay: 0.2,
    base_frequency: 440.0,
    ...value
  });

  useEffect(() => {
    onChange(parameters);
  }, [parameters, onChange]);

  const handleChange = (param) => (event, newValue) => {
    setParameters((prev) => ({
      ...prev,
      [param]: typeof newValue === 'number' ? newValue : event.target.value,
    }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Music Parameters
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Tempo (BPM)</Typography>
        <Slider
          value={parameters.tempo}
          onChange={handleChange('tempo')}
          min={20}
          max={300}
          step={1}
          marks={[
            { value: 60, label: '60' },
            { value: 120, label: '120' },
            { value: 180, label: '180' },
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Scale</InputLabel>
          <Select
            value={parameters.scale}
            onChange={handleChange('scale')}
            label="Scale"
          >
            {notes.map((note) =>
              scaleTypes.map((type) => (
                <MenuItem key={`${note} ${type}`} value={`${note} ${type}`}>
                  {`${note} ${type}`}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Volume</Typography>
        <Slider
          value={parameters.volume}
          onChange={handleChange('volume')}
          min={0}
          max={1}
          step={0.01}
          marks={[
            { value: 0, label: '0' },
            { value: 0.5, label: '0.5' },
            { value: 1, label: '1' },
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Reverb</Typography>
        <Slider
          value={parameters.reverb}
          onChange={handleChange('reverb')}
          min={0}
          max={1}
          step={0.01}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Delay</Typography>
        <Slider
          value={parameters.delay}
          onChange={handleChange('delay')}
          min={0}
          max={1}
          step={0.01}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Base Frequency (Hz)</Typography>
        <Slider
          value={parameters.base_frequency}
          onChange={handleChange('base_frequency')}
          min={20}
          max={20000}
          step={1}
          scale={(x) => Math.log10(x)}
          marks={[
            { value: 20, label: '20' },
            { value: 440, label: '440' },
            { value: 20000, label: '20k' },
          ]}
          valueLabelDisplay="auto"
        />
      </Box>
    </Paper>
  );
};

export default MusicParametersEditor;

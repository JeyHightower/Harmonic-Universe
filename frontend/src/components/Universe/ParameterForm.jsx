import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { universeService } from '../../services/universeService';

const ParameterForm = ({ universeId, type, initialParameters, onUpdate }) => {
  const [parameters, setParameters] = useState(initialParameters || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (name, value) => {
    setParameters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await universeService.updateParameters(universeId, type, parameters);
      onUpdate(parameters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPhysicsForm = () => (
    <>
      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Gravity</Typography>
        <Slider
          value={parameters.gravity || 9.81}
          onChange={(_, value) => handleChange('gravity', value)}
          min={0}
          max={20}
          step={0.1}
          marks={[
            { value: 0, label: '0' },
            { value: 9.81, label: 'Earth' },
            { value: 20, label: '20' },
          ]}
        />
      </FormControl>
      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Particle Speed</Typography>
        <Slider
          value={parameters.particle_speed || 1}
          onChange={(_, value) => handleChange('particle_speed', value)}
          min={0}
          max={5}
          step={0.1}
          marks={[
            { value: 0, label: 'Slow' },
            { value: 2.5, label: 'Medium' },
            { value: 5, label: 'Fast' },
          ]}
        />
      </FormControl>
    </>
  );

  const renderMusicForm = () => (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel>Key</InputLabel>
        <Select
          value={parameters.key || 'C'}
          onChange={e => handleChange('key', e.target.value)}
          label="Key"
        >
          {[
            'C',
            'G',
            'D',
            'A',
            'E',
            'B',
            'F#',
            'F',
            'Bb',
            'Eb',
            'Ab',
            'Db',
          ].map(key => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Tempo (BPM)</Typography>
        <Slider
          value={parameters.tempo || 120}
          onChange={(_, value) => handleChange('tempo', value)}
          min={40}
          max={200}
          step={1}
          marks={[
            { value: 40, label: '40' },
            { value: 120, label: '120' },
            { value: 200, label: '200' },
          ]}
        />
      </FormControl>
    </>
  );

  const renderVisualizationForm = () => (
    <>
      <FormControl fullWidth margin="normal">
        <TextField
          label="Background Color"
          type="color"
          value={parameters.background_color || '#000000'}
          onChange={e => handleChange('background_color', e.target.value)}
          sx={{ input: { height: 50 } }}
        />
      </FormControl>
      <FormControl fullWidth margin="normal">
        <Typography gutterBottom>Particle Count</Typography>
        <Slider
          value={parameters.particle_count || 1000}
          onChange={(_, value) => handleChange('particle_count', value)}
          min={100}
          max={10000}
          step={100}
          marks={[
            { value: 100, label: '100' },
            { value: 5000, label: '5k' },
            { value: 10000, label: '10k' },
          ]}
        />
      </FormControl>
    </>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {type === 'physics' && renderPhysicsForm()}
      {type === 'music' && renderMusicForm()}
      {type === 'visualization' && renderVisualizationForm()}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" fullWidth disabled={loading}>
          {loading ? 'Saving...' : 'Save Parameters'}
        </Button>
      </Box>
    </Box>
  );
};

export default ParameterForm;

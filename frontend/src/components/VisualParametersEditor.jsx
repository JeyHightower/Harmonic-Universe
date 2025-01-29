import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    IconButton,
    Paper,
    Slider,
    Stack,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ChromePicker } from 'react-color';

const VisualParametersEditor = ({ value, onChange }) => {
  const [parameters, setParameters] = useState({
    background: '#000000',
    particle_count: 1000,
    animation_speed: 1.0,
    color_scheme: ['#FF0000', '#00FF00', '#0000FF'],
    particle_size: 1.0,
    glow_intensity: 0.5,
    ...value
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorIndex, setActiveColorIndex] = useState(null);

  useEffect(() => {
    onChange(parameters);
  }, [parameters, onChange]);

  const handleChange = (param) => (event, newValue) => {
    setParameters((prev) => ({
      ...prev,
      [param]: newValue,
    }));
  };

  const handleColorChange = (color) => {
    if (activeColorIndex === -1) {
      // Background color
      setParameters((prev) => ({
        ...prev,
        background: color.hex,
      }));
    } else if (activeColorIndex !== null) {
      // Color scheme color
      setParameters((prev) => ({
        ...prev,
        color_scheme: prev.color_scheme.map((c, i) =>
          i === activeColorIndex ? color.hex : c
        ),
      }));
    }
  };

  const handleAddColor = () => {
    if (parameters.color_scheme.length < 10) {
      setParameters((prev) => ({
        ...prev,
        color_scheme: [...prev.color_scheme, '#FFFFFF'],
      }));
    }
  };

  const handleRemoveColor = (index) => {
    if (parameters.color_scheme.length > 1) {
      setParameters((prev) => ({
        ...prev,
        color_scheme: prev.color_scheme.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 2, position: 'relative' }}>
      <Typography variant="h6" gutterBottom>
        Visual Parameters
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Background Color</Typography>
        <Box
          sx={{
            width: 50,
            height: 50,
            bgcolor: parameters.background,
            border: '2px solid #ccc',
            cursor: 'pointer',
          }}
          onClick={() => {
            setActiveColorIndex(-1);
            setShowColorPicker(true);
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography gutterBottom>Color Scheme</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {parameters.color_scheme.map((color, index) => (
            <Box key={index} sx={{ position: 'relative', mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: color,
                  border: '2px solid #ccc',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setActiveColorIndex(index);
                  setShowColorPicker(true);
                }}
              />
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: -10, right: -10 }}
                onClick={() => handleRemoveColor(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          {parameters.color_scheme.length < 10 && (
            <IconButton onClick={handleAddColor}>
              <AddIcon />
            </IconButton>
          )}
        </Stack>
      </Box>

      {showColorPicker && (
        <Box sx={{ position: 'absolute', zIndex: 2 }}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
            onClick={() => setShowColorPicker(false)}
          />
          <ChromePicker
            color={
              activeColorIndex === -1
                ? parameters.background
                : parameters.color_scheme[activeColorIndex]
            }
            onChange={handleColorChange}
          />
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Particle Count</Typography>
        <Slider
          value={parameters.particle_count}
          onChange={handleChange('particle_count')}
          min={0}
          max={10000}
          step={100}
          marks={[
            { value: 0, label: '0' },
            { value: 5000, label: '5k' },
            { value: 10000, label: '10k' },
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Animation Speed</Typography>
        <Slider
          value={parameters.animation_speed}
          onChange={handleChange('animation_speed')}
          min={0}
          max={5}
          step={0.1}
          marks={[
            { value: 0, label: '0x' },
            { value: 1, label: '1x' },
            { value: 5, label: '5x' },
          ]}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Particle Size</Typography>
        <Slider
          value={parameters.particle_size}
          onChange={handleChange('particle_size')}
          min={0.1}
          max={10}
          step={0.1}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Glow Intensity</Typography>
        <Slider
          value={parameters.glow_intensity}
          onChange={handleChange('glow_intensity')}
          min={0}
          max={1}
          step={0.01}
          valueLabelDisplay="auto"
        />
      </Box>
    </Paper>
  );
};

export default VisualParametersEditor;

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { ChromePicker } from 'react-color';

const VisualizationSettings = ({ visualization, onUpdate }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleTypeChange = event => {
    onUpdate({ type: event.target.value });
  };

  const handleBackgroundColorChange = color => {
    onUpdate({ backgroundColor: color.hex });
  };

  const handleAutoRotateChange = event => {
    onUpdate({ autoRotate: event.target.checked });
  };

  const handleSettingChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Visualization Settings
      </Typography>

      <Box sx={{ mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Visualization Type</InputLabel>
          <Select
            value={visualization.type}
            label="Visualization Type"
            onChange={handleTypeChange}
          >
            <MenuItem value="waveform">Waveform</MenuItem>
            <MenuItem value="spectrum">Spectrum</MenuItem>
            <MenuItem value="particles">Particles</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Background Color
          </Typography>
          <Box
            sx={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              border: '2px solid #ccc',
              backgroundColor:
                visualization.settings.backgroundColor || '#000000',
              cursor: 'pointer',
            }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
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
                color={visualization.settings.backgroundColor || '#000000'}
                onChange={handleBackgroundColorChange}
              />
            </Box>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={visualization.settings.autoRotate || false}
              onChange={handleAutoRotateChange}
            />
          }
          label="Auto Rotate"
          sx={{ mb: 2 }}
        />

        {/* Type-specific settings */}
        {visualization.type === 'waveform' && (
          <>
            <TextField
              fullWidth
              label="Line Width"
              type="number"
              value={visualization.settings.lineWidth || 1}
              onChange={e =>
                handleSettingChange('lineWidth', Number(e.target.value))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Line Color"
              value={visualization.settings.lineColor || '#ffffff'}
              onChange={e => handleSettingChange('lineColor', e.target.value)}
              sx={{ mb: 2 }}
            />
          </>
        )}

        {visualization.type === 'spectrum' && (
          <>
            <TextField
              fullWidth
              label="Bar Width"
              type="number"
              value={visualization.settings.barWidth || 1}
              onChange={e =>
                handleSettingChange('barWidth', Number(e.target.value))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Bar Spacing"
              type="number"
              value={visualization.settings.barSpacing || 1}
              onChange={e =>
                handleSettingChange('barSpacing', Number(e.target.value))
              }
              sx={{ mb: 2 }}
            />
          </>
        )}

        {visualization.type === 'particles' && (
          <>
            <TextField
              fullWidth
              label="Particle Count"
              type="number"
              value={visualization.settings.particleCount || 1000}
              onChange={e =>
                handleSettingChange('particleCount', Number(e.target.value))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Particle Size"
              type="number"
              value={visualization.settings.particleSize || 1}
              onChange={e =>
                handleSettingChange('particleSize', Number(e.target.value))
              }
              sx={{ mb: 2 }}
            />
          </>
        )}
      </Box>
    </Paper>
  );
};

VisualizationSettings.propTypes = {
  visualization: PropTypes.shape({
    type: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      backgroundColor: PropTypes.string,
      autoRotate: PropTypes.bool,
      lineWidth: PropTypes.number,
      lineColor: PropTypes.string,
      barWidth: PropTypes.number,
      barSpacing: PropTypes.number,
      particleCount: PropTypes.number,
      particleSize: PropTypes.number,
    }).isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default VisualizationSettings;

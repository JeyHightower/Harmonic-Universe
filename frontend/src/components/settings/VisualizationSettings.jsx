import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import React from 'react';

const VisualizationSettings = () => {
  const [settings, setSettings] = React.useState({
    quality: 'high',
    frameRate: 60,
    particleCount: 1000,
    showStats: true,
    enablePostProcessing: true,
  });

  const handleQualityChange = event => {
    setSettings({
      ...settings,
      quality: event.target.value,
    });
  };

  const handleFrameRateChange = (event, newValue) => {
    setSettings({
      ...settings,
      frameRate: newValue,
    });
  };

  const handleParticleCountChange = (event, newValue) => {
    setSettings({
      ...settings,
      particleCount: newValue,
    });
  };

  const handleStatsChange = event => {
    setSettings({
      ...settings,
      showStats: event.target.checked,
    });
  };

  const handlePostProcessingChange = event => {
    setSettings({
      ...settings,
      enablePostProcessing: event.target.checked,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Visualization Settings
      </Typography>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Quality</InputLabel>
        <Select value={settings.quality} onChange={handleQualityChange} label="Quality">
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="ultra">Ultra</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 3 }}>
        <Typography gutterBottom>Frame Rate: {settings.frameRate} FPS</Typography>
        <Slider
          value={settings.frameRate}
          onChange={handleFrameRateChange}
          min={30}
          max={144}
          step={1}
          marks={[
            { value: 30, label: '30' },
            { value: 60, label: '60' },
            { value: 144, label: '144' },
          ]}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography gutterBottom>Particle Count: {settings.particleCount}</Typography>
        <Slider
          value={settings.particleCount}
          onChange={handleParticleCountChange}
          min={100}
          max={10000}
          step={100}
          marks={[
            { value: 100, label: '100' },
            { value: 5000, label: '5K' },
            { value: 10000, label: '10K' },
          ]}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Switch checked={settings.showStats} onChange={handleStatsChange} name="showStats" />
          }
          label="Show Performance Stats"
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enablePostProcessing}
              onChange={handlePostProcessingChange}
              name="enablePostProcessing"
            />
          }
          label="Enable Post Processing Effects"
        />
      </Box>
    </Box>
  );
};

export default VisualizationSettings;

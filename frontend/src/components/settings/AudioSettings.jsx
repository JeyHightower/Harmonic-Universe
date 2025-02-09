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

const AudioSettings = () => {
  const [settings, setSettings] = React.useState({
    outputDevice: 'default',
    masterVolume: 100,
    sampleRate: 48000,
    bitDepth: '24',
    enableEqualizer: true,
    enableCompressor: false,
  });

  const handleOutputDeviceChange = event => {
    setSettings({
      ...settings,
      outputDevice: event.target.value,
    });
  };

  const handleVolumeChange = (event, newValue) => {
    setSettings({
      ...settings,
      masterVolume: newValue,
    });
  };

  const handleSampleRateChange = event => {
    setSettings({
      ...settings,
      sampleRate: event.target.value,
    });
  };

  const handleBitDepthChange = event => {
    setSettings({
      ...settings,
      bitDepth: event.target.value,
    });
  };

  const handleEqualizerChange = event => {
    setSettings({
      ...settings,
      enableEqualizer: event.target.checked,
    });
  };

  const handleCompressorChange = event => {
    setSettings({
      ...settings,
      enableCompressor: event.target.checked,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Audio Settings
      </Typography>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Output Device</InputLabel>
        <Select
          value={settings.outputDevice}
          onChange={handleOutputDeviceChange}
          label="Output Device"
        >
          <MenuItem value="default">System Default</MenuItem>
          <MenuItem value="speakers">Speakers</MenuItem>
          <MenuItem value="headphones">Headphones</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 3 }}>
        <Typography gutterBottom>Master Volume: {settings.masterVolume}%</Typography>
        <Slider
          value={settings.masterVolume}
          onChange={handleVolumeChange}
          min={0}
          max={100}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 50, label: '50%' },
            { value: 100, label: '100%' },
          ]}
        />
      </Box>

      <FormControl fullWidth sx={{ mt: 3 }}>
        <InputLabel>Sample Rate</InputLabel>
        <Select value={settings.sampleRate} onChange={handleSampleRateChange} label="Sample Rate">
          <MenuItem value={44100}>44.1 kHz</MenuItem>
          <MenuItem value={48000}>48 kHz</MenuItem>
          <MenuItem value={96000}>96 kHz</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mt: 3 }}>
        <InputLabel>Bit Depth</InputLabel>
        <Select value={settings.bitDepth} onChange={handleBitDepthChange} label="Bit Depth">
          <MenuItem value="16">16-bit</MenuItem>
          <MenuItem value="24">24-bit</MenuItem>
          <MenuItem value="32">32-bit float</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enableEqualizer}
              onChange={handleEqualizerChange}
              name="enableEqualizer"
            />
          }
          label="Enable Equalizer"
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enableCompressor}
              onChange={handleCompressorChange}
              name="enableCompressor"
            />
          }
          label="Enable Compressor"
        />
      </Box>
    </Box>
  );
};

export default AudioSettings;

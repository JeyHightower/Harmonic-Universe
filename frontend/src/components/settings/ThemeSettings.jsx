import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

const ThemeSettings = () => {
  const theme = useTheme();
  const [settings, setSettings] = React.useState({
    darkMode: theme.palette.mode === 'dark',
    colorScheme: 'default',
    animations: true,
  });

  const handleDarkModeChange = event => {
    setSettings({
      ...settings,
      darkMode: event.target.checked,
    });
  };

  const handleColorSchemeChange = event => {
    setSettings({
      ...settings,
      colorScheme: event.target.value,
    });
  };

  const handleAnimationsChange = event => {
    setSettings({
      ...settings,
      animations: event.target.checked,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Theme Settings
      </Typography>

      <FormControlLabel
        control={
          <Switch checked={settings.darkMode} onChange={handleDarkModeChange} name="darkMode" />
        }
        label="Dark Mode"
      />

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Color Scheme
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={settings.colorScheme}
            onChange={handleColorSchemeChange}
            name="colorScheme"
          >
            <FormControlLabel value="default" control={<Radio />} label="Default" />
            <FormControlLabel value="cosmic" control={<Radio />} label="Cosmic" />
            <FormControlLabel value="neon" control={<Radio />} label="Neon" />
            <FormControlLabel value="natural" control={<Radio />} label="Natural" />
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.animations}
              onChange={handleAnimationsChange}
              name="animations"
            />
          }
          label="Enable Animations"
        />
      </Box>
    </Box>
  );
};

export default ThemeSettings;

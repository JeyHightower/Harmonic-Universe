import { Box, Grid, Slider, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

const PARAMETER_CONFIG = {
  resonance: {
    label: 'Resonance',
    unit: 'coefficient',
    min: 0,
    max: 10,
  },
  dissonance: {
    label: 'Dissonance',
    unit: 'coefficient',
    min: 0,
    max: 1,
  },
  harmony_scale: {
    label: 'Harmony Scale',
    unit: 'coefficient',
    min: 0.1,
    max: 10,
  },
  balance: {
    label: 'Balance',
    unit: 'coefficient',
    min: 0,
    max: 1,
  },
  base_frequency: {
    label: 'Base Frequency',
    unit: 'Hz',
    min: 20,
    max: 2000,
  },
  tempo: {
    label: 'Tempo',
    unit: 'BPM',
    min: 40,
    max: 240,
  },
  volume: {
    label: 'Volume',
    unit: 'coefficient',
    min: 0,
    max: 1,
  },
};

export const HarmonyControl = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (param, newValue) => {
    const updatedValue = {
      ...localValue,
      [param]: newValue,
    };
    setLocalValue(updatedValue);
    onChange({ [param]: newValue });
  };

  const renderParameter = param => {
    const config = PARAMETER_CONFIG[param];
    if (!config) return null;

    return (
      <Grid item xs={12} md={6} key={param}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            {config.label} ({config.unit})
          </Typography>
          <Slider
            value={localValue[param]}
            onChange={(_, value) => handleChange(param, value)}
            min={config.min}
            max={config.max}
            step={(config.max - config.min) / 100}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value} ${config.unit}`}
            marks={[
              { value: config.min, label: config.min },
              { value: config.max, label: config.max },
            ]}
          />
        </Box>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Harmony Parameters
      </Typography>
      <Grid container spacing={3}>
        {Object.keys(PARAMETER_CONFIG).map(param => renderParameter(param))}
      </Grid>
    </Box>
  );
};

HarmonyControl.propTypes = {
  value: PropTypes.shape({
    resonance: PropTypes.number,
    dissonance: PropTypes.number,
    harmony_scale: PropTypes.number,
    balance: PropTypes.number,
    base_frequency: PropTypes.number,
    tempo: PropTypes.number,
    volume: PropTypes.number,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default HarmonyControl;

import { Box, Card, CardContent, Grid, Slider, Tooltip, Typography } from '@mui/material';
import { useCallback } from 'react';

export const UniverseParameters = ({ universe, onUpdate }) => {
  const handlePhysicsChange = useCallback(
    (param, value) => {
      if (!universe?.physicsParams?.[param]) return;

      const paramConfig = universe.physicsParams[param];
      const clampedValue = Math.min(Math.max(value, paramConfig.min), paramConfig.max);

      onUpdate(universe.id, {
        [param]: {
          ...paramConfig,
          value: clampedValue,
        },
      });
    },
    [universe, onUpdate]
  );

  if (!universe?.physicsParams) return null;

  const renderParameter = (param, label) => {
    const config = universe.physicsParams[param];
    if (!config || !config.enabled) return null;

    return (
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Tooltip title={`Unit: ${config.unit || 'N/A'}`}>
              <Typography variant="subtitle1" gutterBottom>
                {label}
              </Typography>
            </Tooltip>
            <Slider
              value={config.value}
              min={config.min}
              max={config.max}
              step={(config.max - config.min) / 100}
              onChange={(_, value) => handlePhysicsChange(param, value)}
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${value} ${config.unit || ''}`}
              marks={[
                { value: config.min, label: config.min },
                { value: config.max, label: config.max },
              ]}
            />
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Physics Parameters
      </Typography>
      <Grid container spacing={3}>
        {renderParameter('gravity', 'Gravity')}
        {renderParameter('friction', 'Friction')}
        {renderParameter('elasticity', 'Elasticity')}
        {renderParameter('air_resistance', 'Air Resistance')}
        {renderParameter('time_step', 'Time Step')}
        {renderParameter('substeps', 'Simulation Steps')}
      </Grid>
    </Box>
  );
};

export default UniverseParameters;

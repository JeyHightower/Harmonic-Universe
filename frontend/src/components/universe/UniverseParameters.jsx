import { Box, FormControlLabel, Grid, Slider, Switch, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const UniverseParameters = ({ params, onParamChange }) => {
  const handleChange = (paramName, value) => {
    if (params[paramName]) {
      onParamChange({
        ...params,
        [paramName]: {
          ...params[paramName],
          value: value,
        },
      });
    }
  };

  const handleToggle = paramName => {
    if (params[paramName]) {
      onParamChange({
        ...params,
        [paramName]: {
          ...params[paramName],
          enabled: !params[paramName].enabled,
        },
      });
    }
  };

  const renderParameter = (paramName, label) => {
    const param = params[paramName];
    if (!param) return null;

    return (
      <Grid item xs={12} key={paramName}>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={param.enabled}
                onChange={() => handleToggle(paramName)}
                name={`${paramName}-toggle`}
              />
            }
            label={`${label} (${param.unit})`}
          />
          <Slider
            value={param.value}
            onChange={(_, value) => handleChange(paramName, value)}
            min={param.min}
            max={param.max}
            step={(param.max - param.min) / 100}
            disabled={!param.enabled}
            valueLabelDisplay="auto"
            aria-label={label}
          />
          <Typography variant="caption" color="textSecondary" display="block">
            {param.description}
          </Typography>
        </Box>
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
        {renderParameter('collision_elasticity', 'Elasticity')}
        {renderParameter('air_resistance', 'Air Resistance')}
        {renderParameter('temperature', 'Temperature')}
        {renderParameter('pressure', 'Pressure')}
        {renderParameter('fluid_density', 'Fluid Density')}
        {renderParameter('viscosity', 'Viscosity')}
        {renderParameter('time_step', 'Time Step')}
        {renderParameter('substeps', 'Simulation Steps')}
      </Grid>
    </Box>
  );
};

UniverseParameters.propTypes = {
  params: PropTypes.object.isRequired,
  onParamChange: PropTypes.func.isRequired,
};

export default UniverseParameters;

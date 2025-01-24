import {
    Refresh as RefreshIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    CircularProgress,
    Grid,
    IconButton,
    Slider,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { WebSocketService } from '../../services/WebSocketService';

const ParameterManager = ({ universeId, type, parameters }) => {
  const theme = useTheme();
  const [values, setValues] = useState(parameters || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(parameters || {});
  }, [parameters]);

  useEffect(() => {
    const ws = WebSocketService.getInstance();
    ws.on(`${type}_parameter_update`, handleParameterUpdate);
    return () => ws.off(`${type}_parameter_update`, handleParameterUpdate);
  }, [type]);

  const handleParameterUpdate = (data) => {
    if (data.universe_id === universeId) {
      setValues(prev => ({ ...prev, [data.parameter]: data.value }));
    }
  };

  const handleChange = (parameter) => (event, newValue) => {
    setValues(prev => ({ ...prev, [parameter]: newValue }));
    setSaved(false);

    // Emit parameter update through WebSocket
    const ws = WebSocketService.getInstance();
    ws.emit('parameter_update', {
      universe_id: universeId,
      type,
      parameter,
      value: newValue,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Save parameters to backend
      await fetch(`/api/universes/${universeId}/parameters/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      setSaved(true);
    } catch (err) {
      setError('Failed to save parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setValues(parameters || {});
    setSaved(false);
  };

  const getParameterConfig = (paramName) => {
    const configs = {
      physics: {
        gravity: { min: 0, max: 100, step: 1, label: 'Gravity' },
        friction: { min: 0, max: 1, step: 0.01, label: 'Friction' },
        elasticity: { min: 0, max: 1, step: 0.01, label: 'Elasticity' },
      },
      music: {
        tempo: { min: 60, max: 200, step: 1, label: 'Tempo' },
        harmony: { min: 0, max: 1, step: 0.01, label: 'Harmony' },
        rhythm: { min: 0, max: 1, step: 0.01, label: 'Rhythm' },
      },
      visualization: {
        brightness: { min: 0, max: 1, step: 0.01, label: 'Brightness' },
        contrast: { min: 0, max: 2, step: 0.01, label: 'Contrast' },
        saturation: { min: 0, max: 2, step: 0.01, label: 'Saturation' },
      },
    }[type] || {};

    return configs[paramName] || {};
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Tooltip title="Reset">
          <IconButton onClick={handleReset} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save">
          <IconButton
            onClick={handleSave}
            disabled={loading || saved}
            color={saved ? 'success' : 'primary'}
          >
            {loading ? <CircularProgress size={24} /> : <SaveIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {Object.entries(values).map(([param, value]) => {
          const config = getParameterConfig(param);
          return (
            <Grid item xs={12} key={param}>
              <Typography gutterBottom>
                {config.label || param}
              </Typography>
              <Slider
                value={value}
                onChange={handleChange(param)}
                min={config.min}
                max={config.max}
                step={config.step}
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 28,
                    height: 28,
                    backgroundColor: theme.palette.background.paper,
                    border: `2px solid ${theme.palette.primary.main}`,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
                    },
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                    opacity: 0.2,
                  },
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ParameterManager;

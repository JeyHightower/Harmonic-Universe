import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    Snackbar,
    Typography,
} from '@mui/material';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import MusicParametersEditor from './MusicParametersEditor';
import VisualParametersEditor from './VisualParametersEditor';

const UniverseParametersEditor = ({ universeId, initialParameters = {} }) => {
  const [parameters, setParameters] = useState({
    music_parameters: initialParameters.music_parameters || {},
    visual_parameters: initialParameters.visual_parameters || {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const api = useApi();

  // Debounced save function to prevent too many API calls
  const saveParameters = useCallback(
    debounce(async (params) => {
      try {
        setLoading(true);
        setError(null);

        await api.patch(`/universes/${universeId}/parameters`, params);

        setSuccessMessage('Parameters saved successfully');
      } catch (err) {
        setError(err.message || 'Failed to save parameters');
      } finally {
        setLoading(false);
      }
    }, 1000),
    [universeId]
  );

  useEffect(() => {
    // Load initial parameters
    const fetchParameters = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/universes/${universeId}`);
        setParameters({
          music_parameters: response.data.music_parameters || {},
          visual_parameters: response.data.visual_parameters || {},
        });
      } catch (err) {
        setError(err.message || 'Failed to load parameters');
      } finally {
        setLoading(false);
      }
    };

    if (universeId) {
      fetchParameters();
    }
  }, [universeId]);

  const handleMusicParametersChange = (musicParams) => {
    const newParameters = {
      ...parameters,
      music_parameters: musicParams,
    };
    setParameters(newParameters);
    saveParameters(newParameters);
  };

  const handleVisualParametersChange = (visualParams) => {
    const newParameters = {
      ...parameters,
      visual_parameters: visualParams,
    };
    setParameters(newParameters);
    saveParameters(newParameters);
  };

  const handleSaveManually = async () => {
    try {
      setLoading(true);
      setError(null);

      await api.patch(`/universes/${universeId}/parameters`, parameters);

      setSuccessMessage('Parameters saved successfully');
    } catch (err) {
      setError(err.message || 'Failed to save parameters');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage('');
  };

  if (!universeId) {
    return (
      <Typography color="error">
        Universe ID is required to edit parameters
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <MusicParametersEditor
            value={parameters.music_parameters}
            onChange={handleMusicParametersChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <VisualParametersEditor
            value={parameters.visual_parameters}
            onChange={handleVisualParametersChange}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSaveManually}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Save All Parameters
        </Button>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UniverseParametersEditor;

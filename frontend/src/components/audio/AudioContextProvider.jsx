import { Box, Button, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import * as Tone from 'tone';

const AudioContextProvider = ({ children }) => {
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Check if AudioContext is already running
    if (Tone.context.state === 'running') {
      setIsAudioContextStarted(true);
    }

    // Cleanup function
    return () => {
      if (Tone.context.state === 'running') {
        Tone.context.close();
      }
    };
  }, []);

  const startAudioContext = async () => {
    try {
      // Ensure we're in a user gesture context
      await Tone.start();
      await Tone.context.resume();

      // Initialize any default Tone.js settings
      Tone.Transport.bpm.value = 120;
      Tone.Transport.timeSignature = [4, 4];

      // Set default audio settings
      Tone.Destination.volume.value = -6; // Set a safe default volume
      Tone.context.lookAhead = 0.1; // Reduce latency

      setIsAudioContextStarted(true);
      enqueueSnackbar('Audio system initialized successfully', { variant: 'success' });
    } catch (error) {
      console.error('Failed to start audio context:', error);
      enqueueSnackbar('Failed to initialize audio system. Please try again.', { variant: 'error' });
    }
  };

  if (!isAudioContextStarted) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 9999,
          gap: 2,
        }}
      >
        <Typography variant="h5" color="white" gutterBottom>
          Welcome to Harmonic Universe
        </Typography>
        <Typography variant="body1" color="white" align="center" sx={{ mb: 3, maxWidth: 600 }}>
          To experience the full audio capabilities, we need your permission to enable sound.
          Click the button below to start.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={startAudioContext}
          size="large"
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.2rem',
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          Enable Audio
        </Button>
      </Box>
    );
  }

  return children;
};

export default AudioContextProvider;

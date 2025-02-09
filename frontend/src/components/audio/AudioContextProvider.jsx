import { Box, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import * as Tone from 'tone';

const AudioContextProvider = ({ children }) => {
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);

  useEffect(() => {
    // Check if AudioContext is already running
    if (Tone.context.state === 'running') {
      setIsAudioContextStarted(true);
    }
  }, []);

  const startAudioContext = async () => {
    try {
      await Tone.start();
      await Tone.context.resume();
      setIsAudioContextStarted(true);
    } catch (error) {
      console.error('Failed to start audio context:', error);
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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={startAudioContext}
          size="large"
          sx={{
            py: 2,
            px: 4,
            fontSize: '1.2rem',
          }}
        >
          Click to Enable Audio
        </Button>
      </Box>
    );
  }

  return children;
};

export default AudioContextProvider;

import { Box, Button } from '@mui/material';
import { useState } from 'react';
import * as Tone from 'tone';

const AudioContextProvider = ({ children }) => {
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);

  const startAudioContext = async () => {
    await Tone.start();
    setIsAudioContextStarted(true);
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
        <Button variant="contained" color="primary" onClick={startAudioContext}>
          Click to Enable Audio
        </Button>
      </Box>
    );
  }

  return children;
};

export default AudioContextProvider;

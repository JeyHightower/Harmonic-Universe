import { modalTypes, useModal } from '@/contexts/ModalContext';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { Box, Button, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MIDIEditor } from './MIDIEditor';
import { TrackList } from './TrackList';
import { WaveformEditor } from './WaveformEditor';

const AudioWorkspace = ({ projectId }) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    loading,
    error,
    tracks,
    setIsPlaying,
    setVolume,
    setCurrentTime,
  } = useSelector(state => state.audio);
  const dispatch = useDispatch();
  const { openModal } = useModal();

  const { isInitialized, initializeEngine, loadTrack, playTrack, stopTrack } = useAudioEngine();

  React.useEffect(() => {
    if (!isInitialized) {
      initializeEngine();
    }
  }, [isInitialized, initializeEngine]);

  React.useEffect(() => {
    if (currentTrack && isInitialized) {
      loadTrack(currentTrack);
    }
  }, [currentTrack, isInitialized, loadTrack]);

  React.useEffect(() => {
    if (currentTrack) {
      if (isPlaying) {
        playTrack(currentTrack);
      } else {
        stopTrack(currentTrack.id);
      }
    }
  }, [currentTrack, isPlaying, playTrack, stopTrack]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Audio Tracks Found
        </Typography>
        <Typography color="text.secondary" paragraph>
          Get started by creating your first audio track.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => openModal(modalTypes.CREATE_AUDIO)}
        >
          Create Audio Track
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Audio Workspace</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => openModal(modalTypes.CREATE_AUDIO)}
        >
          Add Track
        </Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <TrackList projectId={projectId} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                {currentTrack && <WaveformEditor track={currentTrack} projectId={projectId} />}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                {currentTrack && <MIDIEditor track={currentTrack} projectId={projectId} />}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AudioWorkspace;

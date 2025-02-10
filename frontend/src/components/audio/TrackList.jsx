import { useAudio } from '@/hooks/useAudio';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import AudioUploadModal from './AudioUploadModal';

export const TrackList = ({ projectId }) => {
  const {
    tracks,
    currentTrack,
    loading,
    error,
    loadTracks,
    deleteTrack,
    setCurrentTrack,
    updateTrackState,
  } = useAudio(projectId);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleDeleteTrack = async trackId => {
    await deleteTrack(trackId);
  };

  const handleToggleMute = track => {
    updateTrackState(track.id, { isMuted: !track.isMuted });
  };

  if (loading) {
    return <Typography>Loading tracks...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Audio Tracks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadModalOpen(true)}
        >
          Add Track
        </Button>
      </Box>

      {!tracks.length ? (
        <Typography>No tracks available</Typography>
      ) : (
        <List>
          {tracks.map(track => (
            <ListItem
              key={track.id}
              button
              selected={currentTrack?.id === track.id}
              onClick={() => setCurrentTrack(track)}
            >
              <ListItemText
                primary={track.title}
                secondary={`${track.fileType} - ${Math.round(track.duration)}s`}
              />
              <ListItemSecondaryAction>
                <Tooltip title={track.isMuted ? 'Unmute' : 'Mute'}>
                  <IconButton onClick={() => handleToggleMute(track)}>
                    {track.isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton onClick={() => handleDeleteTrack(track.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {currentTrack && (
        <Box sx={{ mt: 2 }}>
          <AudioPlayer track={currentTrack} projectId={projectId} />
        </Box>
      )}

      <AudioUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        projectId={projectId}
      />
    </Box>
  );
};

TrackList.propTypes = {
  projectId: PropTypes.string.isRequired,
};

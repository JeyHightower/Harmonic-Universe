import { useModal } from '@/contexts/ModalContext';
import { useAudio } from '@/hooks/useAudio';
import { commonStyles } from '@/styles/commonStyles';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    OpenInNew as OpenInNewIcon,
    Share as ShareIcon,
    VolumeMute as VolumeMuteIcon,
    VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    Grid,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AudioList = () => {
  const navigate = useNavigate();
  const { audioTracks, loading, error, fetchAudioTracks } = useAudio();
  const { openModal } = useModal();
  const [playingTrack, setPlayingTrack] = useState(null);
  const [audio] = useState(new Audio());

  useEffect(() => {
    fetchAudioTracks();
  }, [fetchAudioTracks]);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const handlePlayPause = (track) => {
    if (playingTrack === track.id) {
      audio.pause();
      setPlayingTrack(null);
    } else {
      if (audio.src !== track.url) {
        audio.src = track.url;
      }
      audio.play();
      setPlayingTrack(track.id);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {audioTracks.map(track => (
        <Grid item xs={12} sm={6} md={4} key={track.id}>
          <Card sx={{ ...commonStyles.card, ...commonStyles.slideIn }}>
            <CardContent sx={commonStyles.cardContent}>
              <Typography variant="h6" gutterBottom noWrap>
                {track.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 1,
                }}
              >
                {track.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Duration: {track.duration}s
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
              <Tooltip title={playingTrack === track.id ? 'Pause' : 'Play'}>
                <IconButton size="small" onClick={() => handlePlayPause(track)}>
                  {track.muted ? (
                    <VolumeMuteIcon />
                  ) : (
                    <VolumeUpIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Open Audio">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/dashboard/audio/${track.id}`)}
                >
                  <OpenInNewIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => openModal('EDIT_AUDIO', { track })}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton size="small">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={() => openModal('DELETE_AUDIO', { track })}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AudioList;

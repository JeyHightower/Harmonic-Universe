import { useAudio } from '@/hooks/useAudio';

import {
    Delete as DeleteIcon,
    VolumeOff as VolumeOffIcon,
    VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';


export const TrackList: React.FC = ({ projectId }) => {
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

    useEffect(() => {
        loadTracks();
    }, [loadTracks]);

    const handleDeleteTrack = async (trackId: number) => {
        await deleteTrack(trackId);
    };

    const handleToggleMute = (track: AudioTrack) => {
        updateTrackState(track.id, { isMuted: !track.isMuted });
    };

    if (loading) {
        return Loading tracks...</Typography>;
    }

    if (error) {
        return <Typography color="error">Error: {error}</Typography>;
    }

    if (!tracks.length) {
        return No tracks available</Typography>;
    }

    return (
        
            
                {tracks.map((track) => (
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
            {currentTrack && (
                <Box sx={{ mt: 2 }}>
                    <AudioPlayer track={currentTrack} projectId={projectId} />
                </Box>
            )}
        </Box>
    );
};

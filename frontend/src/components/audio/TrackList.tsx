import {
    Add as AddIcon,
    Delete,
    VolumeOff,
    VolumeUp,
} from '@mui/icons-material';
import {
    Box,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Slider,
    Stack,
    Typography,
} from '@mui/material';
import { RootState } from '@store/index';
import { deleteTrack, updateTrack } from '@store/slices/audioSlice';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface TrackListProps {
    selectedTrackId: number | null;
    onTrackSelect: (trackId: number) => void;
}

const TrackList: React.FC<TrackListProps> = ({ selectedTrackId, onTrackSelect }) => {
    const dispatch = useDispatch();
    const tracks = useSelector((state: RootState) => state.audio.tracks);

    const handleVolumeChange = (trackId: number, value: number) => {
        dispatch(updateTrack({ id: trackId, volume: value / 100 }));
    };

    const handleMuteToggle = (trackId: number, isMuted: boolean) => {
        dispatch(updateTrack({ id: trackId, isMuted: !isMuted }));
    };

    const handleDeleteTrack = (trackId: number) => {
        dispatch(deleteTrack(trackId));
    };

    const handleAddTrack = () => {
        // TODO: Implement track creation dialog
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                    Tracks
                </Typography>
                <IconButton onClick={handleAddTrack} color="primary">
                    <AddIcon />
                </IconButton>
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {tracks.map((track) => (
                    <ListItem
                        key={track.id}
                        selected={track.id === selectedTrackId}
                        onClick={() => onTrackSelect(track.id)}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        }}
                    >
                        <Stack spacing={1} sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ListItemText
                                    primary={track.name}
                                    secondary={`${track.file_type} - ${Math.round(track.duration)}s`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleMuteToggle(track.id, track.is_muted)}
                                    >
                                        {track.is_muted ? <VolumeOff /> : <VolumeUp />}
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteTrack(track.id)}
                                        sx={{ ml: 1 }}
                                    >
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </Box>
                            <Box sx={{ px: 2, width: '100%' }}>
                                <Slider
                                    size="small"
                                    value={track.volume * 100}
                                    onChange={(_, value) => handleVolumeChange(track.id, value as number)}
                                    disabled={track.is_muted}
                                />
                            </Box>
                        </Stack>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default TrackList;

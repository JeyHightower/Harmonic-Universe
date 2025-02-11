import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
    Box,
    Button,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Slider,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useAIService } from '../../hooks/useAIService';
import { AudioTrack, Scene } from '../../types/scene';

interface AudioControllerProps {
    scene: Scene | null;
    onUpdate: (updates: any) => void;
}

const AudioController: React.FC<AudioControllerProps> = ({ scene, onUpdate }) => {
    const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
    const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
    const { enhanceAudio } = useAIService();

    const handleVolumeChange = (trackId: string, value: number) => {
        onUpdate({
            trackId,
            parameters: {
                ...selectedTrack?.parameters,
                volume: value,
            },
        });
    };

    const handleEnhanceAudio = async (trackId: string) => {
        const enhanced = await enhanceAudio(trackId);
        if (enhanced) {
            onUpdate({ trackId, parameters: enhanced });
        }
    };

    const togglePlayback = (trackId: string) => {
        setIsPlaying({
            ...isPlaying,
            [trackId]: !isPlaying[trackId],
        });
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Tracks</Typography>
                    <List>
                        {scene?.audioTracks.map((track) => (
                            <ListItem
                                key={track.id}
                                selected={selectedTrack?.id === track.id}
                                onClick={() => setSelectedTrack(track)}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => {
                                        onUpdate({ deleteTrack: track.id });
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <IconButton onClick={() => togglePlayback(track.id)}>
                                    {isPlaying[track.id] ? <PauseIcon /> : <PlayArrowIcon />}
                                </IconButton>
                                <ListItemText primary={track.name} />
                            </ListItem>
                        ))}
                    </List>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => {
                            onUpdate({
                                addTrack: {
                                    name: 'New Track',
                                    type: 'background',
                                    parameters: { volume: 1.0 },
                                },
                            });
                        }}
                    >
                        Add Track
                    </Button>
                </Paper>
            </Grid>

            <Grid item xs={8}>
                {selectedTrack && (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Properties</Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography gutterBottom>Volume</Typography>
                            <Slider
                                value={selectedTrack.parameters.volume}
                                onChange={(_, value) => handleVolumeChange(selectedTrack.id, value as number)}
                                min={0}
                                max={1}
                                step={0.1}
                                valueLabelDisplay="auto"
                            />

                            <Typography gutterBottom>Pan</Typography>
                            <Slider
                                value={selectedTrack.parameters.pan || 0}
                                onChange={(_, value) => onUpdate({
                                    trackId: selectedTrack.id,
                                    parameters: { ...selectedTrack.parameters, pan: value },
                                })}
                                min={-1}
                                max={1}
                                step={0.1}
                                valueLabelDisplay="auto"
                            />

                            <Button
                                variant="contained"
                                onClick={() => handleEnhanceAudio(selectedTrack.id)}
                                sx={{ mt: 2 }}
                            >
                                Enhance Audio
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Grid>
        </Grid>
    );
};

export default AudioController;

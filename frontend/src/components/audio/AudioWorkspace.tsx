import { useAudioEngine } from '@hooks/useAudioEngine';
import { Box, Grid, Paper } from '@mui/material';
import React, { useState } from 'react';
import EffectsRack from './EffectsRack';
import MIDIEditor from './MIDIEditor';
import TrackList from './TrackList';
import TransportControls from './TransportControls';
import WaveformEditor from './WaveformEditor';

const AudioWorkspace: React.FC = () => {
    const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioEngine = useAudioEngine();

    const handleTrackSelect = (trackId: number) => {
        setSelectedTrackId(trackId);
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            audioEngine.pause();
        } else {
            audioEngine.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = (time: number) => {
        setCurrentTime(time);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TransportControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlayPause={handlePlayPause}
                onTimeUpdate={handleTimeUpdate}
            />
            <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Grid item xs={3}>
                    <Paper sx={{ height: '100%', overflow: 'auto' }}>
                        <TrackList
                            selectedTrackId={selectedTrackId}
                            onTrackSelect={handleTrackSelect}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={9}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Paper sx={{ flexGrow: 1, mb: 2, overflow: 'hidden' }}>
                            <WaveformEditor
                                trackId={selectedTrackId}
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                onTimeUpdate={handleTimeUpdate}
                            />
                        </Paper>
                        <Paper sx={{ height: '200px', mb: 2 }}>
                            <MIDIEditor
                                trackId={selectedTrackId}
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                            />
                        </Paper>
                        <Paper sx={{ height: '150px' }}>
                            <EffectsRack trackId={selectedTrackId} />
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AudioWorkspace;

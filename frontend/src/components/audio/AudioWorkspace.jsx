import { useAudio } from '@/hooks/useAudio';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { Box, Grid, Paper } from '@mui/material';
import React, { useEffect } from 'react';
import { MIDIEditor } from './MIDIEditor';
import { TrackList } from './TrackList';
import { WaveformEditor } from './WaveformEditor';


export const AudioWorkspace: React.FC = ({ projectId }) => {
    const {
        currentTrack,
        isPlaying,
        volume,
        currentTime,
        duration,
        setIsPlaying,
        setVolume,
        setCurrentTime,
    } = useAudio(projectId);

    const {
        isInitialized,
        initializeEngine,
        loadTrack,
        playTrack,
        stopTrack,
    } = useAudioEngine();

    useEffect(() => {
        if (!isInitialized) {
            initializeEngine();
        }
    }, [isInitialized, initializeEngine]);

    useEffect(() => {
        if (currentTrack && isInitialized) {
            loadTrack(currentTrack);
        }
    }, [currentTrack, isInitialized, loadTrack]);

    useEffect(() => {
        if (currentTrack) {
            if (isPlaying) {
                playTrack(currentTrack);
            } else {
                stopTrack(currentTrack.id);
            }
        }
    }, [currentTrack, isPlaying, playTrack, stopTrack]);

    return (
        <Box sx={{ p: 2 }}>
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
                                {currentTrack && (
                                    <WaveformEditor track={currentTrack} projectId={projectId} />
                                )}
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                {currentTrack && (
                                    <MIDIEditor track={currentTrack} projectId={projectId} />
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

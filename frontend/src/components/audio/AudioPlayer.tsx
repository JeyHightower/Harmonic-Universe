import { useAudio } from '@/hooks/useAudio';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { AudioTrack } from '@/types/audio';
import { Pause, PlayArrow, Stop } from '@mui/icons-material';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
    track: AudioTrack;
    projectId: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, projectId }) => {
    const {
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
        setTrackVolume,
        setMasterVolume,
    } = useAudioEngine();

    const progressRef = useRef<number>();

    useEffect(() => {
        if (!isInitialized) {
            initializeEngine();
        }
    }, [isInitialized, initializeEngine]);

    useEffect(() => {
        if (isInitialized) {
            loadTrack(track);
        }
    }, [isInitialized, track, loadTrack]);

    useEffect(() => {
        setTrackVolume(track.id, track.volume);
    }, [track.volume, track.id, setTrackVolume]);

    useEffect(() => {
        setMasterVolume(volume);
    }, [volume, setMasterVolume]);

    const handlePlayPause = () => {
        if (isPlaying) {
            stopTrack(track.id);
        } else {
            playTrack(track);
        }
    };

    const handleStop = () => {
        stopTrack(track.id);
    };

    const handleVolumeChange = (_: Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        setVolume(value / 100);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={handlePlayPause}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton onClick={handleStop}>
                    <Stop />
                </IconButton>
                <Box sx={{ width: '100%', ml: 2 }}>
                    <Slider
                        value={currentTime}
                        max={duration}
                        onChange={(_, value) => setCurrentTime(Array.isArray(value) ? value[0] : value)}
                        aria-label="time-indicator"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption">{formatTime(currentTime)}</Typography>
                        <Typography variant="caption">{formatTime(duration)}</Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 2 }}>Volume</Typography>
                <Slider
                    value={volume * 100}
                    onChange={handleVolumeChange}
                    aria-label="volume"
                    sx={{ width: 200 }}
                />
            </Box>
        </Box>
    );
};

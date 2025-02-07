import { useAudio } from '@/hooks/useAudio';

import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';


export const WaveformEditor: React.FC = ({ track, projectId }) => {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef();
    const timelineRef = useRef(null);

    const {
        isPlaying,
        volume,
        currentTime,
        setIsPlaying,
        setVolume,
        setCurrentTime,
        setDuration,
    } = useAudio(projectId);

    useEffect(() => {
        if (!waveformRef.current) return;

        wavesurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4a9eff',
            progressColor: '#1976d2',
            cursorColor: '#1976d2',
            barWidth: 2,
            barRadius: 3,
            responsive: true,
            height: 100,
            normalize: true,
            plugins: [
                RegionsPlugin.create(),
                TimelinePlugin.create({
                    container: timelineRef.current!,
                    primaryLabelInterval: 10,
                    secondaryLabelInterval: 5,
                }),
            ],
        });

        const wavesurfer = wavesurferRef.current;

        wavesurfer.load(track.url);

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
        });

        wavesurfer.on('play', () => {
            setIsPlaying(true);
        });

        wavesurfer.on('pause', () => {
            setIsPlaying(false);
        });

        wavesurfer.on('audioprocess', () => {
            setCurrentTime(wavesurfer.getCurrentTime());
        });

        wavesurfer.setVolume(volume);

        return () => {
            wavesurfer.destroy();
        };
    }, [track.url, setDuration, setIsPlaying, setCurrentTime, volume]);

    useEffect(() => {
        if (!wavesurferRef.current) return;
        wavesurferRef.current.setVolume(volume);
    }, [volume]);

    useEffect(() => {
        if (!wavesurferRef.current) return;
        if (isPlaying) {
            wavesurferRef.current.play();
        } else {
            wavesurferRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!wavesurferRef.current) return;
        wavesurferRef.current.seekTo(currentTime / wavesurferRef.current.getDuration());
    }, [currentTime]);

    return (
        <Box sx={{ width: '100%' }}>
            <Box ref={waveformRef} />
            <Box ref={timelineRef} />
        </Box>
    );
};

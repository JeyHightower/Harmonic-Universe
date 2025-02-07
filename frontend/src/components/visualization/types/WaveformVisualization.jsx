import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';


const WaveformVisualization: React.FC = ({
    settings,
    isRealTime,
    updateInterval,
}) => {
    const containerRef = useRef(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Initialize WaveSurfer
            wavesurferRef.current = WaveSurfer.create({
                container: containerRef.current,
                waveColor: settings.waveColor,
                progressColor: settings.progressColor,
                cursorColor: settings.cursorColor,
                height: settings.height,
                normalize: settings.normalize,
                interact: false, // Disable user interaction for visualization
                backend: 'MediaElement',
            });

            // Set up real-time updates if enabled
            if (isRealTime) {
                const updateInterval = setInterval(() => {
                    // Update waveform data
                    // This would typically come from your audio engine or WebAudio API
                    // For now, we'll just generate random data
                    const data = new Float32Array(1024).map(() => Math.random() * 2 - 1);
                    wavesurferRef.current?.loadDecodedBuffer(data);
                }, updateInterval * 1000);

                return () => {
                    clearInterval(updateInterval);
                };
            }

            return () => {
                wavesurferRef.current?.destroy();
            };
        }
    }, [settings, isRealTime, updateInterval]);

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: 'background.paper',
            }}
        />
    );
};

export default WaveformVisualization;

import { useVisualizationEngine } from '@/hooks/useVisualizationEngine';

import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';


const AudioVisualization = ({ visualization, audioContext, audioSource }: AudioVisualizationProps) => {
    const canvasRef = useRef(null);
    const { initEngine, connectAnalyzer, startVisualization, stopVisualization } =
        useVisualizationEngine();

    useEffect(() => {
        if (!canvasRef.current || !audioContext || !audioSource) return;

        const cleanup = initEngine(canvasRef.current);
        connectAnalyzer(audioContext, audioSource);

        return () => {
            stopVisualization();
            cleanup?.();
        };
    }, [audioContext, audioSource, initEngine, connectAnalyzer, stopVisualization]);

    useEffect(() => {
        if (visualization) {
            startVisualization(visualization.id);
        }

        return () => {
            stopVisualization();
        };
    }, [visualization, startVisualization, stopVisualization]);

    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
            }}
        >
            <Typography variant="h6" gutterBottom>
                {visualization.title}
            </Typography>
            <Box
                sx={{
                    flex: 1,
                    position: 'relative',
                    minHeight: 200,
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />
            </Box>
            {visualization.type === 'waveform' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Waveform Visualization
                </Typography>
            )}
            {visualization.type === 'frequency' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Frequency Spectrum
                </Typography>
            )}
        </Paper>
    );
};

export default AudioVisualization;

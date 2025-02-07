import { useVisualizationEngine } from '@/hooks/useVisualizationEngine';

import { Box, Paper } from '@mui/material';
import React, { useEffect, useRef } from 'react';


const VisualizationCanvas: React.FC = ({ visualization }) => {
    const canvasRef = useRef(null);
    const { initializeEngine, updateVisualization, cleanupEngine } = useVisualizationEngine();

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = initializeEngine(canvasRef.current, visualization);

        const animate = () => {
            if (!canvasRef.current) return;
            updateVisualization(engine, visualization);
            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cleanupEngine(engine);
        };
    }, [visualization, initializeEngine, updateVisualization, cleanupEngine]);

    return (
        <Paper
            elevation={3}
            sx={{
                width: visualization.settings.width,
                height: visualization.settings.height,
                backgroundColor: visualization.settings.backgroundColor,
                overflow: 'hidden',
            }}
        >
            <Box
                component="canvas"
                ref={canvasRef}
                width={visualization.settings.width}
                height={visualization.settings.height}
                sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                }}
            />
        </Paper>
    );
};

export default VisualizationCanvas;

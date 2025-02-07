import { useVisualizationEngine } from '@/hooks/useVisualizationEngine';
import { Visualization } from '@/types/visualization';
import { Box, Paper } from '@mui/material';
import React, { useEffect, useRef } from 'react';

interface VisualizationCanvasProps {
    visualization: Visualization;
}

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({ visualization }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

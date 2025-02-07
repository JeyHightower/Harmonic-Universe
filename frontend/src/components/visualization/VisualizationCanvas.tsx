import { useVisualizationEngine } from '@hooks/useVisualizationEngine';
import { Box, Typography } from '@mui/material';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import Physics3DVisualization from './types/Physics3DVisualization';
import SpectrumVisualization from './types/SpectrumVisualization';
import WaveformVisualization from './types/WaveformVisualization';

interface VisualizationCanvasProps {
    visualization: {
        id: number;
        name: string;
        visualization_type: string;
        data_source: string;
        settings: any;
        layout: {
            position: string;
            size: string;
        };
        style: {
            backgroundColor: string;
        };
        is_real_time: boolean;
        update_interval: number;
    } | null;
}

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
    visualization,
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const visualizationEngine = useVisualizationEngine();

    useEffect(() => {
        if (visualization && canvasRef.current) {
            visualizationEngine.init(canvasRef.current, visualization);

            return () => {
                visualizationEngine.cleanup();
            };
        }
    }, [visualization]);

    if (!visualization) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="subtitle1" color="text.secondary">
                    Select a visualization to view
                </Typography>
            </Box>
        );
    }

    const renderVisualization = () => {
        switch (visualization.visualization_type) {
            case 'waveform':
                return (
                    <Box ref={canvasRef} sx={{ width: '100%', height: '100%' }}>
                        <WaveformVisualization
                            settings={visualization.settings}
                            isRealTime={visualization.is_real_time}
                            updateInterval={visualization.update_interval}
                        />
                    </Box>
                );

            case 'spectrum':
                return (
                    <Box ref={canvasRef} sx={{ width: '100%', height: '100%' }}>
                        <SpectrumVisualization
                            settings={visualization.settings}
                            isRealTime={visualization.is_real_time}
                            updateInterval={visualization.update_interval}
                        />
                    </Box>
                );

            case 'physics_3d':
                return (
                    <Canvas
                        camera={{
                            position: visualization.settings.cameraPosition,
                            fov: visualization.settings.cameraFov,
                        }}
                        style={{ background: visualization.style.backgroundColor }}
                    >
                        <Physics3DVisualization
                            settings={visualization.settings}
                            isRealTime={visualization.is_real_time}
                            updateInterval={visualization.update_interval}
                        />
                        <OrbitControls />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} intensity={1} />
                        {visualization.settings.showGrid && <gridHelper args={[20, 20]} />}
                        {visualization.settings.showAxes && <axesHelper args={[5]} />}
                    </Canvas>
                );

            default:
                return (
                    <Box
                        sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="subtitle1" color="text.secondary">
                            Unsupported visualization type
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <Box
            sx={{
                height: '100%',
                width: '100%',
                position: 'relative',
                backgroundColor: visualization.style.backgroundColor,
            }}
        >
            {renderVisualization()}
        </Box>
    );
};

export default VisualizationCanvas;

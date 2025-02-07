import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';

interface SpectrumVisualizationProps {
    settings: {
        barCount: number;
        barColor: string;
        barSpacing: number;
        minDecibels: number;
        maxDecibels: number;
        smoothingTimeConstant: number;
    };
    isRealTime: boolean;
    updateInterval: number;
}

const SpectrumVisualization: React.FC<SpectrumVisualizationProps> = ({
    settings,
    isRealTime,
    updateInterval,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up audio context and analyzer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContext.createAnalyser();
        analyzerRef.current.fftSize = settings.barCount * 2;
        analyzerRef.current.minDecibels = settings.minDecibels;
        analyzerRef.current.maxDecibels = settings.maxDecibels;
        analyzerRef.current.smoothingTimeConstant = settings.smoothingTimeConstant;

        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barWidth = (canvas.width - (settings.barCount - 1) * settings.barSpacing) / settings.barCount;

        const draw = () => {
            if (!analyzerRef.current || !ctx) return;

            // Resize canvas to parent size
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }

            // Clear canvas
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Get frequency data
            analyzerRef.current.getByteFrequencyData(dataArray);

            // Draw bars
            ctx.fillStyle = settings.barColor;
            for (let i = 0; i < settings.barCount; i++) {
                const value = dataArray[i];
                const percent = value / 255;
                const height = canvas.height * percent;
                const x = i * (barWidth + settings.barSpacing);
                const y = canvas.height - height;

                ctx.fillRect(x, y, barWidth, height);
            }

            // Schedule next frame
            if (isRealTime) {
                animationFrameRef.current = requestAnimationFrame(draw);
            }
        };

        // Start animation if real-time
        if (isRealTime) {
            // For demo, generate random audio data
            const oscillator = audioContext.createOscillator();
            oscillator.connect(analyzerRef.current);
            oscillator.start();

            animationFrameRef.current = requestAnimationFrame(draw);
        } else {
            // Single draw for static visualization
            draw();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [settings, isRealTime, updateInterval]);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                backgroundColor: 'background.paper',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </Box>
    );
};

export default SpectrumVisualization;

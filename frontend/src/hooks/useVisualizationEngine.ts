import { RootState } from '@store/index';
import { updateVisualization } from '@store/slices/visualizationSlice';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface VisualizationEngineContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  analyzer: AnalyserNode | null;
  dataArray: Uint8Array | null;
  animationFrame: number | null;
}

export const useVisualizationEngine = () => {
  const dispatch = useDispatch();
  const { visualizations } = useSelector((state: RootState) => state.visualization);
  const [engineContext, setEngineContext] = useState<VisualizationEngineContext>({
    canvas: null,
    ctx: null,
    analyzer: null,
    dataArray: null,
    animationFrame: null,
  });

  const initEngine = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setEngineContext(prev => ({
      ...prev,
      canvas,
      ctx,
    }));

    // Set up canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const connectAnalyzer = useCallback((audioContext: AudioContext, source: AudioNode) => {
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    source.connect(analyzer);

    setEngineContext(prev => ({
      ...prev,
      analyzer,
      dataArray: new Uint8Array(analyzer.frequencyBinCount),
    }));
  }, []);

  const startVisualization = useCallback(
    (visualizationId: number) => {
      const visualization = visualizations.find(v => v.id === visualizationId);
      if (
        !visualization ||
        !engineContext.ctx ||
        !engineContext.analyzer ||
        !engineContext.dataArray
      )
        return;

      const animate = () => {
        const frame = requestAnimationFrame(animate);
        setEngineContext(prev => ({ ...prev, animationFrame: frame }));

        engineContext.analyzer!.getByteFrequencyData(engineContext.dataArray!);

        // Clear canvas
        engineContext.ctx!.fillStyle = 'rgba(0, 0, 0, 0.1)';
        engineContext.ctx!.fillRect(
          0,
          0,
          engineContext.canvas!.width,
          engineContext.canvas!.height
        );

        // Draw visualization based on type
        switch (visualization.visualization_type) {
          case 'waveform':
            drawWaveform(engineContext);
            break;
          case 'spectrum':
            drawSpectrum(engineContext);
            break;
          case 'particles':
            drawParticles(engineContext);
            break;
        }

        // Update visualization metrics
        dispatch(
          updateVisualization({
            id: visualizationId,
            metrics: {
              fps: 60,
              dataPoints: engineContext.dataArray!.length,
              peakAmplitude: Math.max(...Array.from(engineContext.dataArray!)),
            },
          })
        );
      };

      animate();
    },
    [dispatch, engineContext, visualizations]
  );

  const stopVisualization = useCallback(() => {
    if (engineContext.animationFrame !== null) {
      cancelAnimationFrame(engineContext.animationFrame);
      setEngineContext(prev => ({ ...prev, animationFrame: null }));
    }
  }, [engineContext.animationFrame]);

  const drawWaveform = (context: VisualizationEngineContext) => {
    if (!context.ctx || !context.dataArray) return;

    const width = context.canvas!.width;
    const height = context.canvas!.height;
    const bufferLength = context.dataArray.length;
    const sliceWidth = width / bufferLength;

    context.ctx.beginPath();
    context.ctx.strokeStyle = 'rgb(0, 255, 0)';
    context.ctx.lineWidth = 2;

    for (let i = 0; i < bufferLength; i++) {
      const x = i * sliceWidth;
      const v = context.dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        context.ctx.moveTo(x, y);
      } else {
        context.ctx.lineTo(x, y);
      }
    }

    context.ctx.stroke();
  };

  const drawSpectrum = (context: VisualizationEngineContext) => {
    if (!context.ctx || !context.dataArray) return;

    const width = context.canvas!.width;
    const height = context.canvas!.height;
    const bufferLength = context.dataArray.length;
    const barWidth = width / bufferLength;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (context.dataArray[i] / 255) * height;
      const hue = (i / bufferLength) * 360;

      context.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      context.ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
  };

  const drawParticles = (context: VisualizationEngineContext) => {
    if (!context.ctx || !context.dataArray) return;

    const width = context.canvas!.width;
    const height = context.canvas!.height;
    const bufferLength = context.dataArray.length;
    const particles = 100;

    for (let i = 0; i < particles; i++) {
      const amplitude = context.dataArray[i % bufferLength] / 255;
      const angle = (i / particles) * Math.PI * 2;
      const radius = (amplitude * Math.min(width, height)) / 3;

      const x = width / 2 + Math.cos(angle) * radius;
      const y = height / 2 + Math.sin(angle) * radius;
      const size = amplitude * 10;

      context.ctx.beginPath();
      context.ctx.arc(x, y, size, 0, Math.PI * 2);
      context.ctx.fillStyle = `hsla(${(angle * 180) / Math.PI}, 100%, 50%, ${amplitude})`;
      context.ctx.fill();
    }
  };

  useEffect(() => {
    return () => {
      stopVisualization();
    };
  }, [stopVisualization]);

  return {
    initEngine,
    connectAnalyzer,
    startVisualization,
    stopVisualization,
    visualizations,
  };
};

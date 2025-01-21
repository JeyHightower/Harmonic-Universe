import React, { useCallback, useEffect, useRef } from 'react';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { useResizeEvent } from '../../hooks/useEventListener';
import styles from './AudioVisualizer.module.css';

const AudioVisualizer = ({ analyzer, width = 800, height = 200 }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    contextRef.current = context;
  };

  useEffect(() => {
    setupCanvas();
  }, [width, height]);

  useResizeEvent(() => {
    setupCanvas();
  });

  const draw = useCallback(() => {
    if (!analyzer || !contextRef.current) return;

    const context = contextRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyzer.getByteFrequencyData(dataArray);

    context.fillStyle = 'rgb(0, 0, 0)';
    context.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height;

      const hue = (i / bufferLength) * 360;
      context.fillStyle = `hsl(${hue}, 100%, 50%)`;
      context.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }, [analyzer, width, height]);

  useAnimationFrame(draw, [draw]);

  return (
    <div className={styles.visualizerContainer}>
      <canvas
        ref={canvasRef}
        className={styles.visualizerCanvas}
        width={width}
        height={height}
      />
    </div>
  );
};

export default AudioVisualizer;

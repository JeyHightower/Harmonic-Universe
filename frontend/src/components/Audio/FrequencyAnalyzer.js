import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import * as Tone from 'tone';
import './FrequencyAnalyzer.css';

const FrequencyAnalyzer = () => {
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const { isPlaying } = useSelector(state => state.audio);

  useEffect(() => {
    // Create analyzer node
    analyzerRef.current = new Tone.Analyser({
      type: 'fft',
      size: 64,
      smoothing: 0.8,
    });

    // Connect to Tone.Destination
    Tone.Destination.connect(analyzerRef.current);

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.dispose();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyzer = analyzerRef.current;

    const draw = () => {
      // Set canvas size to match container
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get frequency data
      const values = analyzer.getValue();
      const bufferLength = values.length;

      // Draw frequency bars
      const barWidth = canvas.width / bufferLength;
      const heightScale = canvas.height / 100;

      ctx.fillStyle = '#4CAF50';

      for (let i = 0; i < bufferLength; i++) {
        const value = Math.max(0, Math.min(100, -values[i] + 100));
        const height = value * heightScale;
        const x = i * barWidth;
        const y = canvas.height - height;

        ctx.fillRect(x, y, barWidth - 1, height);

        // Add gradient effect
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, height);
      }

      // Continue animation if playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      draw();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      // Clear canvas when stopped
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Handle window resize
    const handleResize = () => {
      if (isPlaying) {
        draw();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="frequency-analyzer-container">
      <canvas ref={canvasRef} className="frequency-analyzer-canvas" />
    </div>
  );
};

export default FrequencyAnalyzer;

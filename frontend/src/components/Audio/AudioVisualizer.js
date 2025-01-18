import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import * as Tone from 'tone';
import './AudioVisualizer.css';

const AudioVisualizer = () => {
  const canvasRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const { isPlaying } = useSelector(state => state.audio);

  useEffect(() => {
    // Create analyzer node
    analyzerRef.current = new Tone.Analyser({
      type: 'waveform',
      size: 1024,
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

      // Get waveform data
      const values = analyzer.getValue();
      const bufferLength = values.length;

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = values[i];
        const y = ((v + 1) / 2) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

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
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};

export default AudioVisualizer;

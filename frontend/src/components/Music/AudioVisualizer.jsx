import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import * as Tone from "tone";
import styles from "./AudioVisualizer.module.css";

const AudioVisualizer = ({ isPlaying }) => {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Create analyzer node
    const analyzer = new Tone.Analyser("waveform", 256);
    Tone.Destination.connect(analyzer);
    analyserRef.current = analyzer;

    return () => {
      Tone.Destination.disconnect(analyzer);
      analyzer.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyzer = analyserRef.current;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const values = analyzer.getValue();

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--accent");
      ctx.lineWidth = 2;

      const sliceWidth = width / values.length;
      let x = 0;

      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const y = ((v + 1) / 2) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw frequency bars
      const barWidth = width / 64;
      const barGap = 2;
      const barCount = Math.floor(width / (barWidth + barGap));
      const frequencyData = new Uint8Array(analyzer.size);
      analyzer.getByteFrequencyData(frequencyData);

      for (let i = 0; i < barCount; i++) {
        const barHeight = (frequencyData[i] / 255) * height;
        const x = i * (barWidth + barGap);
        const y = height - barHeight;

        ctx.fillStyle =
          getComputedStyle(canvas).getPropertyValue("--accent-light");
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      draw();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      // Clear canvas when stopped
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className={styles.visualizer}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {!isPlaying && (
        <div className={styles.placeholder}>
          <i className="fas fa-music" />
          <span>Play to visualize audio</span>
        </div>
      )}
    </div>
  );
};

AudioVisualizer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default AudioVisualizer;

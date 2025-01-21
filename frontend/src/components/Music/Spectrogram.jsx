import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import styles from './Spectrogram.module.css';

const Spectrogram = ({ analyser, fftSize = 2048 }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!analyser) return;

    analyser.fftSize = fftSize;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let scrollPos = 0;
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Scroll the existing spectrogram left
      const imageData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      // Draw new data on the right edge
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const y = canvas.height - (i / bufferLength) * canvas.height;

        // Use HSL color for better visualization
        const hue = (value / 255) * 240; // Blue to red
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(canvas.width - 1, y, 1, canvas.height / bufferLength);
      }

      scrollPos += 1;
      if (scrollPos >= canvas.width) {
        scrollPos = 0;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, fftSize]);

  return (
    <div className={styles.spectrogram}>
      <h3>Frequency Spectrum</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className={styles.canvas}
      />
      <div className={styles.labels}>
        <span>20 Hz</span>
        <span>1 kHz</span>
        <span>20 kHz</span>
      </div>
    </div>
  );
};

Spectrogram.propTypes = {
  analyser: PropTypes.object, // Web Audio AnalyserNode
  fftSize: PropTypes.number,
};

Spectrogram.defaultProps = {
  analyser: null,
  fftSize: 2048,
};

export default Spectrogram;

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Audio.module.css';

const HarmonicsEditor = ({ harmonics, onChange, disabled }) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const drawHarmonics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= harmonics.length; i++) {
      const x = (i * width) / harmonics.length;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (i * height) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw harmonics bars
    const barWidth = width / harmonics.length;
    ctx.fillStyle = '#4a90e2';

    harmonics.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height;
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
    });

    // Draw active bar highlight
    if (activeIndex >= 0) {
      ctx.strokeStyle = '#357abd';
      ctx.lineWidth = 2;
      const x = activeIndex * barWidth;
      ctx.strokeRect(x, 0, barWidth - 2, height);
    }
  }, [harmonics, activeIndex]);

  useEffect(() => {
    drawHarmonics();
  }, [drawHarmonics]);

  const getHarmonicIndexFromEvent = e => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.floor((x / canvas.width) * harmonics.length);
  };

  const updateHarmonic = e => {
    if (disabled) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const value = Math.max(0, Math.min(1, 1 - y / canvas.height));

    if (activeIndex >= 0) {
      const newHarmonics = [...harmonics];
      newHarmonics[activeIndex] = value;
      onChange(newHarmonics);
    }
  };

  const handleMouseDown = e => {
    if (disabled) return;
    setIsDragging(true);
    const index = getHarmonicIndexFromEvent(e);
    setActiveIndex(index);
    updateHarmonic(e);
  };

  const handleMouseMove = e => {
    if (!isDragging || disabled) return;
    updateHarmonic(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveIndex(-1);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={styles.harmonicsEditor}>
      <h3 className={styles.sectionTitle}>Harmonics</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className={`${styles.harmonicsCanvas} ${
          disabled ? styles.disabled : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      <div className={styles.harmonicsControls}>
        <button
          className={styles.resetButton}
          onClick={() => onChange(Array(16).fill(0))}
          disabled={disabled}
        >
          Reset
        </button>
        <button
          className={styles.presetButton}
          onClick={() =>
            onChange([
              1,
              0.5,
              0.33,
              0.25,
              0.2,
              0.17,
              0.14,
              0.13,
              ...Array(8).fill(0),
            ])
          }
          disabled={disabled}
        >
          Natural
        </button>
        <button
          className={styles.presetButton}
          onClick={() =>
            onChange([1, 0, 0.33, 0, 0.2, 0, 0.14, 0, ...Array(8).fill(0)])
          }
          disabled={disabled}
        >
          Odd
        </button>
      </div>
    </div>
  );
};

HarmonicsEditor.propTypes = {
  harmonics: PropTypes.arrayOf(PropTypes.number).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default HarmonicsEditor;

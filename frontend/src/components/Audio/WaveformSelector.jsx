import PropTypes from 'prop-types';
import React from 'react';
import styles from './Audio.module.css';

const WAVEFORM_TYPES = [
  { id: 'sine', label: 'Sine', icon: '〰️' },
  { id: 'square', label: 'Square', icon: '⊓⊓' },
  { id: 'sawtooth', label: 'Sawtooth', icon: '⋀⋀' },
  { id: 'triangle', label: 'Triangle', icon: '△△' },
  { id: 'custom', label: 'Custom', icon: '✎' },
];

const WaveformSelector = ({ value, onChange, disabled }) => {
  return (
    <div className={styles.waveformSelector}>
      <h3 className={styles.sectionTitle}>Waveform</h3>
      <div className={styles.waveformButtons}>
        {WAVEFORM_TYPES.map(type => (
          <button
            key={type.id}
            className={`${styles.waveformButton} ${
              value === type.id ? styles.active : ''
            }`}
            onClick={() => onChange(type.id)}
            disabled={disabled}
            title={type.label}
          >
            <span className={styles.waveformIcon}>{type.icon}</span>
            <span className={styles.waveformLabel}>{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

WaveformSelector.propTypes = {
  value: PropTypes.oneOf(WAVEFORM_TYPES.map(t => t.id)).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default WaveformSelector;

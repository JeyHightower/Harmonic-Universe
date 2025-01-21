import PropTypes from 'prop-types';
import React, { useState } from 'react';
import styles from './Audio.module.css';

const DEFAULT_PRESETS = [
  {
    id: 'natural',
    name: 'Natural',
    waveform: 'sine',
    harmonics: [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.13, ...Array(8).fill(0)],
  },
  {
    id: 'odd',
    name: 'Odd Harmonics',
    waveform: 'triangle',
    harmonics: [1, 0, 0.33, 0, 0.2, 0, 0.14, 0, ...Array(8).fill(0)],
  },
  {
    id: 'square',
    name: 'Square-like',
    waveform: 'square',
    harmonics: [
      1, 0, 0.33, 0, 0.2, 0, 0.14, 0, 0.11, 0, 0.09, 0, 0.08, 0, 0.07, 0,
    ],
  },
  {
    id: 'saw',
    name: 'Sawtooth-like',
    waveform: 'sawtooth',
    harmonics: [
      1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.13, 0.11, 0.1, 0.09, 0.08, 0.07,
      0.07, 0.06, 0.06,
    ],
  },
];

const PresetBank = ({
  onPresetSelect,
  currentWaveform,
  currentHarmonics,
  disabled,
}) => {
  const [customPresets, setCustomPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handlePresetSelect = preset => {
    if (disabled) return;
    onPresetSelect({
      waveform: preset.waveform,
      harmonics: [...preset.harmonics],
    });
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim() || disabled) return;

    const newPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      waveform: currentWaveform,
      harmonics: [...currentHarmonics],
    };

    setCustomPresets([...customPresets, newPreset]);
    setNewPresetName('');
    setShowSaveForm(false);
  };

  const handleDeletePreset = presetId => {
    if (disabled) return;
    setCustomPresets(customPresets.filter(preset => preset.id !== presetId));
  };

  return (
    <div className={styles.presetBank}>
      <h3 className={styles.sectionTitle}>Presets</h3>
      <div className={styles.presetList}>
        {DEFAULT_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            className={styles.presetButton}
            disabled={disabled}
          >
            {preset.name}
          </button>
        ))}
        {customPresets.map(preset => (
          <div key={preset.id} className={styles.customPreset}>
            <button
              onClick={() => handlePresetSelect(preset)}
              className={styles.presetButton}
              disabled={disabled}
            >
              {preset.name}
            </button>
            <button
              onClick={() => handleDeletePreset(preset.id)}
              className={styles.deletePresetButton}
              disabled={disabled}
              title="Delete preset"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {showSaveForm ? (
        <div className={styles.savePresetForm}>
          <input
            type="text"
            value={newPresetName}
            onChange={e => setNewPresetName(e.target.value)}
            placeholder="Preset name"
            className={styles.presetInput}
            disabled={disabled}
          />
          <div className={styles.savePresetButtons}>
            <button
              onClick={handleSavePreset}
              className={styles.saveButton}
              disabled={!newPresetName.trim() || disabled}
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className={styles.cancelButton}
              disabled={disabled}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveForm(true)}
          className={styles.addPresetButton}
          disabled={disabled}
        >
          Save Current as Preset
        </button>
      )}
    </div>
  );
};

PresetBank.propTypes = {
  onPresetSelect: PropTypes.func.isRequired,
  currentWaveform: PropTypes.string.isRequired,
  currentHarmonics: PropTypes.arrayOf(PropTypes.number).isRequired,
  disabled: PropTypes.bool,
};

export default PresetBank;

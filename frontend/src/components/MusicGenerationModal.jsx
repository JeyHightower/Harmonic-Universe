import React, { useState } from 'react';
import Button from '../../common/Button';
import Input from '../../common/Input';
import './Music.css';

const DEFAULT_MUSIC_PARAMS = {
  tempo: 120,
  scale_type: 'major',
  root_note: 'C',
  melody_complexity: 0.5,
};

const SCALE_OPTIONS = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'harmonic_minor', label: 'Harmonic Minor' },
  { value: 'melodic_minor', label: 'Melodic Minor' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'blues', label: 'Blues' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'locrian', label: 'Locrian' },
];

const ROOT_NOTE_OPTIONS = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D#' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G#' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A#' },
  { value: 'B', label: 'B' },
];

const MusicGenerationModal = ({ onSubmit, onClose, initialParams = {} }) => {
  const [params, setParams] = useState({
    ...DEFAULT_MUSIC_PARAMS,
    ...initialParams,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (name, value) => {
    setParams(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      await onSubmit(params);
      onClose();
    } catch (error) {
      console.error('Error generating music:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="music-generation-modal">
      <div className="modal-content">
        <h2>Music Generation Settings</h2>
        <p className="modal-description">
          Customize your music generation parameters to create a unique
          soundscape for your universe.
        </p>

        <div className="form-group">
          <Input
            label="Tempo (BPM)"
            type="number"
            min={60}
            max={200}
            value={params.tempo}
            onChange={val => handleChange('tempo', val)}
          />
        </div>

        <div className="form-group">
          <select
            label="Scale Type"
            value={params.scale_type}
            onChange={val => handleChange('scale_type', val)}
          >
            {SCALE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <select
            label="Root Note"
            value={params.root_note}
            onChange={val => handleChange('root_note', val)}
          >
            {ROOT_NOTE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <Input
            label="Melody Complexity"
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={params.melody_complexity}
            onChange={val => handleChange('melody_complexity', parseFloat(val))}
          />
          <div className="range-labels">
            <span>Simple</span>
            <span>Complex</span>
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isGenerating}
            disabled={isGenerating}
          >
            Generate Music
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicGenerationModal;

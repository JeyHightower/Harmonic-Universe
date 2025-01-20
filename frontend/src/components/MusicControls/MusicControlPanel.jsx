import React from 'react';
import BaseControlPanel from '../Common/BaseControlPanel';
import './MusicControlPanel.css';

const MusicControlPanel = ({ initialValues, onChange }) => {
  const controls = [
    {
      name: 'harmony',
      label: 'Harmony',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'tempo',
      label: 'Tempo',
      type: 'range',
      min: 40,
      max: 200,
      step: 1,
    },
    {
      name: 'key',
      label: 'Key',
      type: 'select',
      options: [
        'C',
        'C#',
        'D',
        'D#',
        'E',
        'F',
        'F#',
        'G',
        'G#',
        'A',
        'A#',
        'B',
      ],
    },
    {
      name: 'scale',
      label: 'Scale',
      type: 'select',
      options: [
        'major',
        'minor',
        'harmonic minor',
        'melodic minor',
        'pentatonic',
        'blues',
      ],
    },
  ];

  const infoItems = [
    { label: 'Harmony', description: 'Controls the harmonic complexity (0-1)' },
    { label: 'Tempo', description: 'Sets the speed of the music (40-200 BPM)' },
    { label: 'Key', description: 'Determines the tonal center of the music' },
    { label: 'Scale', description: 'Sets the musical mode or scale type' },
  ];

  return (
    <BaseControlPanel
      title="Music Parameters"
      controls={controls}
      values={initialValues}
      onChange={onChange}
      infoItems={infoItems}
      className="music-control-panel"
    />
  );
};

export default MusicControlPanel;

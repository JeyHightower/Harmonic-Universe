import React from 'react';
import BaseControlPanel from '../Common/BaseControlPanel';
import './VisualizationControlPanel.css';

const VisualizationControlPanel = ({ initialValues, onChange }) => {
  const controls = [
    {
      name: 'brightness',
      label: 'Brightness',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'saturation',
      label: 'Saturation',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'complexity',
      label: 'Complexity',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'colorScheme',
      label: 'Color Scheme',
      type: 'select',
      options: [
        'rainbow',
        'monochrome',
        'complementary',
        'analogous',
        'triadic',
        'custom',
      ],
    },
  ];

  const infoItems = [
    {
      label: 'Brightness',
      description: 'Controls the overall luminosity (0-1)',
    },
    { label: 'Saturation', description: 'Sets the color intensity (0-1)' },
    {
      label: 'Complexity',
      description: 'Determines the detail level of visualizations (0-1)',
    },
    {
      label: 'Color Scheme',
      description: 'Sets the color palette for visualizations',
    },
  ];

  return (
    <BaseControlPanel
      title="Visualization Parameters"
      controls={controls}
      values={initialValues}
      onChange={onChange}
      infoItems={infoItems}
      className="visualization-control-panel"
    />
  );
};

export default VisualizationControlPanel;

import React from 'react';
import BaseControlPanel from '../Common/BaseControlPanel';
import './PhysicsControlPanel.css';

const PhysicsControlPanel = ({ initialValues, onChange }) => {
  const controls = [
    {
      name: 'gravity',
      label: 'Gravity',
      type: 'range',
      min: 0,
      max: 20,
      step: 0.1,
    },
    {
      name: 'friction',
      label: 'Friction',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'elasticity',
      label: 'Elasticity',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'airResistance',
      label: 'Air Resistance',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      name: 'density',
      label: 'Density',
      type: 'range',
      min: 0,
      max: 5,
      step: 0.1,
    },
  ];

  const infoItems = [
    {
      label: 'Gravity',
      description: 'Controls the strength of gravitational force (0-20 m/s²)',
    },
    {
      label: 'Friction',
      description: 'Determines surface friction between objects (0-1)',
    },
    {
      label: 'Elasticity',
      description: 'Controls how bouncy objects are (0-1)',
    },
    {
      label: 'Air Resistance',
      description: 'Affects how objects move through air (0-1)',
    },
    {
      label: 'Density',
      description: 'Controls object mass per volume (0-5 kg/m³)',
    },
  ];

  return (
    <BaseControlPanel
      title="Physics Parameters"
      controls={controls}
      values={initialValues}
      onChange={onChange}
      infoItems={infoItems}
      className="physics-control-panel"
    />
  );
};

export default PhysicsControlPanel;

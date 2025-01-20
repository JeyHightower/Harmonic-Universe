import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import useControlPanel from '../../hooks/useControlPanel';
import BaseControlPanel from '../Common/BaseControlPanel';
import './PhysicsControlPanel.css';

const DEFAULT_VALUES = {
  gravity: 9.81,
  friction: 0.5,
  elasticity: 0.7,
  airResistance: 0.1,
  density: 1.0,
};

const PHYSICS_CONTROLS = [
  {
    id: 'gravity',
    label: 'Gravity (m/s²)',
    type: 'range',
    min: 0,
    max: 20,
    step: 0.1,
    valueType: 'number',
    unit: 'm/s²',
  },
  {
    id: 'friction',
    label: 'Friction Coefficient',
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    valueType: 'number',
  },
  {
    id: 'elasticity',
    label: 'Elasticity',
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    valueType: 'number',
  },
  {
    id: 'airResistance',
    label: 'Air Resistance',
    type: 'range',
    min: 0,
    max: 1,
    step: 0.01,
    valueType: 'number',
  },
  {
    id: 'density',
    label: 'Density (kg/m³)',
    type: 'range',
    min: 0,
    max: 5,
    step: 0.1,
    valueType: 'number',
    unit: 'kg/m³',
  },
];

const PHYSICS_INFO = [
  'Gravity affects the vertical motion of objects',
  'Friction determines the resistance between surfaces',
  'Elasticity controls how bouncy objects are',
  'Air Resistance affects object motion through air',
  'Density influences object mass and buoyancy',
];

const PhysicsControlPanel = ({ initialValues, onChange }) => {
  // Memoize controls configuration
  const controls = useMemo(() => PHYSICS_CONTROLS, []);
  const infoItems = useMemo(() => PHYSICS_INFO, []);

  const { parameters, updateParameter } = useControlPanel(
    initialValues,
    DEFAULT_VALUES,
    onChange
  );

  return (
    <BaseControlPanel
      title="Physics"
      controls={controls}
      values={parameters}
      onChange={updateParameter}
      infoItems={infoItems}
      className="physics-control-panel"
    />
  );
};

PhysicsControlPanel.propTypes = {
  initialValues: PropTypes.shape({
    gravity: PropTypes.number,
    friction: PropTypes.number,
    elasticity: PropTypes.number,
    airResistance: PropTypes.number,
    density: PropTypes.number,
  }),
  onChange: PropTypes.func,
};

export default React.memo(PhysicsControlPanel);

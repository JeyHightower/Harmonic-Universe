import React from 'react';
import Icon from '../common/Icon';

/**
 * Test component to display all available icons
 */
const IconTest = () => {
  const icons = [
    'edit',
    'delete',
    'physics',
    'add',
    'error',
    'refresh',
    'view',
    'empty',
    'check',
    'warning',
    'basic',
    'position',
    'material',
    'box',
    'sphere',
    'capsule',
    'cylinder',
    'cone',
    'plane',
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Icon Test</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}
      >
        {icons.map(iconName => (
          <div
            key={iconName}
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={iconName} size="large" />
            <div style={{ marginTop: '8px' }}>{iconName}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '40px' }}>Icon Sizes</h2>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>
          <Icon name="physics" size="small" />
          <div>Small</div>
        </div>
        <div>
          <Icon name="physics" size="medium" />
          <div>Medium</div>
        </div>
        <div>
          <Icon name="physics" size="large" />
          <div>Large</div>
        </div>
      </div>

      <h2 style={{ marginTop: '40px' }}>Non-existent Icon (Fallback Test)</h2>
      <div>
        <Icon name="non-existent-icon" size="large" />
        <div>non-existent-icon</div>
      </div>
    </div>
  );
};

export default IconTest;

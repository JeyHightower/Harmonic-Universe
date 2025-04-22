import React from 'react';

// HOC to make Ant Icons version-safe
export const withVersionSafety = (IconComponent) => {
  if (!IconComponent) return () => null;

  const SafeIcon = (props) => {
    try {
      return React.createElement(IconComponent, props);
    } catch (e) {
      if (e.message && e.message.includes('version')) {
        console.warn('Caught version error in icon render');
        return React.createElement('span', {
          className: `ant-icon-fallback ${props.className || ''}`,
          style: props.style,
        });
      }
      throw e;
    }
  };

  SafeIcon.displayName = `Safe(${IconComponent.displayName || 'Icon'})`;
  return SafeIcon;
};

// Example usage:
// import { UserOutlined } from '@ant-design/icons';
// const SafeUserIcon = withVersionSafety(UserOutlined);
// Then use <SafeUserIcon /> in your component

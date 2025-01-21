import PropTypes from 'prop-types';
import React from 'react';
import './BaseControlPanel.css';

const BaseControlPanel = ({
  title,
  controls,
  values,
  onChange,
  infoItems,
  className,
}) => {
  const handleChange = (name, value) => {
    const newValues = {
      ...values,
      [name]: value,
    };
    onChange?.(newValues);
  };

  const renderControl = control => {
    const value = values?.[control.name] ?? '';

    switch (control.type) {
      case 'range':
        return (
          <div className="control-group" key={control.name}>
            <label htmlFor={control.name}>{control.label}</label>
            <div className="range-container">
              <input
                type="range"
                id={control.name}
                min={control.min}
                max={control.max}
                step={control.step}
                value={value}
                onChange={e =>
                  handleChange(control.name, parseFloat(e.target.value))
                }
              />
              <span className="value">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="control-group" key={control.name}>
            <label htmlFor={control.name}>{control.label}</label>
            <select
              id={control.name}
              value={value}
              onChange={e => handleChange(control.name, e.target.value)}
              className="select-control"
            >
              {control.options.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`base-control-panel ${className || ''}`}>
      <h3>{title}</h3>
      <div className="control-grid">{controls.map(renderControl)}</div>
      {infoItems && (
        <div className="info-section">
          <h4>Parameter Information</h4>
          <div className="info-grid">
            {infoItems.map(item => (
              <div key={item.label} className="info-item">
                <span className="info-label">{item.label}:</span>
                <span className="info-description">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

BaseControlPanel.propTypes = {
  title: PropTypes.string.isRequired,
  controls: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['range', 'select']).isRequired,
      min: PropTypes.number,
      max: PropTypes.number,
      step: PropTypes.number,
      options: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  values: PropTypes.object,
  onChange: PropTypes.func,
  infoItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  className: PropTypes.string,
};

export default BaseControlPanel;

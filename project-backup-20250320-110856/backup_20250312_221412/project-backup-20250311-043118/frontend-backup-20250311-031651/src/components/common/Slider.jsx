import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import '../../styles/slider.css';

/**
 * Slider component for numeric input
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the slider
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.step - Step increment
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Function called when value changes
 * @param {boolean} props.showValue - Whether to show the current value
 * @param {string} props.valuePrefix - Prefix for the displayed value
 * @param {string} props.valueSuffix - Suffix for the displayed value
 * @param {number} props.decimalPlaces - Number of decimal places to display
 * @param {boolean} props.disabled - Whether the slider is disabled
 */
const Slider = ({
  id,
  min,
  max,
  step,
  value,
  onChange,
  showValue,
  valuePrefix,
  valueSuffix,
  decimalPlaces,
  disabled,
  className,
  ...rest
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Format the displayed value
  const formatValue = val => {
    const formatted =
      typeof decimalPlaces === 'number' ? val.toFixed(decimalPlaces) : val;
    return `${valuePrefix}${formatted}${valueSuffix}`;
  };

  // Calculate percentage for slider position
  const getPercentage = val => {
    return ((val - min) / (max - min)) * 100;
  };

  // Handle slider input change
  const handleChange = e => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Handle direct input in the number field
  const handleNumberInput = e => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  // Handle mouse down on the slider track for custom interaction
  const handleMouseDown = e => {
    if (disabled) return;
    setIsDragging(true);
    updateValueFromMousePosition(e);

    // Add event listeners for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move during drag
  const handleMouseMove = e => {
    if (isDragging) {
      updateValueFromMousePosition(e);
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Update value based on mouse position
  const updateValueFromMousePosition = e => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newValue = min + position * (max - min);

    // Round to nearest step
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  return (
    <div
      className={`slider-container ${className || ''} ${
        disabled ? 'disabled' : ''
      }`}
    >
      <div
        className="slider-track"
        ref={sliderRef}
        onMouseDown={handleMouseDown}
      >
        <div
          className="slider-fill"
          style={{ width: `${getPercentage(localValue)}%` }}
        />
        <div
          className="slider-thumb"
          style={{ left: `${getPercentage(localValue)}%` }}
        />
      </div>

      <div className="slider-controls">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          disabled={disabled}
          className="slider-input"
          {...rest}
        />

        {showValue && (
          <div className="slider-value-container">
            <input
              type="number"
              value={localValue}
              onChange={handleNumberInput}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="slider-value-input"
            />
            <span className="slider-value-display">
              {formatValue(localValue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

Slider.propTypes = {
  id: PropTypes.string.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  showValue: PropTypes.bool,
  valuePrefix: PropTypes.string,
  valueSuffix: PropTypes.string,
  decimalPlaces: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

Slider.defaultProps = {
  min: 0,
  max: 100,
  step: 1,
  showValue: true,
  valuePrefix: '',
  valueSuffix: '',
  decimalPlaces: 2,
  disabled: false,
  className: '',
};

export default Slider;

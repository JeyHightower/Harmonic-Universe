import PropTypes from 'prop-types';
import '../../styles/Input.css';

function Input({
  type = 'text',
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  onClick,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  rows = 3,
}) {
  const inputId = `input-${name}`;
  const hasError = Boolean(error);

  // Add a specialized set of event handlers to ensure the input is interactive
  // even when placed inside modals
  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Ensure this input gets focus
    setTimeout(() => {
      if (document.activeElement !== e.target) {
        e.target.focus();
      }
    }, 0);
  };

  const handleClick = (e) => {
    e.stopPropagation();

    // Ensure this input gets focus
    if (document.activeElement !== e.target) {
      e.target.focus();
    }
  };

  // Add the event handlers to the input element
  const inputProps = {
    ...props,
    onMouseDown: handleMouseDown,
    onClick: handleClick,
    style: {
      pointerEvents: 'auto',
      cursor: props.type === 'text' ? 'text' : 'pointer',
      position: 'relative',
      zIndex: '10000',
    },
  };

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`input-field input-textarea ${hasError ? 'input-error' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          rows={rows}
          onFocus={(e) => {
            e.stopPropagation();
            if (onFocus) onFocus(e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick(e);
          }}
          onMouseDown={handleMouseDown}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`input-field ${hasError ? 'input-error' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          onFocus={(e) => {
            e.stopPropagation();
            if (onFocus) onFocus(e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick(e);
          }}
          onMouseDown={handleMouseDown}
        />
      )}
      {hasError && (
        <span id={`${inputId}-error`} className="input-error-message">
          {error}
        </span>
      )}
    </div>
  );
}

Input.propTypes = {
  type: PropTypes.oneOf(['text', 'password', 'email', 'number', 'tel', 'url', 'textarea']),
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onClick: PropTypes.func,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  rows: PropTypes.number,
};

export default Input;

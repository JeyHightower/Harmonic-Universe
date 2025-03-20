import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Button.css';
import Spinner from './Spinner';

/**
 * Button component that supports various styles and states
 * @param {Object} props
 * @param {('primary'|'secondary'|'tertiary'|'danger'|'icon'|'icon-danger'|'accent'|'coral'|'mint'|'gold')} [props.variant='primary'] - Button variant
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Button size
 * @param {boolean} [props.fullWidth=false] - Whether button should take full width
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.loading=false] - Whether button is in loading state
 */
const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      disabled = false,
      loading = false,
      as: Component = 'button',
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const buttonClass = `
    button
    button-${variant}
    button-${size}
    ${fullWidth ? 'button-full-width' : ''}
    ${disabled || loading ? 'button-disabled' : ''}
    ${loading ? 'button-loading' : ''}
    ${variant === 'icon' ? 'button-icon' : ''}
    ${variant === 'icon-danger' ? 'button-icon button-icon-danger' : ''}
    ${className}
  `
      .trim()
      .replace(/\s+/g, ' ');

    // If it's a Link and disabled/loading, render a button instead
    if (Component === Link && (disabled || loading)) {
      return (
        <button
          className={buttonClass}
          disabled
          onClick={e => e.preventDefault()}
          type="button"
          ref={ref}
          {...props}
        >
          {loading ? (
            <>
              <Spinner size="small" />
              <span className="button-text">{children}</span>
            </>
          ) : (
            children
          )}
        </button>
      );
    }

    return (
      <Component
        className={buttonClass}
        disabled={disabled || loading}
        onClick={onClick}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="small" />
            <span className="button-text">{children}</span>
          </>
        ) : (
          children
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'tertiary',
    'danger',
    'icon',
    'icon-danger',
    'accent',
    'coral',
    'mint',
    'gold',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  as: PropTypes.elementType,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Button;

import PropTypes from "prop-types";
import React, { useEffect } from "react";
import "./SuccessMessage.css";

const SuccessMessage = ({
  message,
  duration = 3000,
  onDismiss,
  showIcon = true,
  variant = "default",
}) => {
  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={`success-message variant-${variant}`}>
      {showIcon && <div className="success-icon">✓</div>}
      <p className="success-text">{message}</p>
      {onDismiss && (
        <button className="dismiss-button" onClick={handleDismiss}>
          ×
        </button>
      )}
    </div>
  );
};

SuccessMessage.propTypes = {
  message: PropTypes.string.isRequired,
  duration: PropTypes.number,
  onDismiss: PropTypes.func,
  showIcon: PropTypes.bool,
  variant: PropTypes.oneOf(["default", "toast", "inline"]),
};

export default SuccessMessage;

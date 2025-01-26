import PropTypes from "prop-types";
import React from "react";
import "./ErrorMessage.css";

const ErrorMessage = ({ message, onDismiss, type = "error" }) => {
  if (!message) return null;

  return (
    <div className={`error-container ${type}`} data-testid="error-message">
      <div className="error-content">
        <span className="error-text">{message}</span>
        {onDismiss && (
          <button className="error-dismiss" onClick={onDismiss}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  onDismiss: PropTypes.func,
  type: PropTypes.oneOf(["error", "warning", "info"]),
};

export default ErrorMessage;

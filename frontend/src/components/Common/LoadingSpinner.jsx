import PropTypes from "prop-types";
import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = ({
  size = "medium",
  overlay = false,
  text = "Loading...",
}) => {
  const spinnerClass = `spinner-${size}`;

  if (overlay) {
    return (
      <div className="spinner-overlay">
        <div className="spinner-container">
          <div className={spinnerClass}></div>
          {text && <p className="spinner-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-container" data-testid="loading-indicator">
      <div className={spinnerClass}></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  overlay: PropTypes.bool,
  text: PropTypes.string,
};

export default LoadingSpinner;

import PropTypes from "prop-types";
import React from "react";
import commonStyles from "../../styles/common.module.css";

const LoadingErrorState = ({
  isLoading,
  error,
  loadingMessage = "Loading...",
  errorMessage,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className={commonStyles.loading}>
        <div className={commonStyles.spinner}></div>
        <p>{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={commonStyles.error}>
        <h3>Error</h3>
        <p>{errorMessage || error}</p>
        {onRetry && (
          <button onClick={onRetry} className={commonStyles.primaryButton}>
            Retry
          </button>
        )}
      </div>
    );
  }

  return null;
};

LoadingErrorState.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  loadingMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func,
};

export default LoadingErrorState;

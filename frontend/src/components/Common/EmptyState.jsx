// components/EmptyState.js
import React from "react";

const EmptyState = ({ message, actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <img
          src="/empty-state-icon.svg"
          alt="No universes"
          className="empty-state-icon"
        />
        <p className="empty-state-message">{message}</p>
        {actionLabel && (
          <button className="empty-state-action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

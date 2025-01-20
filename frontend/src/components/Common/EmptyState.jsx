import PropTypes from 'prop-types';
import React from 'react';
import './EmptyState.css';

const EmptyState = ({
  title = 'No Data Found',
  message = 'There are no items to display.',
  icon = '📭',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

export default EmptyState;

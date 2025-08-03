import React from 'react';
import './SimpleModalTest.css';

const SimpleModalTest = ({ open, onClose, title, children }) => {
  if (!open) return null;

  console.log('🧪 SimpleModalTest rendering with open =', open);

  return (
    <div className="simple-modal-overlay" onClick={onClose}>
      <div className="simple-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="simple-modal-header">
          <h2>{title}</h2>
          <button className="simple-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="simple-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SimpleModalTest;
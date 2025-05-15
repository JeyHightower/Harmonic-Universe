import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ModalSystem } from './index.mjs';

/**
 * DraggableModal component that enables dragging functionality for modals
 */
const DraggableModal = ({ children, ...modalProps }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // Reset position when the modal opens
  useEffect(() => {
    if (modalProps.isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [modalProps.isOpen]);

  const handleMouseDown = (e) => {
    // Only allow dragging from the header
    if (!e.target.closest('.modal-header')) return;

    setIsDragging(true);

    // Calculate the offset of the mouse relative to the modal position
    const modalElement = e.target.closest('.modal');
    if (modalElement) {
      const modalRect = modalElement.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - modalRect.left - position.x,
        y: e.clientY - modalRect.top - position.y,
      });
    }

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      // Update position based on mouse movement and initial offset
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Wrapper for modal content to apply drag styles
  const draggableContent = (
    <div
      className="draggable-container"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );

  return (
    <ModalSystem
      {...modalProps}
      className={`draggable-modal ${modalProps.className || ''} ${isDragging ? 'dragging' : ''}`}
      ref={modalRef}
    >
      {draggableContent}
    </ModalSystem>
  );
};

DraggableModal.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  // All other Modal props are passed through
};

export default DraggableModal;

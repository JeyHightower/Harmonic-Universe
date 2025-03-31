import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import { ModalSystem } from "./";

const DraggableModal = ({ children, ...modalProps }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalEl, setModalEl] = useState(null);

  // Reset position when the modal opens
  useEffect(() => {
    if (modalProps.isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [modalProps.isOpen]);

  // Callback ref to get the modal element
  const modalRefCallback = useCallback((node) => {
    if (node !== null) {
      // The node is the modal overlay, find the actual modal element
      const modalElement = node.querySelector(".modal-content");
      setModalEl(modalElement);
    }
  }, []);

  const handleMouseDown = (e) => {
    // Only allow dragging from the header
    if (!e.target.closest(".modal-header")) return;

    setIsDragging(true);

    if (modalEl) {
      // Calculate the offset of the mouse relative to the modal position
      const modalRect = modalEl.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - modalRect.left - position.x,
        y: e.clientY - modalRect.top - position.y,
      });
    }

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    // Update position based on mouse movement and initial offset
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Wrapper for the modal children that applies the dragging behavior
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
      className={`draggable-modal ${modalProps.className || ""} ${
        isDragging ? "dragging" : ""
      }`}
      ref={modalRefCallback}
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

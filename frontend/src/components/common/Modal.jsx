import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { MODAL_CONFIG } from "../../utils/config";
import { getPortalRoot } from "../../utils/portalUtils";
import "../../styles/Modal.css";

const Modal = ({
  isOpen,
  onClose,
  children,
  type = MODAL_CONFIG.TYPES.DEFAULT,
  size = MODAL_CONFIG.SIZES.MEDIUM,
  position = MODAL_CONFIG.POSITIONS.CENTER,
  animation = MODAL_CONFIG.ANIMATIONS.FADE,
  draggable = MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
  closeOnEscape = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
  closeOnBackdrop = MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
  preventBodyScroll = MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
  showCloseButton = MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
  title,
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const portalRoot = getPortalRoot();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (preventBodyScroll) {
        document.body.style.overflow = "hidden";
      }
    } else {
      setIsVisible(false);
      if (preventBodyScroll) {
        document.body.style.overflow = "";
      }
    }
  }, [isOpen, preventBodyScroll]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleMouseDown = (event) => {
    if (draggable) {
      setIsDragging(true);
      setDragStart({
        x: event.clientX - modalPosition.x,
        y: event.clientY - modalPosition.y,
      });
    }
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      setModalPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !portalRoot) {
    return null;
  }

  const modalContent = (
    <div
      className={`modal-overlay ${isVisible ? "visible" : ""}`}
      onClick={handleBackdropClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={modalRef}
        className={`modal-content modal-${type} modal-${size} modal-${position} modal-animation-${animation}`}
        style={{
          transform: draggable
            ? `translate(${modalPosition.x}px, ${modalPosition.y}px)`
            : undefined,
          ...style,
        }}
        onMouseDown={handleMouseDown}
      >
        {showCloseButton && (
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        )}
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRoot);
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(Object.values(MODAL_CONFIG.TYPES)),
  size: PropTypes.oneOf(Object.values(MODAL_CONFIG.SIZES)),
  position: PropTypes.oneOf(Object.values(MODAL_CONFIG.POSITIONS)),
  animation: PropTypes.oneOf(Object.values(MODAL_CONFIG.ANIMATIONS)),
  draggable: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  preventBodyScroll: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  title: PropTypes.string,
  style: PropTypes.object,
};

export default Modal;

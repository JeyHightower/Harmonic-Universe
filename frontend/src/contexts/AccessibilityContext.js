import PropTypes from 'prop-types';
import React, { createContext, useCallback, useContext, useState } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [focusedElement, setFocusedElement] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  // Manage focus
  const setFocus = useCallback(element => {
    if (element && typeof element.focus === 'function') {
      element.focus();
      setFocusedElement(element);
    }
  }, []);

  // Return focus to previous element
  const returnFocus = useCallback(() => {
    if (focusedElement && typeof focusedElement.focus === 'function') {
      focusedElement.focus();
    }
  }, [focusedElement]);

  // Announce messages to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    setAnnouncements(prev => [...prev, { message, priority }]);

    // Clean up announcements after they've been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.message !== message));
    }, 3000);
  }, []);

  // Handle keyboard navigation
  const handleKeyboardNavigation = useCallback((event, elements) => {
    const { key } = event;
    const currentIndex = elements.indexOf(document.activeElement);

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex].focus();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex =
          currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
        elements[prevIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        elements[0].focus();
        break;
      case 'End':
        event.preventDefault();
        elements[elements.length - 1].focus();
        break;
      default:
        break;
    }
  }, []);

  // Trap focus within a container
  const trapFocus = useCallback(containerRef => {
    const handleFocusTrap = event => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastFocusable
        ) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    return handleFocusTrap;
  }, []);

  const value = {
    setFocus,
    returnFocus,
    announce,
    handleKeyboardNavigation,
    trapFocus,
    announcements,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Live region for screen reader announcements */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => a.message)
          .join(' ')}
      </div>
      <div className="sr-only" aria-live="assertive" role="alert">
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => a.message)
          .join(' ')}
      </div>
    </AccessibilityContext.Provider>
  );
};

AccessibilityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    );
  }
  return context;
};

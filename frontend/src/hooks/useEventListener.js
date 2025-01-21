import { useEffect, useRef } from 'react';

export const useEventListener = (
  eventName,
  handler,
  element = window,
  options = {}
) => {
  // Create a ref that stores handler
  const savedHandler = useRef();
  const { enabled = true } = options;

  // Update ref.current value if handler changes
  // This allows our effect below to always get latest handler
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Make sure element supports addEventListener
    const isSupported = element && element.addEventListener;
    if (!isSupported || !enabled) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = event => savedHandler.current(event);

    // Add event listener
    element.addEventListener(eventName, eventListener, options);

    // Remove event listener on cleanup
    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, enabled, options]);
};

// Helper hook for window events
export const useWindowEvent = (eventName, handler, options = {}) => {
  useEventListener(eventName, handler, window, options);
};

// Helper hook for document events
export const useDocumentEvent = (eventName, handler, options = {}) => {
  useEventListener(eventName, handler, document, options);
};

// Helper hook for resize events with debouncing
export const useResizeEvent = (handler, options = {}) => {
  const { delay = 250, ...rest } = options;

  const timeout = useRef(null);

  const debouncedHandler = event => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      handler(event);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  useWindowEvent('resize', debouncedHandler, rest);
};

// Helper hook for keyboard events
export const useKeyboardEvent = (key, handler, options = {}) => {
  const { target = document, keyEvent = 'keydown', ...rest } = options;

  const keyHandler = event => {
    if (event.key === key) {
      handler(event);
    }
  };

  useEventListener(keyEvent, keyHandler, target, rest);
};

// Helper hook for beforeunload events
export const useBeforeUnload = (handler, options = {}) => {
  useWindowEvent(
    'beforeunload',
    event => {
      const returnValue = handler(event);
      if (returnValue) {
        event.preventDefault();
        event.returnValue = returnValue;
      }
    },
    options
  );
};

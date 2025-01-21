import { useCallback, useEffect, useRef } from 'react';

export const useTimeout = (callback, delay) => {
  const savedCallback = useRef(callback);
  const timeoutRef = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    timeoutRef.current = setTimeout(tick, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    clear();
    timeoutRef.current = setTimeout(savedCallback.current, delay);
  }, [clear, delay]);

  return { clear, reset };
};

export const useInterval = (callback, delay, options = {}) => {
  const { startImmediately = false } = options;
  const savedCallback = useRef(callback);
  const intervalRef = useRef();
  const isActive = useRef(false);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  const start = useCallback(() => {
    if (isActive.current) return;
    if (delay === null) return;

    isActive.current = true;
    if (startImmediately) {
      savedCallback.current();
    }
    intervalRef.current = setInterval(() => savedCallback.current(), delay);
  }, [delay, startImmediately]);

  const stop = useCallback(() => {
    if (!isActive.current) return;

    isActive.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [stop, start]);

  // Set up the interval on mount and clean up on unmount
  useEffect(() => {
    start();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [delay, start]);

  return { start, stop, reset, isActive: isActive.current };
};

export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return a memoized version of the callback that delays invoking
  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
};

export const useThrottle = (callback, limit) => {
  const timeoutRef = useRef();
  const lastRunRef = useRef(0);
  const callbackRef = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Return a memoized version of the callback that only invokes
  // at most once per `limit` ms
  return useCallback(
    (...args) => {
      const now = Date.now();

      if (lastRunRef.current && now - lastRunRef.current < limit) {
        // Schedule the next execution
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = now;
          callbackRef.current(...args);
        }, limit);

        return;
      }

      lastRunRef.current = now;
      callbackRef.current(...args);
    },
    [limit]
  );
};

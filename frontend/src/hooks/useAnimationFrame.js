import { useCallback, useEffect, useRef } from 'react';

export const useAnimationFrame = (callback, dependencies = []) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const isActive = useRef(true);

  const animate = useCallback(
    time => {
      if (!isActive.current) return;

      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback]
  );

  useEffect(() => {
    isActive.current = true;
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      isActive.current = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, ...dependencies]);

  const stop = useCallback(() => {
    isActive.current = false;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  const start = useCallback(() => {
    if (!isActive.current) {
      isActive.current = true;
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const isRunning = useCallback(() => isActive.current, []);

  return { stop, start, isRunning };
};

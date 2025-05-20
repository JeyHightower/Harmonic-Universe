import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAudio } from '../../hooks';
import AudioButton from './AudioButton';

/**
 * AudioProvider component
 *
 * This component:
 * 1. Sets up global audio context initialization
 * 2. Shows the AudioButton when needed
 * 3. Handles user interactions for initializing audio
 */
const AudioProvider = ({ children }) => {
  const dispatch = useDispatch();
  const {
    initAudio,
    ready,
    error,
    contextState,
    unlockButtonVisible
  } = useAudio();

  // Use a ref to track initialization attempts from this component
  const initAttemptedRef = useRef(false);
  const safeInitRef = useRef(null);
  const initializedRef = useRef(false);
  const initInProgressRef = useRef(false);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const appReadyRef = useRef(false);

  // Set a flag to indicate the app is ready after a delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      appReadyRef.current = true;
    }, 3000); // Give the app more time to stabilize (increased from 2000)

    return () => clearTimeout(timeoutId);
  }, []);

  // Use a debounced initialization to prevent multiple rapid attempts
  const debouncedInitAudio = useCallback(() => {
    // Skip if the app isn't ready yet to prevent early initialization
    if (!appReadyRef.current) {
      console.debug('AudioProvider: Skipping init, app not fully loaded');
      return;
    }

    // Skip if initialization is in progress
    if (initInProgressRef.current) {
      console.debug('AudioProvider: Skipping init, already in progress');
      return;
    }

    // Skip if we've already initialized successfully
    if (ready || initializedRef.current) {
      console.debug('AudioProvider: Audio already initialized');
      return;
    }

    // Skip if we've already attempted initialization recently
    if (initAttemptedRef.current && Date.now() - lastAttemptTime < 2000) {
      console.debug('AudioProvider: Skipping init, attempted recently');
      return;
    }

    // Clear any existing initialization timer
    if (safeInitRef.current) {
      clearTimeout(safeInitRef.current);
    }

    // Mark as attempted immediately to prevent duplicate calls
    initAttemptedRef.current = true;
    setLastAttemptTime(Date.now());

    // Delay the actual initialization to avoid conflict with other components
    safeInitRef.current = setTimeout(() => {
      if (!ready && !initializedRef.current && !initInProgressRef.current && appReadyRef.current) {
        initInProgressRef.current = true;

        initAudio(false)
          .then(success => {
            if (success) {
              initializedRef.current = true;
              console.debug('AudioProvider: Audio init successful');
            }
          })
          .catch(err => {
            // Only log unexpected errors
            if (err && err.code !== 'INIT_IN_PROGRESS' && err.code !== 'INIT_DEBOUNCED' && err.code !== 'NO_USER_GESTURE') {
              console.debug('AudioProvider: Silent audio init error:', err);
            } else {
              // For expected errors, log them as debug info not errors
              console.debug('AudioProvider: Expected audio init condition:', err?.code || 'unknown');
            }
          })
          .finally(() => {
            initInProgressRef.current = false;
            // Allow retry after a delay
            setTimeout(() => {
              initAttemptedRef.current = false;
            }, 3000);
          });
      }
    }, 1500); // Increased delay to further ensure other components initialize first
  }, [initAudio, ready, lastAttemptTime]);

  // Check for iOS or Safari but limit auto-initialization
  // to prevent conflicts with other components
  useEffect(() => {
    // Skip automatic initialization completely - require explicit user action
    // This prevents race conditions and errors during app startup

    // Clean up on unmount
    return () => {
      if (safeInitRef.current) {
        clearTimeout(safeInitRef.current);
      }
    };
  }, [contextState, debouncedInitAudio, ready]);

  // Update initialized state when audio is ready
  useEffect(() => {
    if (ready) {
      initializedRef.current = true;
    }
  }, [ready]);

  // Expose audio management to the window for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      window.__audioDebug = {
        initAudio,
        currentState: {
          ready,
          error,
          contextState,
          unlockButtonVisible,
          initAttempted: initAttemptedRef.current,
          initialized: initializedRef.current,
          initInProgress: initInProgressRef.current,
          lastAttemptTime,
          appReady: appReadyRef.current
        }
      };
    }
  }, [ready, error, contextState, unlockButtonVisible, initAudio, lastAttemptTime]);

  return (
    <>
      {children}
      <AudioButton />
    </>
  );
};

export default AudioProvider;

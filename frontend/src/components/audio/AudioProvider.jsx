import { useCallback, useEffect, useRef } from 'react';
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

  // Use a debounced initialization to prevent multiple rapid attempts
  const debouncedInitAudio = useCallback(() => {
    // Skip if we've already initialized successfully
    if (ready || initializedRef.current) {
      return;
    }

    // Skip if we've already attempted initialization
    if (initAttemptedRef.current) {
      return;
    }

    // Clear any existing initialization timer
    if (safeInitRef.current) {
      clearTimeout(safeInitRef.current);
    }

    // Mark as attempted immediately to prevent duplicate calls
    initAttemptedRef.current = true;

    // Delay the actual initialization to avoid conflict with other components
    safeInitRef.current = setTimeout(() => {
      if (!ready && !initializedRef.current) {
        initAudio(false).then(success => {
          if (success) {
            initializedRef.current = true;
          }
        }).catch(err => {
          console.debug('Silent audio init error in provider:', err);
          // Reset the attempt flag after a failure so we can try again later if needed
          setTimeout(() => {
            initAttemptedRef.current = false;
          }, 2000);
        });
      }
    }, 1000);
  }, [initAudio, ready]);

  // Check for iOS or Safari but limit auto-initialization
  // to prevent conflicts with other components
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Only auto-initialize once if needed
    if ((isIOS || isSafari) && contextState !== 'running' && !initAttemptedRef.current && !ready) {
      debouncedInitAudio();
    }

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
          initialized: initializedRef.current
        }
      };
    }
  }, [ready, error, contextState, unlockButtonVisible, initAudio]);

  return (
    <>
      {children}
      <AudioButton />
    </>
  );
};

export default AudioProvider;

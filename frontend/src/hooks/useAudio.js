import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideUnlockButton, initializeAudio, showUnlockButton } from '../store/slices/audioSlice.mjs';

/**
 * Custom hook to manage audio context initialization across components
 * Provides a unified way to handle audio context initialization and state
 */
const useAudio = () => {
  const dispatch = useDispatch();
  const audio = useSelector(state => state.audio);
  const {
    initialized,
    initializing,
    ready,
    error,
    contextState,
    unlockButtonVisible
  } = audio;

  /**
   * Attempt to initialize the audio context
   * @returns {Promise<boolean>} True if successful
   */
  const initAudio = useCallback(async (showButtonOnFailure = true) => {
    if (ready) return true;
    if (initializing) {
      console.error('Error initializing audio context: Audio initialization already in progress');
      return false;
    }

    try {
      const result = await dispatch(initializeAudio()).unwrap();
      return result.contextState === 'running';
    } catch (err) {
      console.error('Error initializing audio context:', err);
      if (showButtonOnFailure) {
        dispatch(showUnlockButton());
      }
      return false;
    }
  }, [dispatch, ready, initializing]);

  /**
   * Show the audio unlock button
   */
  const showAudioButton = useCallback(() => {
    dispatch(showUnlockButton());
  }, [dispatch]);

  /**
   * Hide the audio unlock button
   */
  const hideAudioButton = useCallback(() => {
    dispatch(hideUnlockButton());
  }, [dispatch]);

  // Attempt to initialize on first user interaction
  useEffect(() => {
    if (ready || initializing) return;

    const handleFirstInteraction = (e) => {
      if (!e.isTrusted) return;

      // Try to initialize audio - don't show button yet
      initAudio(false).then(success => {
        if (!success) {
          // Only show the button after a delay if initialization failed
          setTimeout(() => {
            dispatch(showUnlockButton());
          }, 2000);
        }
      });

      // Remove event listeners
      ['mousedown', 'touchstart', 'keydown'].forEach(eventType => {
        document.removeEventListener(eventType, handleFirstInteraction, { capture: true });
      });
    };

    // Add listeners for first interaction
    ['mousedown', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, handleFirstInteraction, {
        capture: true,
        passive: true,
        once: true
      });
    });

    return () => {
      // Cleanup listeners
      ['mousedown', 'touchstart', 'keydown'].forEach(eventType => {
        document.removeEventListener(eventType, handleFirstInteraction, { capture: true });
      });
    };
  }, [dispatch, ready, initializing, initAudio]);

  return {
    ...audio,
    initAudio,
    showAudioButton,
    hideAudioButton,
    isReady: ready && contextState === 'running',
    needsUserAction: !ready && (contextState === 'suspended' || error)
  };
};

export default useAudio;

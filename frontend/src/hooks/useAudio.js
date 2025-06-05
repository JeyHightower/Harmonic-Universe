import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideUnlockButton, initializeAudio, setContextState, showUnlockButton, unlockAttempted } from '../store/slices/audioSlice.mjs';
import audioManager, { AudioErrorCode } from '../utils/audioManager';

// Create a shared initialization tracker across hook instances
let globalInitAttemptInProgress = false;
let lastAttemptTimestamp = 0;
const DEBOUNCE_TIME = 1200; // ms
let pendingInitPromise = null; // Track pending initialization promise globally
let initializationCount = 0; // Count initialization attempts

// Set up a proper global audio initialization state
if (typeof window !== 'undefined' && !window.__GLOBAL_AUDIO_STATE) {
  window.__GLOBAL_AUDIO_STATE = {
    initialized: false,
    initializing: false,
    initPromise: null,
    lastAttempt: 0,
    attemptCount: 0
  };
}

/**
 * Custom hook to manage audio context initialization across components
 * Provides a unified way to handle audio context initialization and state
 */
const useAudio = () => {
  const dispatch = useDispatch();
  const audio = useSelector(state => state.audio);
  const [globalEvents, setGlobalEvents] = useState(null);
  const initAttemptRef = useRef(false); // Track if this hook already attempted initialization
  const {
    initialized,
    initializing,
    ready,
    error,
    contextState,
    unlockButtonVisible,
    unlockAttempted: audioUnlockAttempted
  } = audio;

  /**
   * Attempt to initialize the audio context
   * @returns {Promise<boolean>} True if successful
   */
  const initAudio = useCallback(async (showButtonOnFailure = true) => {
    // If audio is already ready, return true immediately
    if (ready) return true;

    // Check if the app is ready for audio initialization
    if (!audioManager.isAppReady()) {
      console.debug('[useAudio] App not ready for audio initialization');
      // Don't show an error for this, just wait
      return false;
    }

    // CRITICAL: Check for existing initialization
    // First check audioManager (for cross-component tracking)
    if (audioManager.isInitializing() && audioManager.pendingPromise) {
      console.debug('[useAudio] Using existing global initialization from audioManager');
      return audioManager.pendingPromise;
    }

    // Then check module-level shared promise
    if (pendingInitPromise) {
      console.debug('[useAudio] Reusing existing module-level initialization promise');
      return pendingInitPromise;
    }

    // Finally check Redux state
    if (initializing) {
      console.debug('[useAudio] Audio initialization already in progress in Redux');
      // Create a deferred promise that will resolve when initialization completes
      const deferredPromise = new Promise((resolve) => {
        // Set up a polling interval to check when initialization is done
        const checkInterval = setInterval(() => {
          if (ready || audio.error) {
            clearInterval(checkInterval);
            resolve(ready);
          }
        }, 300);

        // Set a timeout to avoid infinite polling
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, 5000);
      });

      return deferredPromise;
    }

    // Prevent multiple attempts from the same hook instance
    if (initAttemptRef.current) {
      console.debug('[useAudio] Skipping repeated init attempt from same hook instance');
      return false;
    }

    // Check initialization preconditions
    const preconditionError = audioManager.checkInitPreconditions();
    if (preconditionError) {
      console.debug(`[useAudio] Initialization precondition failed: ${preconditionError.code}`);

      // If the error is that we need a user gesture, and we have an explicit unlock attempt,
      // we'll treat that as having a user gesture
      if (preconditionError.code === AudioErrorCode.NO_USER_GESTURE && audioUnlockAttempted) {
        console.debug('[useAudio] Proceeding anyway due to explicit unlock attempt');
      } else {
        // For other precondition errors, don't continue
        return Promise.reject(preconditionError);
      }
    }

    // Mark this hook instance as having attempted initialization
    initAttemptRef.current = true;

    // Record the attempt in the audio manager
    audioManager.recordAttempt();
    audioManager.setState('INITIALIZING');

    // Set global flags
    globalInitAttemptInProgress = true;
    lastAttemptTimestamp = Date.now();
    window.__LAST_AUDIO_HOOK_ATTEMPT = Date.now();

    // Create the initialization promise and store it globally
    pendingInitPromise = (async () => {
      try {
        // Update global tracking state
        if (window.__AUDIO_EVENT_SYSTEM) {
          window.__AUDIO_EVENT_SYSTEM.STATE.initializing = true;
        }

        // Actually attempt to initialize audio via Redux
        const result = await dispatch(initializeAudio()).unwrap();

        // Update global state tracking
        if (window.__AUDIO_EVENT_SYSTEM) {
          window.__AUDIO_EVENT_SYSTEM.STATE.initializing = false;
          window.__AUDIO_EVENT_SYSTEM.STATE.initialized = true;
        }

        // Dispatch global event
        if (globalEvents) {
          globalEvents.dispatchEvent('redux-init-success', result);
        }

        // Update audio manager state
        audioManager.setState('INITIALIZED');

        return result.contextState === 'running';
      } catch (err) {
        // Record the error in the audio manager
        audioManager.recordError(err);

        // Only show error UI for real failures
        if (err && err.code !== AudioErrorCode.DEBOUNCED &&
            err.code !== AudioErrorCode.IN_PROGRESS &&
            err.code !== AudioErrorCode.APP_LOADING) {
          if (showButtonOnFailure) {
            dispatch(showUnlockButton());
            // Mark an explicit unlock attempt needed
            dispatch(unlockAttempted());
          }

          // Dispatch global event
          if (globalEvents) {
            globalEvents.dispatchEvent('redux-init-error', err);
          }

          // Update audio manager state
          audioManager.setState('FAILED');
        }

        throw err; // Propagate the error
      } finally {
        // Always clean up global flags when done, regardless of success or failure
        globalInitAttemptInProgress = false;

        // Clear the pending promise after a short delay to prevent immediate retries
        setTimeout(() => {
          pendingInitPromise = null;

          // Clean up global state
          if (window.__AUDIO_EVENT_SYSTEM) {
            window.__AUDIO_EVENT_SYSTEM.STATE.initializing = false;
          }

          // Also clear the pending promise from the audio manager
          if (audioManager.pendingPromise === pendingInitPromise) {
            audioManager.pendingPromise = null;
          }
        }, 1000);
      }
    })();

    // Store the promise in the audio manager
    audioManager.pendingPromise = pendingInitPromise;

    // Return the pending promise
    return pendingInitPromise;
  }, [dispatch, ready, initializing, globalEvents, audioUnlockAttempted, audio.error]);

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

  // Effect to handle user interactions and track gestures for audio initialization
  useEffect(() => {
    if (ready || globalInitAttemptInProgress) return;

    // Set up handlers to track user gestures
    const trackUserGesture = (e) => {
      if (!e.isTrusted) return; // Only count actual user events

      // Save timestamp of the last user gesture globally
      window.__AUDIO_USER_GESTURE_TIMESTAMP = Date.now();

      // Also record in audioManager
      audioManager.trackUserGesture();
    };

    // Track gestures on various interactions
    const gestureEvents = ['mousedown', 'touchstart', 'keydown', 'click'];
    gestureEvents.forEach(eventType => {
      document.addEventListener(eventType, trackUserGesture, {
        passive: true,
        capture: false
      });
    });

    const handleFirstInteraction = (e) => {
      if (!e.isTrusted) return;

      // Save timestamp of the user gesture for audio context
      window.__AUDIO_USER_GESTURE_TIMESTAMP = Date.now();
      audioManager.trackUserGesture();

      // Try to initialize audio with a small delay to ensure it's within gesture window
      // but only if we aren't already trying to initialize
      setTimeout(() => {
        if (!ready && !initializing && !globalInitAttemptInProgress) {
          initAudio(false).then(success => {
            if (!success) {
              // Only show the button after a delay if initialization failed
              setTimeout(() => {
                if (!ready && !initializing) {
                  dispatch(showUnlockButton());
                }
              }, 2000);
            }
          }).catch(err => {
            // Suppress specific initialization errors that are expected
            if (err && err.code !== 'INIT_IN_PROGRESS' && err.code !== 'INIT_DEBOUNCED') {
              console.debug('Audio init error on user interaction:', err);
            }
          });
        }
      }, 100);

      // Remove first interaction listeners
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
      // Cleanup all listeners
      gestureEvents.forEach(eventType => {
        document.removeEventListener(eventType, trackUserGesture, { capture: false });
      });

      ['mousedown', 'touchstart', 'keydown'].forEach(eventType => {
        document.removeEventListener(eventType, handleFirstInteraction, { capture: true });
      });
    };
  }, [dispatch, ready, initializing, initAudio]);

  // Initialize global event system
  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window !== 'undefined') {
      if (!window.__AUDIO_EVENT_SYSTEM) {
        // Create global event system if it doesn't exist
        window.__AUDIO_EVENT_SYSTEM = {
          dispatchEvent: (eventName, data) => {
            window.dispatchEvent(new CustomEvent(`audio:${eventName}`, { detail: data }));
          },
          addEventListener: (eventName, callback) => {
            const handler = (e) => callback(e.detail);
            window.addEventListener(`audio:${eventName}`, handler, false);
            return () => window.removeEventListener(`audio:${eventName}`, handler, false);
          },
          STATE: {
            lastInitTime: 0,
            initialized: false,
            initializing: false,
            attempts: 0
          }
        };
      }

      setGlobalEvents(window.__AUDIO_EVENT_SYSTEM);
    }
  }, []);

  // Listen for global audio events
  useEffect(() => {
    if (!globalEvents) return;

    // Set up event listeners
    const removeInitSuccess = globalEvents.addEventListener('initialization-success', (data) => {
      if (!ready) {
        dispatch(setContextState(data.contextState));
      }
    });

    const removeInitFailure = globalEvents.addEventListener('initialization-failed', () => {
      if (!unlockButtonVisible) {
        dispatch(showUnlockButton());
      }
    });

    return () => {
      removeInitSuccess();
      removeInitFailure();
    };
  }, [globalEvents, dispatch, ready, unlockButtonVisible]);

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

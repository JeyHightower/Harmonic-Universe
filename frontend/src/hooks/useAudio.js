import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideUnlockButton, initializeAudio, setContextState, showUnlockButton } from '../store/slices/audioSlice.mjs';

// Create a shared initialization tracker across hook instances
let globalInitAttemptInProgress = false;
let lastAttemptTimestamp = 0;
const DEBOUNCE_TIME = 1200; // ms

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
    unlockButtonVisible
  } = audio;

  /**
   * Attempt to initialize the audio context
   * @returns {Promise<boolean>} True if successful
   */
  const initAudio = useCallback(async (showButtonOnFailure = true) => {
    // If audio is already ready, return true immediately
    if (ready) return true;

    // Prevent multiple attempts from the same hook instance
    if (initAttemptRef.current) {
      console.debug('Skipping repeated init attempt from same hook instance');
      return false;
    }

    // Check global initialization flag first to prevent concurrent attempts across hooks
    if (globalInitAttemptInProgress) {
      console.debug('Audio initialization already in progress');
      return Promise.reject(new Error('Audio initialization already in progress'));
    }

    // Check if we're within the debounce window
    const now = Date.now();
    if (now - lastAttemptTimestamp < DEBOUNCE_TIME) {
      console.debug('Skipping audio init - within debounce period');
      return false;
    }

    try {
      // Mark this hook instance as having attempted initialization
      initAttemptRef.current = true;

      // Set global flags
      globalInitAttemptInProgress = true;
      lastAttemptTimestamp = now;
      window.__LAST_AUDIO_HOOK_ATTEMPT = now;

      // Check global event system state
      if (globalEvents && window.__AUDIO_EVENT_SYSTEM && window.__AUDIO_EVENT_SYSTEM.STATE) {
        // If already initialized successfully in the global state, just confirm and return
        if (window.__AUDIO_EVENT_SYSTEM.STATE.initialized) {
          try {
            const Tone = await import('tone');
            if (Tone.context && Tone.context.state === 'running') {
              dispatch(setContextState('running'));
              globalInitAttemptInProgress = false;
              return true;
            }
          } catch (err) {
            // Failed to import Tone or check context, continue with normal initialization
          }
        }

        // Update global tracking state
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

      // Reset global flag
      globalInitAttemptInProgress = false;

      return result.contextState === 'running';
    } catch (err) {
      // Clear flags on error
      if (window.__AUDIO_EVENT_SYSTEM) {
        window.__AUDIO_EVENT_SYSTEM.STATE.initializing = false;
      }
      globalInitAttemptInProgress = false;

      // Only show error UI for real failures
      if (err && err.code !== 'INIT_DEBOUNCED' && err.code !== 'INIT_IN_PROGRESS' && err.code !== 'GLOBAL_INIT_IN_PROGRESS') {
        if (showButtonOnFailure) {
          dispatch(showUnlockButton());
        }
        // Dispatch global event
        if (globalEvents) {
          globalEvents.dispatchEvent('redux-init-error', err);
        }
      }
      return false;
    }
  }, [dispatch, ready, initializing, globalEvents]);

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

  // Attempt to initialize on first user interaction with reduced noise
  useEffect(() => {
    if (ready || initializing || initAttemptRef.current || globalInitAttemptInProgress) return;

    const handleFirstInteraction = (e) => {
      if (!e.isTrusted) return;

      // Try to initialize audio - don't show button yet
      initAudio(false).then(success => {
        if (!success) {
          // Only show the button after a delay if initialization failed
          setTimeout(() => {
            if (!ready && !initializing) {
              dispatch(showUnlockButton());
            }
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

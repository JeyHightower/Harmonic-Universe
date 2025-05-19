/**
 * AudioManager - A utility for safely initializing and managing Tone.js AudioContext
 * This ensures AudioContext is only started after user interaction
 */

import * as Tone from 'tone';

// Track whether we've initialized Tone.js
let isInitialized = false;
let pendingCallbacks = [];
let initializationAttempts = 0;
const MAX_ATTEMPTS = 3;

// Setup visibility change listeners to handle page focus/visibility changes
document.addEventListener('visibilitychange', () => {
  if (
    document.visibilityState === 'visible' &&
    Tone.context &&
    Tone.context.state === 'suspended'
  ) {
    console.log('Page became visible, attempting to resume AudioContext');
    Tone.context.resume().catch((error) => {
      console.warn('Failed to resume AudioContext on visibility change:', error);
    });
  }
});

/**
 * Initialize Tone.js AudioContext
 * This should only be called after user interaction
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeAudioContext = async () => {
  // Prevent excessive initialization attempts
  if (initializationAttempts >= MAX_ATTEMPTS) {
    console.warn(`AudioContext initialization failed after ${MAX_ATTEMPTS} attempts.`);
    return false;
  }

  // Prevent multiple initializations
  if (isInitialized && Tone.context && Tone.context.state === 'running') {
    return true;
  }

  initializationAttempts++;

  try {
    // Check if context already exists and its state
    if (Tone.context && Tone.context.state === 'running') {
      isInitialized = true;
      return true;
    }

    // Resume context if it exists but is suspended
    if (Tone.context && Tone.context.state === 'suspended') {
      try {
        await Tone.context.resume();

        // Verify that resuming worked
        if (Tone.context.state === 'running') {
          isInitialized = true;
          console.log('AudioContext successfully resumed');

          // Execute any pending callbacks
          pendingCallbacks.forEach((callback) => callback());
          pendingCallbacks = [];

          return true;
        } else {
          console.warn('AudioContext resume did not transition to running state');
        }
      } catch (resumeError) {
        console.error('Error resuming AudioContext:', resumeError);
      }
    }

    // If we get here, we need to create a new context
    console.log('Attempting to start Tone.js audio context');

    // Try to create a temporary audio element and play it to unblock audio context
    try {
      const audioElement = document.createElement('audio');
      audioElement.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      audioElement.volume = 0.01; // Very quiet
      await audioElement.play();
      // Let it play for a moment to ensure the AudioContext is unblocked
      await new Promise((resolve) => setTimeout(resolve, 100));
      audioElement.pause();
    } catch (silentAudioError) {
      // Ignore errors here, this was just a best effort
      console.warn('Could not play silent audio to unblock context:', silentAudioError);
    }

    // Now actually start Tone.js
    await Tone.start();

    // Double-check it's actually running
    if (Tone.context && Tone.context.state === 'running') {
      isInitialized = true;
      console.log('Tone.js AudioContext successfully started');

      // Execute any pending callbacks
      pendingCallbacks.forEach((callback) => callback());
      pendingCallbacks = [];

      return true;
    } else {
      console.warn('Tone.start() did not result in a running context');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error);
    return false;
  }
};

/**
 * Check if AudioContext is initialized and running
 * @returns {boolean} Whether AudioContext is initialized and running
 */
export const isAudioContextReady = () => {
  return isInitialized && Tone.context && Tone.context.state === 'running';
};

/**
 * Execute a function only after AudioContext is initialized
 * If not yet initialized, the function will be queued for later execution
 * @param {Function} callback Function to execute
 */
export const withAudioContext = (callback) => {
  if (isAudioContextReady()) {
    callback();
  } else {
    pendingCallbacks.push(callback);
  }
};

/**
 * Attach audio initialization to user interaction events
 * Call this during application startup
 */
export const setupAudioContextInitialization = () => {
  const userInteractionEvents = ['click', 'touchstart', 'keydown', 'mousedown'];

  // Clear any existing handlers to avoid duplicates
  const existingHandler = window.__audioManagerInitHandler;
  if (existingHandler) {
    userInteractionEvents.forEach((evt) => {
      document.removeEventListener(evt, existingHandler);
    });
  }

  const initHandler = async (event) => {
    // Only initialize on trusted (actual user) events
    if (event.isTrusted) {
      // Skip if already initialized successfully
      if (isAudioContextReady()) {
        return;
      }

      const success = await initializeAudioContext();

      // Remove event listeners after successful initialization
      if (success) {
        userInteractionEvents.forEach((evt) => {
          document.removeEventListener(evt, initHandler, { capture: true });
        });

        // Store successful attempt time
        localStorage.setItem('audio_context_initialized', Date.now().toString());
      }
    }
  };

  // Store the handler for potential cleanup
  window.__audioManagerInitHandler = initHandler;

  // Add event listeners for user interactions with capture phase
  userInteractionEvents.forEach((event) => {
    document.addEventListener(event, initHandler, { capture: true });
  });

  // Also respond to window focus events which may help resume suspended contexts
  window.addEventListener('focus', async () => {
    if (Tone.context && Tone.context.state === 'suspended') {
      try {
        await Tone.context.resume();
        console.log('AudioContext resumed on window focus');
      } catch (error) {
        console.warn('Failed to resume AudioContext on window focus:', error);
      }
    }
  });
};

// Default export with all functions
export default {
  initializeAudioContext,
  isAudioContextReady,
  withAudioContext,
  setupAudioContextInitialization,
};

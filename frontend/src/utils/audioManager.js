/**
 * AudioManager - A utility for safely initializing and managing Tone.js AudioContext
 * This ensures AudioContext is only started after user interaction
 */

import * as Tone from 'tone';

// Track whether we've initialized Tone.js
let isInitialized = false;
let pendingCallbacks = [];

/**
 * Initialize Tone.js AudioContext
 * This should only be called after user interaction
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeAudioContext = async () => {
  // Prevent multiple initializations
  if (isInitialized) {
    return true;
  }

  try {
    // Check if context already exists and its state
    if (Tone.context && Tone.context.state === 'running') {
      isInitialized = true;
      return true;
    }

    // Start Tone.js audio context
    await Tone.start();
    isInitialized = true;

    // Execute any pending callbacks
    pendingCallbacks.forEach((callback) => callback());
    pendingCallbacks = [];

    console.log('AudioContext successfully initialized');
    return true;
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

  const initHandler = async () => {
    await initializeAudioContext();
    // Remove event listeners after successful initialization
    if (isInitialized) {
      userInteractionEvents.forEach((event) => {
        document.removeEventListener(event, initHandler, { once: true });
      });
    }
  };

  // Add event listeners for user interactions
  userInteractionEvents.forEach((event) => {
    document.addEventListener(event, initHandler, { once: true });
  });
};

// Default export with all functions
export default {
  initializeAudioContext,
  isAudioContextReady,
  withAudioContext,
  setupAudioContextInitialization,
};

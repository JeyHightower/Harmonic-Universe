/**
 * AudioManager - A utility for safely initializing and managing Tone.js AudioContext
 * This ensures AudioContext is only started after user interaction
 */

// IMPORTANT: Do NOT import Tone directly to prevent auto-initialization
// The Tone module will be passed in from main.jsx after being properly loaded

// Global event coordination system for audio initialization
const setupAudioEventSystem = () => {
  if (typeof window !== 'undefined' && !window.__AUDIO_EVENT_SYSTEM) {
    window.__AUDIO_EVENT_SYSTEM = {
      dispatchEvent: (eventName, data) => {
        window.dispatchEvent(new CustomEvent(`audio:${eventName}`, { detail: data }));
      },
      addEventListener: (eventName, callback) => {
        window.addEventListener(`audio:${eventName}`, (e) => callback(e.detail), false);
        return () => window.removeEventListener(`audio:${eventName}`, callback);
      },
      // Track state globally
      STATE: {
        lastInitTime: 0,
        initialized: false,
        initializing: false,
        attempts: 0
      }
    };
  }
  return window.__AUDIO_EVENT_SYSTEM;
};

// Initialize the event system
const audioEvents = setupAudioEventSystem();

// Track whether we've initialized Tone.js
let isInitialized = false;
let pendingCallbacks = [];
let initializationAttempts = 0;
const MAX_ATTEMPTS = 3;

// Add a flag to track whether initialization is in progress
let isInitializing = false;

// Track when the last initialization attempt was made
let lastInitializationTime = 0;
const MIN_INIT_INTERVAL = 500; // ms

// Add a flag to track if we're in a user gesture context
let inUserGesture = false;

// Create a special unlocked context flag
let hasUnlockedAudioContext = false;

/**
 * Initialize Tone.js AudioContext
 * This should only be called after user interaction
 * @param {Object} Tone - The Tone.js module instance to use
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export const initializeAudioContext = async (Tone) => {
  // Make sure we have a valid Tone object
  if (!Tone) {
    console.error('No Tone module provided to initializeAudioContext');
    return false;
  }

  // Use the shared state from the event system
  const { STATE } = window.__AUDIO_EVENT_SYSTEM || setupAudioEventSystem();

  // Check global initialization lock
  if (STATE.initializing) {
    audioEvents.dispatchEvent('initialization-skipped', { reason: 'already-in-progress' });
    console.warn('Audio initialization already in progress (global state)');
    return false;
  }

  // Apply rate limiting to initialization attempts
  const now = Date.now();
  if (now - STATE.lastInitTime < MIN_INIT_INTERVAL) {
    audioEvents.dispatchEvent('initialization-throttled', {
      timeSinceLastAttempt: now - STATE.lastInitTime
    });
    console.warn(`Audio initialization attempted too quickly (${now - STATE.lastInitTime}ms since last attempt)`);
    return false;
  }

  // Global check for already initialized and working
  if (STATE.initialized && Tone.context && Tone.context.state === 'running') {
    audioEvents.dispatchEvent('already-initialized', { contextState: Tone.context.state });
    return true;
  }

  // Prevent excessive initialization attempts
  if (STATE.attempts >= MAX_ATTEMPTS) {
    audioEvents.dispatchEvent('max-attempts-reached', { attempts: STATE.attempts });
    console.warn(`AudioContext initialization failed after ${STATE.attempts} attempts.`);
    return false;
  }

  // Set all initialization locks
  STATE.initializing = true;
  STATE.lastInitTime = now;
  STATE.attempts++;
  isInitializing = true;
  window.__AUDIO_INITIALIZING = true;

  // Broadcast initialization started
  audioEvents.dispatchEvent('initialization-started', {
    attempt: STATE.attempts,
    timestamp: now
  });

  try {
    console.log('Starting AudioContext initialization...');

    // Check if context already exists and its state
    if (Tone.context && Tone.context.state === 'running') {
      isInitialized = true;
      isInitializing = false;
      return true;
    }

    // Detect browser type for specialized handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Different approach for different browser families
    if (isIOS || isSafari) {
      console.log('Using iOS/Safari audio unlock sequence');

      // For iOS/Safari we need to use a HTML audio element first
      try {
        await unlockAudioForMobile();
        hasUnlockedAudioContext = true;
      } catch (e) {
        console.warn('Mobile audio unlock failed:', e);
      }
    }

    // Use a standard approach for all browsers
    try {
      console.log('Creating and playing silent sound to unlock audio...');
      await createAndPlaySilentSound();
      hasUnlockedAudioContext = true;
    } catch (e) {
      console.warn('Silent sound failed:', e);
    }

    // Carefully create or resume Tone.js context
    console.log('Now attempting to start Tone.js...');

    try {
      // If we already have a context, try to resume it
      if (Tone.context) {
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
          console.log('Existing Tone.js context resumed');
        }
      } else {
        // Explicitly create a new context with the right settings
        console.log('Creating new Tone.js context');
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();

        // Resume the context immediately within the user gesture
        await audioContext.resume();

        // Assign this context to Tone.js
        Tone.setContext(audioContext);
        console.log('New AudioContext created and assigned to Tone.js');
      }
    } catch (e) {
      console.warn('Error initializing Tone.js context directly:', e);

      // Fall back to the standard Tone.start() method
      try {
        await Tone.start();
        console.log('Tone.js started with fallback method');
      } catch (toneError) {
        console.error('Failed to start Tone.js with fallback method:', toneError);
      }
    }

    // Verify if it worked
    if (Tone.context && Tone.context.state === 'running') {
      isInitialized = true;

      // Update global state
      STATE.initialized = true;
      STATE.initializing = false;

      // Release all locks
      isInitializing = false;
      window.__AUDIO_INITIALIZING = false;

      // Broadcast success
      audioEvents.dispatchEvent('initialization-success', {
        contextState: Tone.context.state,
        attempts: STATE.attempts
      });

      console.log('Tone.js AudioContext successfully started');

      // Setup visibility change listener
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' &&
            Tone.context &&
            Tone.context.state === 'suspended') {
          console.log('Page became visible, attempting to resume AudioContext');
          Tone.context.resume().catch((error) => {
            console.warn('Failed to resume AudioContext on visibility change:', error);
          });
        }
      });

      // Execute any pending callbacks
      while (pendingCallbacks.length > 0) {
        try {
          const callback = pendingCallbacks.shift();
          callback(Tone);
        } catch (e) {
          console.error('Error executing audio callback:', e);
        }
      }

      return true;
    } else {
      console.warn('AudioContext still not running after initialization attempts');

      // Update global state
      STATE.initializing = false;

      // Release all locks
      isInitializing = false;
      window.__AUDIO_INITIALIZING = false;

      // Broadcast failure
      audioEvents.dispatchEvent('initialization-failed', {
        reason: 'context-not-running',
        attempts: STATE.attempts
      });

      return false;
    }
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error);

    // Update global state
    STATE.initializing = false;

    // Release all locks on error
    isInitializing = false;
    window.__AUDIO_INITIALIZING = false;

    // Broadcast error
    audioEvents.dispatchEvent('initialization-error', {
      error: error.message,
      attempts: STATE.attempts
    });

    return false;
  }
};

/**
 * Helper function to create and play a silent sound
 * This helps with AudioContext initialization on most browsers
 */
const createAndPlaySilentSound = async () => {
  // Create a temporary context
  const tempContext = new (window.AudioContext || window.webkitAudioContext)();

  // Create a silent buffer
  const buffer = tempContext.createBuffer(1, 1, 22050);
  const source = tempContext.createBufferSource();
  source.buffer = buffer;
  source.connect(tempContext.destination);

  // Play the silent sound
  source.start(0);

  // Resume the context
  await tempContext.resume();

  // Close it after a short delay
  setTimeout(() => {
    if (tempContext && tempContext.state !== 'closed') {
      tempContext.close().catch(e => console.warn('Error closing temp context:', e));
    }
  }, 100);

  return true;
};

/**
 * Special function to unlock audio on mobile devices
 * Combines multiple approaches for maximum compatibility
 */
const unlockAudioForMobile = async () => {
  // Method 1: Silent audio element
  const audioEl = document.createElement('audio');
  audioEl.src = 'data:audio/mp3;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  audioEl.loop = false;
  audioEl.autoplay = false;
  audioEl.muted = false;
  audioEl.volume = 0.01;
  document.body.appendChild(audioEl);

  try {
    await audioEl.play();
    await new Promise(resolve => setTimeout(resolve, 100));
    audioEl.pause();
  } finally {
    document.body.removeChild(audioEl);
  }

  // Method 2: WebAudio oscillator (works well on iOS)
  try {
    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = tempContext.createOscillator();
    const gainNode = tempContext.createGain();
    gainNode.gain.value = 0.001; // Nearly silent
    oscillator.connect(gainNode);
    gainNode.connect(tempContext.destination);
    oscillator.start(0);
    oscillator.stop(0.001);

    await tempContext.resume();

    setTimeout(() => {
      if (tempContext && tempContext.state !== 'closed') {
        tempContext.close().catch(e => {});
      }
    }, 100);

    return true;
  } catch (e) {
    console.warn('Oscillator method failed:', e);
    return false;
  }
};

/**
 * Special function to unlock audio on iOS by playing a silent audio file
 * @deprecated Use unlockAudioForMobile instead
 */
const unlockAudioForIOS = unlockAudioForMobile;

/**
 * Check if AudioContext is initialized and running
 * @param {Object} Tone - The Tone.js module instance to check
 * @returns {boolean} Whether AudioContext is initialized and running
 */
export const isAudioContextReady = (Tone) => {
  return isInitialized && Tone && Tone.context && Tone.context.state === 'running';
};

/**
 * Execute a function only after AudioContext is initialized
 * This function now accepts a Tone parameter to avoid global imports
 * @param {Function} callback Function to execute - will receive Tone as a parameter
 * @param {Object} Tone - The Tone.js module instance
 */
export const withAudioContext = (callback, Tone) => {
  if (Tone && isAudioContextReady(Tone)) {
    callback(Tone);
  } else {
    pendingCallbacks.push(callback);
  }
};

/**
 * Legacy function to maintain compatibility with existing code
 * @deprecated Use the explicit Tone parameter versions instead
 */
export const setupAudioContextInitialization = () => {
  console.warn('setupAudioContextInitialization is deprecated, using main.jsx initialization instead');
  // This function is kept for backward compatibility but no longer used
  // All initialization now happens in main.jsx with explicit Tone loading
};

// Default export with all functions
export default {
  initializeAudioContext,
  isAudioContextReady,
  withAudioContext,
  setupAudioContextInitialization,
};

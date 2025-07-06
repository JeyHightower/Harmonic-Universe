/**
 * Global Audio Manager
 *
 * Provides centralized control of audio initialization and state management
 * to prevent concurrent initialization attempts and handle errors gracefully.
 */

// Global audio initialization state
const AudioState = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  INITIALIZED: 'initialized',
  FAILED: 'failed',
  WAITING_FOR_USER: 'waiting_for_user'
};

// Error codes for audio initialization
const AudioErrorCode = {
  IN_PROGRESS: 'INIT_IN_PROGRESS',
  DEBOUNCED: 'INIT_DEBOUNCED',
  NO_USER_GESTURE: 'NO_USER_GESTURE',
  APP_LOADING: 'APP_LOADING',
  ALREADY_INITIALIZED: 'ALREADY_INITIALIZED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Singleton to track global audio initialization state
class AudioManager {
  constructor() {
    this.state = AudioState.UNINITIALIZED;
    this.pendingPromise = null;
    this.lastAttempt = 0;
    this.attempts = 0;
    this.error = null;
    this.debounceTime = 1000; // ms
    this.appReady = false;  // Track if app has loaded enough to initialize audio
    this.userGestureTimestamp = 0; // Track the latest user gesture timestamp

    // Set a timer to mark the app as ready after a delay
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.appReady = true;
        if (window.__AUDIO_MANAGER) {
          window.__AUDIO_MANAGER.appReady = true;
        }
        console.debug('[AudioManager] App marked as ready for audio initialization');
      }, 3000); // Wait 3 seconds before allowing auto-initialization
    }

    // Initialize global state
    if (typeof window !== 'undefined') {
      window.__AUDIO_MANAGER = {
        state: this.state,
        lastAttempt: this.lastAttempt,
        attempts: this.attempts,
        initialized: false,
        appReady: this.appReady,
        errors: [],
        userGestureTimestamp: 0
      };
    }
  }

  /**
   * Check if audio is currently being initialized
   * @returns {boolean} True if initialization is in progress
   */
  isInitializing() {
    const inProgress = this.state === AudioState.INITIALIZING;

    // If there's a global promise, check that too
    if (typeof window !== 'undefined') {
      if (window.__GLOBAL_AUDIO_STATE) {
        return inProgress || window.__GLOBAL_AUDIO_STATE.initializing;
      }

      // Also check if Tone.js is in the process of starting
      if (window.Tone && window.Tone.context &&
          window.Tone.context.state !== 'running' &&
          window.Tone.context.state !== 'closed') {
        return true;
      }
    }

    return inProgress;
  }

  /**
   * Check if audio has been successfully initialized
   * @returns {boolean} True if audio is initialized
   */
  isInitialized() {
    const isInit = this.state === AudioState.INITIALIZED;

    // Also check global initialization state if available
    if (typeof window !== 'undefined') {
      if (window.__GLOBAL_AUDIO_STATE) {
        return isInit || window.__GLOBAL_AUDIO_STATE.initialized;
      }

      // Also check Tone.js context state if available
      if (window.Tone && window.Tone.context && window.Tone.context.state === 'running') {
        return true;
      }
    }

    return isInit;
  }

  /**
   * Get the global audio state
   * @returns {string} Current audio state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if the app is ready for audio initialization
   * @returns {boolean} True if the app is ready
   */
  isAppReady() {
    return this.appReady;
  }

  /**
   * Set the audio state
   * @param {string} state New audio state
   */
  setState(state) {
    this.state = state;
    if (window.__AUDIO_MANAGER) {
      window.__AUDIO_MANAGER.state = state;
      window.__AUDIO_MANAGER.initialized = state === AudioState.INITIALIZED;
    }
  }

  /**
   * Record an error
   * @param {Error} error The error to record
   */
  recordError(error) {
    this.error = error;
    if (window.__AUDIO_MANAGER) {
      if (!window.__AUDIO_MANAGER.errors) {
        window.__AUDIO_MANAGER.errors = [];
      }
      window.__AUDIO_MANAGER.errors.push({
        time: Date.now(),
        message: error.message,
        code: error.code || 'UNKNOWN'
      });
    }
  }

  /**
   * Track a user gesture that can be used for audio initialization
   */
  trackUserGesture() {
    const now = Date.now();
    this.userGestureTimestamp = now;

    if (typeof window !== 'undefined') {
      window.__AUDIO_USER_GESTURE_TIMESTAMP = now;
      if (window.__AUDIO_MANAGER) {
        window.__AUDIO_MANAGER.userGestureTimestamp = now;
      }
      console.debug('[AudioManager] User gesture tracked at', new Date(now).toISOString());
    }
  }

  /**
   * Check if a recent user gesture is available
   * @returns {boolean} True if a recent user gesture is available
   */
  hasUserGesture() {
    // Check our internal timestamp
    const internalGesture = this.userGestureTimestamp > 0 &&
                            (Date.now() - this.userGestureTimestamp < 5000);

    // Also check window global (legacy support)
    const windowGesture = typeof window !== 'undefined' &&
                          window.__AUDIO_USER_GESTURE_TIMESTAMP &&
                          (Date.now() - window.__AUDIO_USER_GESTURE_TIMESTAMP < 5000);

    return internalGesture || windowGesture;
  }

  /**
   * Record an initialization attempt
   */
  recordAttempt() {
    this.attempts++;
    this.lastAttempt = Date.now();
    if (window.__AUDIO_MANAGER) {
      window.__AUDIO_MANAGER.attempts = this.attempts;
      window.__AUDIO_MANAGER.lastAttempt = this.lastAttempt;
    }
  }

  /**
   * Check if initialization is allowed (not within debounce period)
   * @returns {boolean} True if initialization is allowed
   */
  canInitialize() {
    return Date.now() - this.lastAttempt > this.debounceTime;
  }

  /**
   * Check initialization preconditions and return appropriate error if any fail
   * @returns {Error|null} Error if initialization should not proceed, null if ok to proceed
   */
  checkInitPreconditions() {
    // Check if already initialized successfully
    if (this.isInitialized()) {
      const error = new Error('Audio already initialized');
      error.code = AudioErrorCode.ALREADY_INITIALIZED;
      return error;
    }

    // Check if initialization is in progress
    if (this.isInitializing()) {
      const error = new Error('Audio initialization already in progress');
      error.code = AudioErrorCode.IN_PROGRESS;
      return error;
    }

    // Check debounce period
    if (!this.canInitialize()) {
      const error = new Error('Audio initialization attempted too quickly');
      error.code = AudioErrorCode.DEBOUNCED;
      return error;
    }

    // Check for user gesture
    if (!this.hasUserGesture()) {
      const error = new Error('Audio initialization requires user interaction');
      error.code = AudioErrorCode.NO_USER_GESTURE;
      return error;
    }

    // Check if app is ready
    if (!this.appReady) {
      const error = new Error('App not ready for audio initialization');
      error.code = AudioErrorCode.APP_LOADING;
      return error;
    }

    return null;
  }

  /**
   * Reset the manager state
   */
  reset() {
    this.state = AudioState.UNINITIALIZED;
    this.pendingPromise = null;
    this.lastAttempt = 0;
    this.attempts = 0;
    this.error = null;

    if (window.__AUDIO_MANAGER) {
      window.__AUDIO_MANAGER.state = this.state;
      window.__AUDIO_MANAGER.lastAttempt = this.lastAttempt;
      window.__AUDIO_MANAGER.attempts = this.attempts;
      window.__AUDIO_MANAGER.initialized = false;
      window.__AUDIO_MANAGER.errors = [];
    }
  }
}

// Create a singleton instance
const audioManager = new AudioManager();

// Make the audioManager globally available for direct access
if (typeof window !== 'undefined') {
  window.audioManager = audioManager;

  // Add global event listeners to track user interactions
  const trackUserInteraction = () => {
    audioManager.trackUserGesture();
    console.debug('[AudioManager] User interaction detected and tracked');
  };

  // Capture all possible user interaction events
  const interactionEvents = [
    'click', 'touchstart', 'mousedown',
    'keydown', 'pointerdown', 'touchend'
  ];

  // Add listeners with passive option for better performance
  interactionEvents.forEach(eventType => {
    window.addEventListener(eventType, trackUserInteraction, { passive: true });
  });
}

/**
 * Initialize the audio context for the application
 * @returns {Promise<boolean>} A promise that resolves to true if initialization was successful
 */
const initializeAudioContext = async () => {
  // If we already successfully initialized, return early
  if (audioManager.isInitialized()) {
    console.debug('[AudioManager] Audio already initialized, skipping re-initialization');
    return true;
  }

  // Create a flag to track if we're in this initialization function
  const currentInitialization = Symbol('audio-init-' + Date.now());

  // Handle case where initialization is already in progress
  if (audioManager.isInitializing()) {
    console.warn('[AudioManager] Audio initialization already in progress, waiting for completion');

    // Return the existing promise if available or create a waiting promise
    if (audioManager.pendingPromise) {
      console.debug('[AudioManager] Using existing initialization promise');
      return audioManager.pendingPromise;
    }

    // Create a new waiting promise
    return new Promise((resolve) => {
      // Wait for the current initialization to finish
      const checkInterval = setInterval(() => {
        if (!audioManager.isInitializing() || audioManager.isInitialized()) {
          clearInterval(checkInterval);
          resolve(audioManager.isInitialized());
        }
      }, 100);

      // Set a timeout to avoid infinite waiting
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
    });
  }

  // Check preconditions before attempting initialization
  const preconditionError = audioManager.checkInitPreconditions();
  if (preconditionError) {
    console.warn('[AudioManager] Audio initialization preconditions not met:', preconditionError.message);
    audioManager.recordError(preconditionError);

    // If it's just because we don't have a user gesture yet, attempt to work around it
    if (preconditionError.code === AudioErrorCode.NO_USER_GESTURE && typeof window !== 'undefined') {
      // Force track a user gesture for cases where we're inside a genuine user interaction
      // but the manager doesn't know about it yet
      audioManager.trackUserGesture();
      console.debug('[AudioManager] Forcibly tracked a user gesture during initialization request');

      // If we still don't have a user gesture, create a small silent buffer and try to play it
      // This can sometimes help with browsers that don't properly detect user gestures
      if (!audioManager.hasUserGesture()) {
        try {
          const tempContext = new (window.AudioContext || window.webkitAudioContext)();
          const buffer = tempContext.createBuffer(1, 1, 22050);
          const source = tempContext.createBufferSource();
          source.buffer = buffer;
          source.connect(tempContext.destination);
          source.start(0);
          console.debug('[AudioManager] Played silent sound to try to unlock audio');

          // Close the temporary context after a short delay
          setTimeout(() => {
            if (tempContext && tempContext.state !== 'closed') {
              tempContext.close().catch(() => {});
            }
          }, 500);
        } catch (e) {
          console.debug('[AudioManager] Silent sound unlock attempt failed:', e);
        }
      }

      // Retry the precondition check
      const retryError = audioManager.checkInitPreconditions();
      if (retryError && retryError.code === AudioErrorCode.NO_USER_GESTURE) {
        console.warn('[AudioManager] Still no user gesture available after retry');
        return false; // Still no user gesture, give up
      }
    } else if (preconditionError.code !== AudioErrorCode.IN_PROGRESS) {
      return false; // Other error, give up
    }
  }

  // Store a reference to the initialization promise to prevent concurrent initializations
  let initPromise;

  try {
    // Record this attempt
    audioManager.recordAttempt();
    audioManager.setState(AudioState.INITIALIZING);

    // Create a new promise for this initialization attempt
    initPromise = (async () => {
      try {
        // If we have Tone.js available, try to initialize it
        if (typeof window !== 'undefined' && window.Tone) {
          console.debug('[AudioManager] Attempting to initialize with Tone.start()');
          try {
            // Try the recommended way first
            await window.Tone.start();
            console.debug('[AudioManager] Audio context initialized successfully via Tone.js');
            audioManager.setState(AudioState.INITIALIZED);
            return true;
          } catch (toneError) {
            console.warn('[AudioManager] Failed to initialize with Tone.start(), will try Tone.context directly', toneError);

            // Try to resume the existing context if start() fails
            if (window.Tone.context) {
              try {
                await window.Tone.context.resume();
                console.debug('[AudioManager] Audio context resumed successfully via Tone.context.resume()');
                audioManager.setState(AudioState.INITIALIZED);
                return true;
              } catch (resumeError) {
                console.warn('[AudioManager] Failed to resume Tone.context, falling back to Web Audio API', resumeError);
              }
            }
          }
        }

        // Fallback to standard Web Audio API
        if (typeof window !== 'undefined') {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const context = new AudioContext();

            try {
              console.debug('[AudioManager] Attempting to resume new AudioContext');
              await context.resume();
              console.debug('[AudioManager] Audio context initialized successfully via Web Audio API');
              audioManager.setState(AudioState.INITIALIZED);
              return true;
            } catch (contextError) {
              console.warn('[AudioManager] Failed to resume new AudioContext', contextError);
              // Even if resume fails, some browsers will still allow audio
              if (context.state !== 'suspended') {
                console.debug('[AudioManager] AudioContext state is not suspended, considering it initialized');
                audioManager.setState(AudioState.INITIALIZED);
                return true;
              }
            }
          }
        }

        throw new Error('No audio context available or failed to initialize');
      } catch (error) {
        console.error('[AudioManager] Failed to initialize audio context:', error);
        audioManager.recordError(error);
        audioManager.setState(AudioState.FAILED);
        return false;
      }
    })();

    // Store the promise in the manager
    audioManager.pendingPromise = initPromise;

    // Wait for initialization to complete
    const result = await initPromise;
    return result;
  } catch (error) {
    console.error('[AudioManager] Failed to initialize audio context:', error);
    audioManager.recordError(error);
    audioManager.setState(AudioState.FAILED);
    return false;
  } finally {
    // Clear the pending promise to allow future initialization attempts
    // Only if this is still the current initialization (avoid race conditions)
    setTimeout(() => {
      if (audioManager.pendingPromise === initPromise) {
        audioManager.pendingPromise = null;
      }
    }, 500);
  }
};

// Export the singleton and constants
export { AudioErrorCode, AudioState, initializeAudioContext };
export default audioManager;

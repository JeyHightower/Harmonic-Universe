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
    const inProgress = this.state === AudioState.INITIALIZING && this.pendingPromise !== null;

    // If there's a global promise, check that too
    if (typeof window !== 'undefined' && window.__GLOBAL_AUDIO_STATE) {
      return inProgress || window.__GLOBAL_AUDIO_STATE.initializing;
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
    return true;
  }

  // Check preconditions before attempting initialization
  const preconditionError = audioManager.checkInitPreconditions();
  if (preconditionError) {
    console.warn('Audio initialization preconditions not met:', preconditionError.message);
    audioManager.recordError(preconditionError);

    // If it's just because we don't have a user gesture yet, attempt to work around it
    if (preconditionError.code === AudioErrorCode.NO_USER_GESTURE && typeof window !== 'undefined') {
      // Force track a user gesture for cases where we're inside a genuine user interaction
      // but the manager doesn't know about it yet
      audioManager.trackUserGesture();

      // Retry the precondition check
      const retryError = audioManager.checkInitPreconditions();
      if (retryError && retryError.code === AudioErrorCode.NO_USER_GESTURE) {
        return false; // Still no user gesture, give up
      }
    } else {
      return false;
    }
  }

  // Record this attempt
  audioManager.recordAttempt();
  audioManager.setState(AudioState.INITIALIZING);

  try {
    // If we have Tone.js available, try to initialize it
    if (typeof window !== 'undefined' && window.Tone) {
      try {
        await window.Tone.start();
        console.debug('[AudioManager] Audio context initialized successfully via Tone.js');
        audioManager.setState(AudioState.INITIALIZED);
        return true;
      } catch (toneError) {
        console.warn('[AudioManager] Failed to initialize with Tone.start(), falling back to AudioContext', toneError);
      }
    }

    // Fallback to standard Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const context = new AudioContext();
      if (context.state === 'running' || await context.resume()) {
        console.debug('[AudioManager] Audio context initialized successfully via Web Audio API');
        audioManager.setState(AudioState.INITIALIZED);
        return true;
      }
    }

    throw new Error('No audio context available');
  } catch (error) {
    console.error('[AudioManager] Failed to initialize audio context:', error);
    audioManager.recordError(error);
    audioManager.setState(AudioState.FAILED);
    return false;
  }
};

// Export the singleton and constants
export { AudioErrorCode, AudioState, initializeAudioContext };
export default audioManager;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Initial state for audio management
const initialState = {
  initialized: false,
  initializing: false,
  attempts: 0,
  ready: false,
  error: null,
  iOS: false,
  safari: false,
  unlockButtonVisible: false,
  unlockAttempted: false,
  contextState: 'suspended', // 'suspended', 'running', 'closed'
};

// Async thunk to initialize the audio context
export const initializeAudio = createAsyncThunk(
  'audio/initialize',
  async (_, { getState, rejectWithValue, dispatch }) => {
    const { audio } = getState();

    // ENHANCED: Check for any ongoing initialization attempts first
    // This prevents the error log from appearing in the console
    if (audio.initializing ||
        (typeof window !== 'undefined' && window.__AUDIO_MANAGER?.state === 'INITIALIZING') ||
        (typeof window !== 'undefined' && window.__AUDIO_EVENT_SYSTEM?.STATE?.initializing)) {
      // Return a rejection without logging an error since this is expected behavior
      return rejectWithValue({
        message: 'Audio initialization already in progress',
        code: 'INIT_IN_PROGRESS'
      });
    }

    // Check if already successfully initialized
    if (audio.initialized && audio.ready && audio.contextState === 'running') {
      console.debug('Audio already initialized and running, returning current state');
      return {
        contextState: audio.contextState,
        iOS: audio.iOS,
        safari: audio.safari,
      };
    }

    // Check global audio event system
    if (typeof window !== 'undefined') {
      // Check AudioManager if it exists
      if (window.__AUDIO_MANAGER) {
        if (window.__AUDIO_MANAGER.state === 'INITIALIZING') {
          return rejectWithValue({
            message: 'Audio initialization already in progress in AudioManager',
            code: 'GLOBAL_INIT_IN_PROGRESS'
          });
        }
      }

      // Also check legacy event system
      if (window.__AUDIO_EVENT_SYSTEM) {
        const { STATE } = window.__AUDIO_EVENT_SYSTEM;
        if (STATE.initializing) {
          return rejectWithValue({
            message: 'Audio initialization already in progress in another component',
            code: 'GLOBAL_INIT_IN_PROGRESS'
          });
        }

        // If already successful globally, just return that state
        if (STATE.initialized) {
          try {
            const Tone = await import('tone');
            if (Tone.context && Tone.context.state === 'running') {
              return {
                contextState: Tone.context.state,
                iOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
                safari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
              };
            }
          } catch (err) {
            // Continue with initialization if we can't verify context state
            console.debug('Unable to verify Tone context state:', err);
          }
        }
      }
    }

    // Add a debounce mechanism
    let lastInitTime = window.__AUDIO_LAST_INIT_TIME || 0;
    const now = Date.now();
    const DEBOUNCE_TIME = 500; // ms

    if (now - lastInitTime < DEBOUNCE_TIME) {
      console.warn(`Audio initialization attempted too quickly (${now - lastInitTime}ms since last attempt)`);
      return rejectWithValue({
        message: 'Audio initialization attempted too quickly',
        code: 'INIT_DEBOUNCED'
      });
    }

    // Check if this is triggered by a user gesture
    // In browsers, user gestures create a small window of opportunity to start AudioContext
    const hasUserGesture = (window.__AUDIO_USER_GESTURE_TIMESTAMP &&
                            (Date.now() - window.__AUDIO_USER_GESTURE_TIMESTAMP < 5000)) ||
                           (window.__AUDIO_MANAGER?.userGestureTimestamp &&
                            (Date.now() - window.__AUDIO_MANAGER.userGestureTimestamp < 5000));

    if (!hasUserGesture && !audio.unlockAttempted) {
      console.warn('Audio initialization attempted without user gesture');
      return rejectWithValue({
        message: 'Audio initialization requires user interaction',
        code: 'NO_USER_GESTURE'
      });
    }

    // Update last initialization time
    window.__AUDIO_LAST_INIT_TIME = now;

    // Set global initialization flag
    if (window.__AUDIO_EVENT_SYSTEM) {
      window.__AUDIO_EVENT_SYSTEM.STATE.initializing = true;
    }

    // Also set flag in AudioManager if it exists
    if (window.__AUDIO_MANAGER) {
      window.__AUDIO_MANAGER.state = 'INITIALIZING';
    }

    try {
      // Dynamically import Tone to prevent auto-initialization
      const Tone = await import('tone');

      // Detect browser
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      // Create and play a silent sound first (helps unlock audio)
      try {
        const tempContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = tempContext.createBuffer(1, 1, 22050);
        const source = tempContext.createBufferSource();
        source.buffer = buffer;
        source.connect(tempContext.destination);

        // Start only if we have a user gesture or explicit unlock attempt
        if (hasUserGesture || audio.unlockAttempted) {
          source.start(0);
          await tempContext.resume();
        }

        // Close after a delay
        setTimeout(() => {
          if (tempContext.state !== 'closed') {
            tempContext.close().catch(() => {});
          }
        }, 100);
      } catch (e) {
        console.warn('Silent sound failed:', e);
      }

      // For iOS/Safari, we need an additional approach
      if (isIOS || isSafari) {
        const audioEl = document.createElement('audio');
        audioEl.src = 'data:audio/mp3;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        audioEl.loop = false;
        audioEl.autoplay = false;
        audioEl.volume = 0.01;
        document.body.appendChild(audioEl);

        try {
          // Play only if we have a user gesture or explicit unlock attempt
          if (hasUserGesture || audio.unlockAttempted) {
            await audioEl.play();
            await new Promise(resolve => setTimeout(resolve, 100));
            audioEl.pause();
          }
        } finally {
          document.body.removeChild(audioEl);
        }
      }

      // Now initialize Tone.js
      let contextState;
      try {
        // If context exists, try to resume it
        if (Tone.context) {
          if (Tone.context.state !== 'running' && (hasUserGesture || audio.unlockAttempted)) {
            await Tone.context.resume();

            // Double-check context state after a brief pause
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          contextState = Tone.context.state;
        } else {
          // Create a new context only if we have a user gesture or explicit unlock
          if (hasUserGesture || audio.unlockAttempted) {
            await Tone.start();
          } else {
            // Only create context, don't start it without user gesture
            Tone.context = new (window.AudioContext || window.webkitAudioContext)();
          }
          contextState = Tone.context ? Tone.context.state : 'unknown';
        }
      } catch (e) {
        // If this fails, we'll try one more approach
        try {
          // Create a custom AudioContext and attach it to Tone.js
          // This can help overcome some browser restrictions
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();

          // Resume only if we have a user gesture or explicit unlock
          if (hasUserGesture || audio.unlockAttempted) {
            await audioContext.resume();
          }

          // Set the context explicitly
          Tone.setContext(audioContext);
          contextState = audioContext.state;
        } catch (fallbackError) {
          return rejectWithValue({
            message: `Failed to initialize audio: ${fallbackError.message}`,
            code: 'CONTEXT_CREATION_FAILED'
          });
        }
      }

      return {
        contextState,
        iOS: isIOS,
        safari: isSafari,
      };
    } catch (error) {
      return rejectWithValue({
        message: `Audio initialization error: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR'
      });
    } finally {
      // Always clean up global initialization flags
      if (window.__AUDIO_EVENT_SYSTEM) {
        window.__AUDIO_EVENT_SYSTEM.STATE.initializing = false;
      }

      // Also update AudioManager state
      if (window.__AUDIO_MANAGER) {
        window.__AUDIO_MANAGER.state = 'FAILED';
      }
    }
  }
);

// Create the audio slice
const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    showUnlockButton(state) {
      state.unlockButtonVisible = true;
    },
    hideUnlockButton(state) {
      state.unlockButtonVisible = false;
    },
    unlockAttempted(state) {
      state.unlockAttempted = true;
    },
    setContextState(state, action) {
      state.contextState = action.payload;

      // If context is now running, update ready state
      if (action.payload === 'running') {
        state.ready = true;
      }
    },
    resetAudioState(state) {
      // Reset state but keep browser detection
      const { iOS, safari } = state;
      return {
        ...initialState,
        iOS,
        safari,
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAudio.pending, (state) => {
        state.initializing = true;
        state.error = null;
      })
      .addCase(initializeAudio.fulfilled, (state, action) => {
        state.initializing = false;
        state.initialized = true;
        state.attempts += 1;
        state.contextState = action.payload.contextState;
        state.ready = action.payload.contextState === 'running';
        state.iOS = action.payload.iOS;
        state.safari = action.payload.safari;
        state.error = null;

        // Hide the unlock button if audio is ready
        if (state.ready) {
          state.unlockButtonVisible = false;
        }

        // Update global state
        if (window.__AUDIO_MANAGER) {
          window.__AUDIO_MANAGER.state = 'INITIALIZED';
          window.__AUDIO_MANAGER.initialized = true;
        }
      })
      .addCase(initializeAudio.rejected, (state, action) => {
        state.initializing = false;
        state.attempts += 1;

        // Handle structured error responses
        if (action.payload && typeof action.payload === 'object') {
          // Check if this is just a debounce or in-progress error, not a real failure
          if (action.payload.code === 'INIT_DEBOUNCED' ||
              action.payload.code === 'INIT_IN_PROGRESS' ||
              action.payload.code === 'GLOBAL_INIT_IN_PROGRESS') {
            // These are not true failures, so don't show the unlock button
            state.error = action.payload.message;
            return;
          }

          // For user gesture errors, always show unlock button
          if (action.payload.code === 'NO_USER_GESTURE') {
            state.error = action.payload.message;
            state.unlockButtonVisible = true;
            return;
          }

          state.error = action.payload.message || 'Unknown audio initialization error';
        } else {
          state.error = action.payload || 'Unknown audio initialization error';
        }

        // Only show unlock button for actual errors, not for debounced attempts
        state.unlockButtonVisible = true;
      });
  }
});

export const { showUnlockButton, hideUnlockButton, unlockAttempted, setContextState, resetAudioState } = audioSlice.actions;

export default audioSlice.reducer;

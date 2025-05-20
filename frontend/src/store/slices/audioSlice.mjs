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

    // First check our own state
    if (audio.initializing) {
      console.error('Error initializing audio context: Audio initialization already in progress');
      return rejectWithValue({
        message: 'Audio initialization already in progress',
        code: 'INIT_IN_PROGRESS'
      });
    }

    // Check global audio event system
    if (typeof window !== 'undefined' && window.__AUDIO_EVENT_SYSTEM) {
      const { STATE } = window.__AUDIO_EVENT_SYSTEM;
      if (STATE.initializing) {
        return rejectWithValue({
          message: 'Audio initialization already in progress in another component',
          code: 'GLOBAL_INIT_IN_PROGRESS'
        });
      }

      // If already successful globally, just return that state
      if (STATE.initialized) {
        const Tone = await import('tone');
        if (Tone.context && Tone.context.state === 'running') {
          return {
            contextState: Tone.context.state,
            iOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
            safari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
          };
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

    // Update last initialization time
    window.__AUDIO_LAST_INIT_TIME = now;

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
        source.start(0);
        await tempContext.resume();

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
          await audioEl.play();
          await new Promise(resolve => setTimeout(resolve, 100));
          audioEl.pause();
        } finally {
          document.body.removeChild(audioEl);
        }
      }

      // Now initialize Tone.js
      let contextState;
      try {
        // If context exists, try to resume it
        if (Tone.context) {
          if (Tone.context.state !== 'running') {
            await Tone.context.resume();
          }
          contextState = Tone.context.state;
        } else {
          // Create a new context
          await Tone.start();
          contextState = Tone.context ? Tone.context.state : 'unknown';
        }
      } catch (e) {
        // If this fails, we'll try one more approach
        try {
          // Create a custom AudioContext and attach it to Tone.js
          // This can help overcome some browser restrictions
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          await audioContext.resume();

          // Set the context explicitly
          Tone.setContext(audioContext);
          contextState = audioContext.state;
        } catch (fallbackError) {
          return rejectWithValue(`Failed to initialize audio: ${fallbackError.message}`);
        }
      }

      return {
        contextState,
        iOS: isIOS,
        safari: isSafari,
      };
    } catch (error) {
      return rejectWithValue(`Audio initialization error: ${error.message}`);
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
      })
      .addCase(initializeAudio.rejected, (state, action) => {
        state.initializing = false;
        state.attempts += 1;

        // Handle structured error responses
        if (action.payload && typeof action.payload === 'object') {
          // Check if this is just a debounce or in-progress error, not a real failure
          if (action.payload.code === 'INIT_DEBOUNCED' || action.payload.code === 'INIT_IN_PROGRESS') {
            // These are not true failures, so don't show the unlock button
            state.error = action.payload.message;
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

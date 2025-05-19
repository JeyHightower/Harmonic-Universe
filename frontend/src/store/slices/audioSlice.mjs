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
  async (_, { getState, rejectWithValue }) => {
    const { audio } = getState();

    // Prevent multiple initialization attempts in quick succession
    if (audio.initializing) {
      console.error('Error initializing audio context: Audio initialization already in progress');
      return rejectWithValue('Audio initialization already in progress');
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
        state.error = action.payload || 'Unknown audio initialization error';
        state.unlockButtonVisible = true;
      });
  }
});

export const { showUnlockButton, hideUnlockButton, unlockAttempted, setContextState, resetAudioState } = audioSlice.actions;

export default audioSlice.reducer;

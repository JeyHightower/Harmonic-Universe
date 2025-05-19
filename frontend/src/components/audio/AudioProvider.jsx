import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAudio } from '../../hooks';
import AudioButton from './AudioButton';

/**
 * AudioProvider component
 *
 * This component:
 * 1. Sets up global audio context initialization
 * 2. Shows the AudioButton when needed
 * 3. Handles user interactions for initializing audio
 */
const AudioProvider = ({ children }) => {
  const dispatch = useDispatch();
  const {
    initAudio,
    ready,
    error,
    contextState,
    unlockButtonVisible
  } = useAudio();

  // Check for iOS or Safari and automatically show the audio button
  // since these browsers have strict autoplay policies
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // For iOS and Safari, we'll immediately show the button
    // since these platforms have strict autoplay policies
    if ((isIOS || isSafari) && contextState !== 'running') {
      // No need to dispatch here since the useAudio hook handles this
    }
  }, [contextState]);

  // Expose audio management to the window for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      window.__audioDebug = {
        initAudio,
        currentState: {
          ready,
          error,
          contextState,
          unlockButtonVisible
        }
      };
    }
  }, [ready, error, contextState, unlockButtonVisible, initAudio]);

  return (
    <>
      {children}
      <AudioButton />
    </>
  );
};

export default AudioProvider;

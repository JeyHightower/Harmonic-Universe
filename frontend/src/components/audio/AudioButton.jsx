import { useDispatch, useSelector } from 'react-redux';
import { hideUnlockButton, initializeAudio } from '../../store/slices/audioSlice.mjs';

/**
 * AudioButton component for user-triggered audio context initialization
 * This handles the "AudioContext was not allowed to start" issue in modern browsers
 */
const AudioButton = () => {
  const dispatch = useDispatch();
  const { unlockButtonVisible, initializing, error, ready, contextState } = useSelector(state => state.audio);

  // Don't render if button shouldn't be visible
  if (!unlockButtonVisible) return null;

  const handleEnableAudio = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Try to initialize audio through Redux
      await dispatch(initializeAudio()).unwrap();

      // Hide button on success
      dispatch(hideUnlockButton());
    } catch (err) {
      console.error('Failed to initialize audio:', err);
      // Keep button visible on error
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
            100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
          }
          .audio-enable-button {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 99999;
            padding: 10px 20px;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: pulse-animation 2s infinite;
            transition: background-color 0.3s ease;
          }
          .audio-enable-button:hover {
            background: #1565c0;
          }
          .audio-enable-button.error {
            background: #d32f2f;
          }
          .audio-enable-button:disabled {
            background: #9e9e9e;
            cursor: not-allowed;
            animation: none;
          }
        `}
      </style>

      <button
        className={`audio-enable-button ${error ? 'error' : ''}`}
        onClick={handleEnableAudio}
        disabled={initializing}
        aria-label="Enable audio for this application"
      >
        {initializing ? 'Enabling Audio...' :
         error ? 'Try Again' :
         'Enable Audio'}
      </button>
    </>
  );
};

export default AudioButton;

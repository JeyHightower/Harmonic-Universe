import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { deleteAudio, fetchAudioDetails } from '../../services/audioService';
import '../../styles/modal.css';

/**
 * Modal for displaying and playing audio tracks.
 * @param {Object} props - Component props
 * @param {string} props.audioId - ID of the audio track
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Object} props.modalProps - Props for the Modal component
 * @param {boolean} props.isGlobalModal - Whether this modal is opened globally
 */
const AudioDetailsModal = ({
  universeId,
  sceneId,
  audioId,
  onClose,
  modalProps = {},
  isGlobalModal = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const animationRef = useRef(null);

  // Fetch audio data when the component mounts
  useEffect(() => {
    const fetchAudioData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAudioDetails(audioId, universeId, sceneId);
        setAudio(data);

        // Create a new audio element with the audio URL
        if (audioRef.current) {
          audioRef.current.src = data.audio_url;
          audioRef.current.load();
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching audio data');
      } finally {
        setLoading(false);
      }
    };

    fetchAudioData();

    // Cleanup animation frame on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioId, universeId, sceneId]);

  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);

      // Update progress bar
      if (progressRef.current && audioRef.current.duration) {
        const progress =
          (audioRef.current.currentTime / audioRef.current.duration) * 100;
        progressRef.current.style.width = `${progress}%`;
      }
    }
  };

  // Handle audio duration change
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (progressRef.current) {
      const percentage =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      progressRef.current.style.width = `${percentage}%`;
    }
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  // Format time in MM:SS format
  const formatTime = timeInSeconds => {
    if (isNaN(timeInSeconds)) return '0:00';

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Handle click on progress bar to seek
  const handleProgressClick = e => {
    if (!audioRef.current || !progressRef.current) return;

    const progressContainer = e.currentTarget;
    const bounds = progressContainer.getBoundingClientRect();
    const clickPosition = (e.clientX - bounds.left) / bounds.width;

    const newTime = clickPosition * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    if (progressRef.current) {
      progressRef.current.style.width = `${clickPosition * 100}%`;
    }
  };

  // Handle audio delete
  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this audio track? This action cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await deleteAudio(audioId, universeId, sceneId);
      onClose?.();
      if (!isGlobalModal) {
        navigate(`/universes/${universeId}/scenes/${sceneId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete audio');
      setLoading(false);
    }
  };

  // Edit audio
  const handleEdit = () => {
    onClose?.();
    if (!isGlobalModal) {
      navigate(
        `/universes/${universeId}/scenes/${sceneId}/audio/${audioId}/edit`
      );
    } else {
      navigate(
        `/modal/audio/edit/${audioId}?universe_id=${universeId}&scene_id=${sceneId}`
      );
    }
  };

  // Format parameters for display
  const renderParameters = parameters => {
    if (!parameters || Object.keys(parameters).length === 0) {
      return <p>No parameters available</p>;
    }

    return (
      <ul className="parameters-list">
        {Object.entries(parameters).map(([key, value]) => (
          <li key={key}>
            <strong>{key.replace(/_/g, ' ')}:</strong>{' '}
            {typeof value === 'number' ? value.toFixed(2) : value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Modal {...modalProps} onClose={onClose} className="audio-details-modal">
      <div className="modal-header">
        <h2>
          {modalProps.title ||
            (audio ? `Audio: ${audio.name}` : 'Audio Details')}
        </h2>
      </div>

      <div className="modal-body">
        {loading ? (
          <div className="loading-container">
            <Spinner size="medium" />
            <p>Loading audio data...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : audio ? (
          <div className="audio-details">
            <div className="audio-info">
              <p>
                <strong>Name:</strong> {audio.name}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {audio.description || 'No description provided'}
              </p>
              <p>
                <strong>Algorithm:</strong>{' '}
                {audio.algorithm?.replace(/_/g, ' ') || 'Unknown'}
              </p>
              <p>
                <strong>Duration:</strong> {formatTime(audio.duration || 0)}
              </p>
              <p>
                <strong>Key:</strong> {audio.key || 'C'}
              </p>
              <p>
                <strong>Scale:</strong>{' '}
                {audio.scale?.replace(/_/g, ' ') || 'major'}
              </p>

              <div className="parameters-section">
                <h3>Parameters</h3>
                {renderParameters(audio.parameters)}
              </div>
            </div>

            <div className="audio-player">
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onEnded={handleEnded}
                preload="metadata"
              />

              <div className="player-controls">
                <Button
                  variant="icon"
                  onClick={handlePlayPause}
                  className="play-button"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? '❚❚' : '▶'}
                </Button>

                <div className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div
                className="progress-container"
                onClick={handleProgressClick}
                aria-label="Audio progress"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax={duration}
                aria-valuenow={currentTime}
              >
                <div className="progress-background"></div>
                <div className="progress-bar" ref={progressRef}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">No audio data available</div>
        )}
      </div>

      <div className="modal-footer">
        <Button variant="secondary" onClick={handleEdit}>
          Edit Audio
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete Audio
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

AudioDetailsModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string.isRequired,
  audioId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

AudioDetailsModal.defaultProps = {
  onClose: () => {},
  modalProps: {},
  isGlobalModal: false,
};

export default AudioDetailsModal;

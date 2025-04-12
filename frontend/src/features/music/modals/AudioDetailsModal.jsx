import PropTypes from "prop-types";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Spinner from "../../../components/common/Spinner";
import "../styles/Modal.css";
import { audioService } from "../../../services";

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
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Fetch audio data
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true);
        const response = await audioService.getAudio(universeId, sceneId, audioId);
        if (response.success) {
          setAudio(response.data);
        } else {
          throw new Error(response.message || "Failed to load audio data");
        }
      } catch (error) {
        console.error("Error fetching audio:", error);
        setError("Failed to load audio data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAudio();
  }, [universeId, sceneId, audioId]);

  // Handle audio playback
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update time display and progress bar
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      updateProgressBar();
    }
  };

  // Update progress bar
  const updateProgressBar = () => {
    if (audioRef.current && progressRef.current && duration > 0) {
      const percent = (audioRef.current.currentTime / duration) * 100;
      progressRef.current.style.width = `${percent}%`;
    }
  };

  // Set duration when metadata is loaded
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (progressRef.current) {
      progressRef.current.style.width = "0%";
    }
  };

  // Handle clicking on progress bar
  const handleProgressClick = (e) => {
    if (audioRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const bounds = progressBar.getBoundingClientRect();
      const percent = (e.clientX - bounds.left) / bounds.width;
      audioRef.current.currentTime = percent * duration;
      updateProgressBar();
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle editing the audio
  const handleEdit = () => {
    if (isGlobalModal) {
      onClose();
      navigate(`/universes/${universeId}/scenes/${sceneId}/audio/${audioId}/edit`);
    } else {
      // Return to the parent component with edit action
      onClose({ action: "edit", audioId });
    }
  };

  // Handle deleting the audio
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this audio?")) {
      try {
        const response = await audioService.deleteAudio(universeId, sceneId, audioId);
        if (response.success) {
          if (isGlobalModal) {
            navigate(`/universes/${universeId}/scenes/${sceneId}`);
          } else {
            onClose({ action: "delete", audioId });
          }
        } else {
          throw new Error(response.message || "Failed to delete audio");
        }
      } catch (error) {
        console.error("Error deleting audio:", error);
        setError("Failed to delete audio. Please try again.");
      }
    }
  };

  // Render parameters from the audio object
  const renderParameters = (params) => {
    if (!params || Object.keys(params).length === 0) {
      return <p>No parameters available</p>;
    }

    return (
      <div className="parameters-grid">
        {Object.entries(params).map(([key, value]) => (
          <div key={key} className="parameter-item">
            <div className="parameter-name">
              {key.replace(/_/g, " ")}:
            </div>
            <div className="parameter-value">
              {typeof value === "number" ? value.toFixed(2) : value.toString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal {...modalProps} onClose={onClose} className="audio-details-modal">
      <div className="modal-header">
        <h2>
          {modalProps.title ||
            (audio ? `Audio: ${audio.name}` : "Audio Details")}
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
                <strong>Description:</strong>{" "}
                {audio.description || "No description provided"}
              </p>
              <p>
                <strong>Algorithm:</strong>{" "}
                {audio.algorithm?.replace(/_/g, " ") || "Unknown"}
              </p>
              <p>
                <strong>Duration:</strong> {formatTime(audio.duration || 0)}
              </p>
              <p>
                <strong>Key:</strong> {audio.key || "C"}
              </p>
              <p>
                <strong>Scale:</strong>{" "}
                {audio.scale?.replace(/_/g, " ") || "major"}
              </p>

              <div className="parameters-section">
                <h3>Parameters</h3>
                {renderParameters(audio.parameters)}
              </div>
            </div>

            <div className="audio-player">
              <h3>Audio Player</h3>
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onEnded={handleEnded}
                src={audio.audio_url}
              />
              <div className="player-controls">
                <button
                  className="play-button"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <div className="progress-container" onClick={handleProgressClick}>
                  <div className="progress-bar">
                    <div ref={progressRef} className="progress"></div>
                  </div>
                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="error-message">Audio not found</div>
        )}
      </div>

      <div className="modal-footer">
        <div className="button-group">
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
          
          {audio && (
            <>
              <Button
                onClick={handleEdit}
                variant="outlined"
                color="primary"
              >
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="outlined"
                color="error"
              >
                Delete
              </Button>
              <Button
                onClick={() => window.open(audio.audio_url, "_blank")}
                variant="contained"
                color="primary"
              >
                Download
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

AudioDetailsModal.propTypes = {
  universeId: PropTypes.string.isRequired,
  sceneId: PropTypes.string,
  audioId: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  modalProps: PropTypes.object,
  isGlobalModal: PropTypes.bool,
};

AudioDetailsModal.defaultProps = {
  sceneId: null,
  onClose: () => {},
  modalProps: {},
  isGlobalModal: false,
};

export default AudioDetailsModal; 
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addTrack,
  removeTrack,
  selectActiveTrackId,
  selectMasterVolume,
  selectTracks,
  setActiveTrack,
  setMasterVolume,
  setTrackMute,
  setTrackPan,
  setTrackSolo,
  setTrackVolume,
} from '../../store/slices/audioSlice';
import styles from './TrackList.module.css';

const TrackList = () => {
  const dispatch = useDispatch();
  const tracks = useSelector(selectTracks);
  const activeTrackId = useSelector(selectActiveTrackId);
  const masterVolume = useSelector(selectMasterVolume);

  const handleAddTrack = () => {
    dispatch(addTrack());
  };

  const handleRemoveTrack = trackId => {
    dispatch(removeTrack(trackId));
  };

  const handleTrackSelect = trackId => {
    dispatch(setActiveTrack(trackId));
  };

  const handleMuteToggle = (trackId, isMuted) => {
    dispatch(setTrackMute({ trackId, isMuted: !isMuted }));
  };

  const handleSoloToggle = (trackId, isSolo) => {
    dispatch(setTrackSolo({ trackId, isSolo: !isSolo }));
  };

  const handleVolumeChange = (trackId, volume) => {
    dispatch(setTrackVolume({ trackId, volume: parseFloat(volume) }));
  };

  const handlePanChange = (trackId, pan) => {
    dispatch(setTrackPan({ trackId, pan: parseFloat(pan) }));
  };

  const handleMasterVolumeChange = volume => {
    dispatch(setMasterVolume(parseFloat(volume)));
  };

  return (
    <div className={styles.trackList}>
      <div className={styles.header}>
        <h3>Tracks</h3>
        <button
          className={styles.addButton}
          onClick={handleAddTrack}
          title="Add new track"
        >
          <i className="fas fa-plus" />
          <span>Add Track</span>
        </button>
      </div>

      <div className={styles.tracks}>
        {tracks.map(track => (
          <div
            key={track.id}
            className={`${styles.track} ${
              track.id === activeTrackId ? styles.active : ''
            }`}
            onClick={() => handleTrackSelect(track.id)}
          >
            <div className={styles.trackHeader}>
              <div className={styles.trackInfo}>
                <span className={styles.trackName}>{track.name}</span>
                {tracks.length > 1 && (
                  <button
                    className={styles.removeButton}
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveTrack(track.id);
                    }}
                    title="Remove track"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>

              <div className={styles.trackControls}>
                <button
                  className={`${styles.muteButton} ${
                    track.isMuted ? styles.active : ''
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    handleMuteToggle(track.id, track.isMuted);
                  }}
                  title="Mute track"
                >
                  <i className="fas fa-volume-mute" />
                </button>

                <button
                  className={`${styles.soloButton} ${
                    track.isSolo ? styles.active : ''
                  }`}
                  onClick={e => {
                    e.stopPropagation();
                    handleSoloToggle(track.id, track.isSolo);
                  }}
                  title="Solo track"
                >
                  <i className="fas fa-headphones" />
                </button>
              </div>
            </div>

            <div className={styles.trackMixer}>
              <div className={styles.mixerControl}>
                <label htmlFor={`volume-${track.id}`}>Volume</label>
                <input
                  id={`volume-${track.id}`}
                  type="range"
                  min="-60"
                  max="6"
                  step="0.1"
                  value={track.volume}
                  onChange={e => handleVolumeChange(track.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <span>{track.volume.toFixed(1)} dB</span>
              </div>

              <div className={styles.mixerControl}>
                <label htmlFor={`pan-${track.id}`}>Pan</label>
                <input
                  id={`pan-${track.id}`}
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={track.pan}
                  onChange={e => handlePanChange(track.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <span>
                  {track.pan === 0
                    ? 'C'
                    : track.pan < 0
                    ? `L${Math.abs(track.pan * 100)}`
                    : `R${track.pan * 100}`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.masterSection}>
        <h4>Master</h4>
        <div className={styles.masterVolume}>
          <label htmlFor="master-volume">Master Volume</label>
          <input
            id="master-volume"
            type="range"
            min="-60"
            max="6"
            step="0.1"
            value={masterVolume}
            onChange={e => handleMasterVolumeChange(e.target.value)}
          />
          <span>{masterVolume.toFixed(1)} dB</span>
        </div>
      </div>
    </div>
  );
};

export default TrackList;

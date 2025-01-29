import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IconButton } from '../common/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  gap: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TimeDisplay = styled.div`
  font-family: monospace;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.colors.surfaceDark};
  border-radius: 4px;
`;

const Timeline = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const TimelineRuler = styled.div`
  height: 24px;
  background: ${({ theme }) => theme.colors.surfaceDark};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  overflow: hidden;
`;

const TimelineTracks = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
`;

const Track = styled.div`
  height: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  background: ${({ theme }) => theme.colors.surface};
`;

const Clip = styled.div`
  position: absolute;
  top: 4px;
  height: calc(100% - 8px);
  background: ${({ theme, type }) =>
    type === 'visual' ? theme.colors.primary : theme.colors.secondary};
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
`;

const Playhead = styled.div`
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: ${({ theme }) => theme.colors.accent};
  pointer-events: none;
  z-index: 2;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -4px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid ${({ theme }) => theme.colors.accent};
  }
`;

const TimeMarker = styled.div`
  position: absolute;
  width: 1px;
  height: 12px;
  bottom: 0;
  background: ${({ theme }) => theme.colors.border};

  &::after {
    content: '${({ time }) => time}';
    position: absolute;
    top: -14px;
    left: -12px;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textSecondary};
    width: 24px;
    text-align: center;
  }
`;

export function TimelineControls({
  currentTime,
  isPlaying,
  scenes,
  visualEffects,
  audioTracks,
  onTimeUpdate,
  onPlayPause,
  onAddVisualEffect,
  onUpdateVisualEffect,
  onRemoveVisualEffect,
  onAddAudioTrack,
  onUpdateAudioTrack,
  onRemoveAudioTrack,
}) {
  const timelineRef = useRef(null);
  const totalDuration = scenes.reduce(
    (total, scene) => total + scene.content.duration,
    0
  );
  const pixelsPerSecond = 100; // 100px per second

  useEffect(() => {
    if (!timelineRef.current) return;

    const handleTimelineClick = e => {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = clickX / pixelsPerSecond;
      if (newTime >= 0 && newTime <= totalDuration) {
        onTimeUpdate(newTime);
      }
    };

    const timeline = timelineRef.current;
    timeline.addEventListener('click', handleTimelineClick);
    return () => timeline.removeEventListener('click', handleTimelineClick);
  }, [totalDuration, onTimeUpdate]);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderTimeMarkers = () => {
    const markers = [];
    for (let i = 0; i <= totalDuration; i += 30) {
      markers.push(
        <TimeMarker
          key={i}
          style={{ left: `${i * pixelsPerSecond}px` }}
          time={formatTime(i)}
        />
      );
    }
    return markers;
  };

  const getClipStyle = (startTime, duration) => ({
    left: `${startTime * pixelsPerSecond}px`,
    width: `${duration * pixelsPerSecond}px`,
  });

  return (
    <Container>
      <Controls>
        <IconButton
          icon={isPlaying ? 'pause' : 'play'}
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        />
        <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
        <IconButton
          icon="plus"
          onClick={() => onAddVisualEffect({ startTime: currentTime })}
          title="Add visual effect"
        />
        <IconButton
          icon="music"
          onClick={() => onAddAudioTrack({ startTime: currentTime })}
          title="Add audio track"
        />
      </Controls>

      <Timeline ref={timelineRef}>
        <TimelineRuler>{renderTimeMarkers()}</TimelineRuler>

        <TimelineTracks>
          <Track>
            {visualEffects.map((effect, index) => (
              <Clip
                key={index}
                type="visual"
                style={getClipStyle(effect.startTime, effect.duration)}
                onClick={() => onUpdateVisualEffect(effect)}
                title={effect.type}
              />
            ))}
          </Track>

          <Track>
            {audioTracks.map((track, index) => (
              <Clip
                key={index}
                type="audio"
                style={getClipStyle(track.startTime, track.duration)}
                onClick={() => onUpdateAudioTrack(track)}
                title={track.type}
              />
            ))}
          </Track>
        </TimelineTracks>

        <Playhead style={{ left: `${currentTime * pixelsPerSecond}px` }} />
      </Timeline>
    </Container>
  );
}

TimelineControls.propTypes = {
  currentTime: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  scenes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      content: PropTypes.shape({
        duration: PropTypes.number.isRequired,
      }).isRequired,
    })
  ).isRequired,
  visualEffects: PropTypes.arrayOf(
    PropTypes.shape({
      startTime: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
    })
  ).isRequired,
  audioTracks: PropTypes.arrayOf(
    PropTypes.shape({
      startTime: PropTypes.number.isRequired,
      duration: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
    })
  ).isRequired,
  onTimeUpdate: PropTypes.func.isRequired,
  onPlayPause: PropTypes.func.isRequired,
  onAddVisualEffect: PropTypes.func.isRequired,
  onUpdateVisualEffect: PropTypes.func.isRequired,
  onRemoveVisualEffect: PropTypes.func.isRequired,
  onAddAudioTrack: PropTypes.func.isRequired,
  onUpdateAudioTrack: PropTypes.func.isRequired,
  onRemoveAudioTrack: PropTypes.func.isRequired,
};

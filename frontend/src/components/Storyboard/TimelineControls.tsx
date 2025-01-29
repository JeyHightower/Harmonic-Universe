import React, { useRef } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.primary.main};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primary.dark};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.primary.light};
    cursor: not-allowed;
  }
`;

const TimeDisplay = styled.div`
  font-family: monospace;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Timeline = styled.div`
  flex: 1;
  position: relative;
  background: ${({ theme }) => theme.colors.background.dark};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow: hidden;
`;

const TimelineRuler = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: ${({ theme }) => theme.colors.background.light};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const TimelineTracks = styled.div`
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
`;

const Track = styled.div`
  height: 40px;
  margin: 4px 0;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  position: relative;
`;

const Clip = styled.div<{
  start: number;
  duration: number;
  type: 'visual' | 'audio';
}>`
  position: absolute;
  height: 100%;
  background: ${({ theme, type }) =>
    type === 'visual'
      ? theme.colors.primary.main
      : theme.colors.secondary.main};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  left: ${({ start }) => start * 100}%;
  width: ${({ duration }) => duration * 100}%;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Playhead = styled.div<{ position: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: ${({ theme }) => theme.colors.accent.main};
  left: ${({ position }) => position * 100}%;
  pointer-events: none;
`;

interface TimelineControlsProps {
  currentTime: number;
  isPlaying: boolean;
  scenes: Array<{
    id: number;
    sequence: number;
    content: { duration: number };
  }>;
  visualEffects: Array<{
    id: number;
    start_time: number;
    duration: number;
  }>;
  audioTracks: Array<{
    id: number;
    start_time: number;
    duration: number;
  }>;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  onAddVisualEffect: (params: any) => void;
  onUpdateVisualEffect: (id: number, params: any) => void;
  onRemoveVisualEffect: (id: number) => void;
  onAddAudioTrack: (params: any) => void;
  onUpdateAudioTrack: (id: number, params: any) => void;
  onRemoveAudioTrack: (id: number) => void;
}

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
}: TimelineControlsProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalDuration = scenes.reduce((max, scene) => {
    const sceneDuration = scene.content.duration || 0;
    return Math.max(max, scene.sequence * sceneDuration);
  }, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onTimeUpdate(percentage * totalDuration);
  };

  return (
    <Container>
      <Controls>
        <Button onClick={onPlayPause}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
      </Controls>
      <Timeline ref={timelineRef} onClick={handleTimelineClick}>
        <TimelineRuler />
        <TimelineTracks>
          <Track>
            {visualEffects.map(effect => (
              <Clip
                key={effect.id}
                start={effect.start_time / totalDuration}
                duration={effect.duration / totalDuration}
                type="visual"
              />
            ))}
          </Track>
          <Track>
            {audioTracks.map(track => (
              <Clip
                key={track.id}
                start={track.start_time / totalDuration}
                duration={track.duration / totalDuration}
                type="audio"
              />
            ))}
          </Track>
        </TimelineTracks>
        <Playhead position={currentTime / totalDuration} />
      </Timeline>
    </Container>
  );
}

import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useStoryboard } from '../../hooks/useStoryboard';
import { IconButton } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { Loader } from '../common/Loader';
import { SceneManager } from './SceneManager';
import { TimelineControls } from './TimelineControls';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const MainPanel = styled.div`
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewPanel = styled.div`
  flex: 2;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

const TimelinePanel = styled.div`
  height: 200px;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1rem;
`;

interface StoryboardEditorProps {
  universeId: number;
  storyboardId: number;
}

export function StoryboardEditor({
  universeId,
  storyboardId,
}: StoryboardEditorProps) {
  const {
    storyboard,
    loading,
    error,
    currentTime,
    isPlaying,
    selectedSceneId,
    addScene,
    updateScene,
    reorderScenes,
    addVisualEffect,
    addAudioTrack,
    play,
    pause,
    seek,
    selectScene,
    connected,
  } = useStoryboard(universeId, storyboardId);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        isPlaying ? pause() : play();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, play, pause]);

  // Handle playback
  const handlePlayPause = useCallback(() => {
    isPlaying ? pause() : play();
  }, [isPlaying, play, pause]);

  const handleTimeUpdate = useCallback(
    (time: number) => {
      seek(time);
    },
    [seek]
  );

  const handleSceneSelect = useCallback(
    (sceneId: number) => {
      selectScene(sceneId);
    },
    [selectScene]
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!storyboard) {
    return <ErrorMessage message="Storyboard not found" />;
  }

  return (
    <Container>
      <Header>
        <Title>{storyboard.title}</Title>
        <div>
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          />
          {!connected && (
            <ErrorMessage
              message="Disconnected from server"
              variant="warning"
            />
          )}
        </div>
      </Header>

      <Content>
        <MainPanel>
          <SceneManager
            scenes={storyboard.scenes}
            selectedSceneId={selectedSceneId}
            onSceneSelect={handleSceneSelect}
            onAddScene={addScene}
            onUpdateScene={updateScene}
            onReorderScenes={reorderScenes}
          />
        </MainPanel>

        <PreviewPanel>
          {selectedSceneId && (
            <div>
              {/* Scene preview will be implemented here */}
              <h2>Scene Preview</h2>
              <p>Selected Scene: {selectedSceneId}</p>
            </div>
          )}
        </PreviewPanel>
      </Content>

      <TimelinePanel>
        <TimelineControls
          currentTime={currentTime}
          isPlaying={isPlaying}
          scenes={storyboard.scenes}
          visualEffects={
            selectedSceneId
              ? storyboard.scenes.find(s => s.id === selectedSceneId)
                  ?.visual_effects || []
              : []
          }
          audioTracks={
            selectedSceneId
              ? storyboard.scenes.find(s => s.id === selectedSceneId)
                  ?.audio_tracks || []
              : []
          }
          onTimeUpdate={handleTimeUpdate}
          onPlayPause={handlePlayPause}
          onAddVisualEffect={effect =>
            selectedSceneId && addVisualEffect(selectedSceneId, effect)
          }
          onUpdateVisualEffect={() => {}}
          onRemoveVisualEffect={() => {}}
          onAddAudioTrack={track =>
            selectedSceneId && addAudioTrack(selectedSceneId, track)
          }
          onUpdateAudioTrack={() => {}}
          onRemoveAudioTrack={() => {}}
        />
      </TimelinePanel>
    </Container>
  );
}

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { StoryboardEditor } from '../../../components/Storyboard/StoryboardEditor';
import { useStoryboard } from '../../../hooks/useStoryboard';
import { theme } from '../../../theme';

// Mock dependencies
jest.mock('../../../hooks/useStoryboard');
jest.mock('./SceneManager', () => ({
  SceneManager: () => <div data-testid="scene-manager">Scene Manager</div>,
}));
jest.mock('./TimelineControls', () => ({
  TimelineControls: () => (
    <div data-testid="timeline-controls">Timeline Controls</div>
  ),
}));

const mockStoryboard = {
  id: 1,
  title: 'Test Storyboard',
  scenes: [
    {
      id: 1,
      title: 'Scene 1',
      sequence: 1,
      content: { duration: 60 },
      visual_effects: [],
      audio_tracks: [],
    },
  ],
};

const renderWithTheme = ui => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('StoryboardEditor', () => {
  const mockHookReturn = {
    storyboard: mockStoryboard,
    loading: false,
    error: null,
    currentTime: 0,
    isPlaying: false,
    selectedSceneId: null,
    addScene: jest.fn(),
    updateScene: jest.fn(),
    reorderScenes: jest.fn(),
    addVisualEffect: jest.fn(),
    addAudioTrack: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seek: jest.fn(),
    selectScene: jest.fn(),
    connected: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useStoryboard.mockReturnValue(mockHookReturn);
  });

  it('renders loading state', () => {
    useStoryboard.mockReturnValue({
      ...mockHookReturn,
      loading: true,
      storyboard: null,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useStoryboard.mockReturnValue({
      ...mockHookReturn,
      error: 'Failed to load storyboard',
      storyboard: null,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Failed to load storyboard')).toBeInTheDocument();
  });

  it('renders storyboard content', () => {
    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Test Storyboard')).toBeInTheDocument();
    expect(screen.getByTestId('scene-manager')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-controls')).toBeInTheDocument();
  });

  it('handles play/pause', () => {
    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    const playButton = screen.getByTitle('Play');
    fireEvent.click(playButton);
    expect(mockHookReturn.play).toHaveBeenCalled();

    useStoryboard.mockReturnValue({
      ...mockHookReturn,
      isPlaying: true,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    const pauseButton = screen.getByTitle('Pause');
    fireEvent.click(pauseButton);
    expect(mockHookReturn.pause).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', () => {
    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    fireEvent.keyDown(window, { key: ' ' });
    expect(mockHookReturn.play).toHaveBeenCalled();

    useStoryboard.mockReturnValue({
      ...mockHookReturn,
      isPlaying: true,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    fireEvent.keyDown(window, { key: ' ' });
    expect(mockHookReturn.pause).toHaveBeenCalled();
  });

  it('shows disconnected warning', () => {
    useStoryboard.mockReturnValue({
      ...mockHookReturn,
      connected: false,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Disconnected from server')).toBeInTheDocument();
  });

  it('displays selected scene preview', () => {
    useStoryboard.mockReturnValue({
      ...mockHookReturn,
      selectedSceneId: 1,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Scene Preview')).toBeInTheDocument();
    expect(screen.getByText('Selected Scene: 1')).toBeInTheDocument();
  });
});

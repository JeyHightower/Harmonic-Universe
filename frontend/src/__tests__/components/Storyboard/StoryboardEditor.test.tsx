import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { StoryboardEditor } from '../../../components/Storyboard/StoryboardEditor';
import { useStoryboard } from '../../../hooks/useStoryboard';
import { theme } from '../../../theme';

// Mock dependencies
jest.mock('../../../hooks/useStoryboard');

const mockStoryboard = {
  id: 1,
  universe_id: 1,
  title: 'Test Storyboard',
  description: 'Test Description',
  metadata: {},
  scenes: [
    {
      id: 1,
      title: 'Scene 1',
      sequence: 1,
      content: { duration: 5 },
      visual_effects: [],
      audio_tracks: [],
    },
  ],
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('StoryboardEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (useStoryboard as jest.Mock).mockReturnValue({
      loading: true,
      error: null,
      storyboard: null,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: 'Failed to load storyboard',
      storyboard: null,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Failed to load storyboard')).toBeInTheDocument();
  });

  it('renders storyboard content', () => {
    const mockPlay = jest.fn();
    const mockPause = jest.fn();

    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: false,
      selectedSceneId: null,
      play: mockPlay,
      pause: mockPause,
      connected: true,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Test Storyboard')).toBeInTheDocument();
    expect(screen.getByTitle('Play')).toBeInTheDocument();
  });

  it('handles play/pause', () => {
    const mockPlay = jest.fn();
    const mockPause = jest.fn();

    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: false,
      selectedSceneId: null,
      play: mockPlay,
      pause: mockPause,
      connected: true,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    fireEvent.click(screen.getByTitle('Play'));
    expect(mockPlay).toHaveBeenCalled();

    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: true,
      selectedSceneId: null,
      play: mockPlay,
      pause: mockPause,
      connected: true,
    });

    fireEvent.click(screen.getByTitle('Pause'));
    expect(mockPause).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', () => {
    const mockPlay = jest.fn();
    const mockPause = jest.fn();

    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: false,
      selectedSceneId: null,
      play: mockPlay,
      pause: mockPause,
      connected: true,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    fireEvent.keyDown(window, { key: ' ' });
    expect(mockPlay).toHaveBeenCalled();

    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: true,
      selectedSceneId: null,
      play: mockPlay,
      pause: mockPause,
      connected: true,
    });

    fireEvent.keyDown(window, { key: ' ' });
    expect(mockPause).toHaveBeenCalled();
  });

  it('shows disconnected warning', () => {
    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: false,
      selectedSceneId: null,
      connected: false,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Disconnected from server')).toBeInTheDocument();
  });

  it('displays selected scene preview', () => {
    (useStoryboard as jest.Mock).mockReturnValue({
      loading: false,
      error: null,
      storyboard: mockStoryboard,
      currentTime: 0,
      isPlaying: false,
      selectedSceneId: 1,
      connected: true,
    });

    renderWithTheme(<StoryboardEditor universeId={1} storyboardId={1} />);

    expect(screen.getByText('Scene Preview')).toBeInTheDocument();
    expect(screen.getByText('Selected Scene: 1')).toBeInTheDocument();
  });
});

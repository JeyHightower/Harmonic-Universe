import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { StoryboardEditor } from '../../../components/Storyboard/StoryboardEditor';
import { useStoryboard } from '../../../hooks/useStoryboard';
import { theme } from '../../../theme';
import { rest } from 'msw';
import { mockScene, mockStoryboard } from '../../fixtures/testData';
import { renderWithProviders } from '../../../utils/test-utils';
import { server } from '../../../mocks/server';

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
  const defaultProps = {
    universeId: 1,
    storyboardId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up MSW handlers for the storyboard and scenes
    server.use(
      rest.get('/api/storyboards/:storyboardId', (req, res, ctx) => {
        return res(ctx.json(mockStoryboard));
      }),
      rest.get('/api/storyboards/:storyboardId/scenes', (req, res, ctx) => {
        return res(ctx.json([mockScene]));
      })
    );
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

  it('renders storyboard editor with scenes', async () => {
    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(mockScene.title)).toBeInTheDocument();
    });
    expect(screen.getByText('Add Scene')).toBeInTheDocument();
  });

  it('opens create scene dialog when clicking add scene button', async () => {
    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    fireEvent.click(screen.getByText('Add Scene'));

    await waitFor(() => {
      expect(screen.getByText('Create New Scene')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });
  });

  it('creates a new scene', async () => {
    server.use(
      rest.post('/api/storyboards/:storyboardId/scenes', (req, res, ctx) => {
        return res(ctx.status(201), ctx.json({ ...mockScene, id: 2 }));
      })
    );

    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    // Open create dialog
    fireEvent.click(screen.getByText('Add Scene'));

    // Fill in form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New Scene' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('New Scene')).toBeInTheDocument();
    });
  });

  it('updates an existing scene', async () => {
    const updatedScene = { ...mockScene, title: 'Updated Scene' };
    server.use(
      rest.put('/api/scenes/:sceneId', (req, res, ctx) => {
        return res(ctx.json(updatedScene));
      })
    );

    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    // Wait for scene to load
    await waitFor(() => {
      expect(screen.getByText(mockScene.title)).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByLabelText('Edit Scene'));

    // Update title
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated Scene' },
    });

    // Save changes
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Updated Scene')).toBeInTheDocument();
    });
  });

  it('deletes a scene', async () => {
    server.use(
      rest.delete('/api/scenes/:sceneId', (req, res, ctx) => {
        return res(ctx.status(204));
      })
    );

    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    // Wait for scene to load
    await waitFor(() => {
      expect(screen.getByText(mockScene.title)).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByLabelText('Delete Scene'));

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.queryByText(mockScene.title)).not.toBeInTheDocument();
    });
  });

  it('reorders scenes using drag and drop', async () => {
    const scenes = [
      mockScene,
      { ...mockScene, id: 2, title: 'Scene 2', sequence_number: 2 },
    ];

    server.use(
      rest.get('/api/storyboards/:storyboardId/scenes', (req, res, ctx) => {
        return res(ctx.json(scenes));
      }),
      rest.put('/api/storyboards/:storyboardId/scenes/reorder', (req, res, ctx) => {
        return res(ctx.json(scenes.reverse()));
      })
    );

    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    // Wait for scenes to load
    await waitFor(() => {
      expect(screen.getByText('Scene 2')).toBeInTheDocument();
    });

    // Simulate drag and drop
    const firstScene = screen.getByText(mockScene.title);
    const secondScene = screen.getByText('Scene 2');

    fireEvent.dragStart(firstScene);
    fireEvent.dragOver(secondScene);
    fireEvent.drop(secondScene);

    await waitFor(() => {
      const sceneElements = screen.getAllByRole('listitem');
      expect(sceneElements[0]).toHaveTextContent('Scene 2');
      expect(sceneElements[1]).toHaveTextContent(mockScene.title);
    });
  });

  it('handles errors when creating a scene', async () => {
    server.use(
      rest.post('/api/storyboards/:storyboardId/scenes', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ error: 'Title is required' }));
      })
    );

    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    // Open create dialog
    fireEvent.click(screen.getByText('Add Scene'));

    // Submit form without title
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    server.use(
      rest.get('/api/storyboards/:storyboardId/scenes', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<StoryboardEditor {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading scenes/i)).toBeInTheDocument();
    });
  });
});

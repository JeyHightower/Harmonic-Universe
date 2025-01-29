import { act, renderHook } from '@testing-library/react-hooks';
import { useStoryboard } from '../../hooks/useStoryboard';
import { useUniverseSocket } from '../../hooks/useUniverseSocket';
import api from '../../services/api';

// Mock dependencies
jest.mock('../../hooks/useUniverseSocket');
jest.mock('../../services/api');

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

describe('useStoryboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUniverseSocket as jest.Mock).mockReturnValue({
      socket: { emit: jest.fn() },
      connected: true,
    });
  });

  it('fetches storyboard data on mount', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStoryboard });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    expect(result.current.loading).toBe(true);
    expect(result.current.storyboard).toBe(null);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.storyboard).toEqual(mockStoryboard);
    expect(api.get).toHaveBeenCalledWith('/storyboards/1');
  });

  it('handles fetch error', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load storyboard');
  });

  it('adds a new scene', async () => {
    const newScene = {
      id: 2,
      title: 'New Scene',
      sequence: 2,
      content: { duration: 5 },
      visual_effects: [],
      audio_tracks: [],
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStoryboard });
    (api.post as jest.Mock).mockResolvedValueOnce({ data: newScene });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    await act(async () => {
      await result.current.addScene('New Scene');
    });

    expect(result.current.storyboard?.scenes).toHaveLength(2);
    expect(result.current.storyboard?.scenes[1]).toEqual(newScene);
  });

  it('updates scene order', async () => {
    const reorderedScenes = [
      {
        id: 2,
        title: 'Scene 2',
        sequence: 1,
        content: { duration: 5 },
        visual_effects: [],
        audio_tracks: [],
      },
      {
        id: 1,
        title: 'Scene 1',
        sequence: 2,
        content: { duration: 5 },
        visual_effects: [],
        audio_tracks: [],
      },
    ];

    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { ...mockStoryboard, scenes: reorderedScenes.slice().reverse() },
    });
    (api.put as jest.Mock).mockResolvedValueOnce({ data: reorderedScenes });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    await act(async () => {
      await result.current.reorderScenes([2, 1]);
    });

    expect(result.current.storyboard?.scenes).toEqual(reorderedScenes);
  });

  it('adds visual effect to scene', async () => {
    const newEffect = {
      id: 1,
      effect_type: 'particle',
      parameters: { speed: 1 },
      start_time: 0,
      duration: 5,
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStoryboard });
    (api.post as jest.Mock).mockResolvedValueOnce({ data: newEffect });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    await act(async () => {
      await result.current.addVisualEffect(1, {
        effect_type: 'particle',
        parameters: { speed: 1 },
        start_time: 0,
        duration: 5,
      });
    });

    expect(result.current.storyboard?.scenes[0].visual_effects[0]).toEqual(
      newEffect
    );
  });

  it('adds audio track to scene', async () => {
    const newTrack = {
      id: 1,
      track_type: 'music',
      parameters: { volume: 1 },
      start_time: 0,
      duration: 5,
      volume: 1,
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStoryboard });
    (api.post as jest.Mock).mockResolvedValueOnce({ data: newTrack });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    await act(async () => {
      await result.current.addAudioTrack(1, {
        track_type: 'music',
        parameters: { volume: 1 },
        start_time: 0,
        duration: 5,
        volume: 1,
      });
    });

    expect(result.current.storyboard?.scenes[0].audio_tracks[0]).toEqual(
      newTrack
    );
  });

  it('manages playback state', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStoryboard });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    act(() => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.seek(5);
    });
    expect(result.current.currentTime).toBe(5);
  });

  it('selects scene', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStoryboard });

    const { result, waitForNextUpdate } = renderHook(() => useStoryboard(1, 1));

    await waitForNextUpdate();

    act(() => {
      result.current.selectScene(1);
    });

    expect(result.current.selectedSceneId).toBe(1);
  });
});

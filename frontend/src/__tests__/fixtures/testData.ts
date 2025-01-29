export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

export const mockUniverse = {
  id: 1,
  user_id: 1,
  title: 'Test Universe',
  description: 'Test Description',
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockStoryboard = {
  id: 1,
  universe_id: 1,
  title: 'Test Storyboard',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockScene = {
  id: 1,
  storyboard_id: 1,
  sequence_number: 1,
  title: 'Test Scene',
  content: 'Test Content',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockVisualEffect = {
  id: 1,
  scene_id: 1,
  effect_type: 'fade',
  parameters: { duration: 1000 },
  start_time: 0,
  end_time: 1000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockAudioTrack = {
  id: 1,
  scene_id: 1,
  audio_url: 'https://example.com/audio.mp3',
  volume: 1.0,
  start_time: 0,
  end_time: 5000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockInitialState = {
  auth: {
    user: null,
    isLoading: false,
    error: null,
  },
  universe: {
    universes: [],
    currentUniverse: null,
    isLoading: false,
    error: null,
  },
  storyboard: {
    storyboards: [],
    currentStoryboard: null,
    isLoading: false,
    error: null,
  },
  scene: {
    scenes: [],
    currentScene: null,
    isLoading: false,
    error: null,
  },
  mediaEffect: {
    visualEffects: [],
    audioTracks: [],
    isLoading: false,
    error: null,
  },
};


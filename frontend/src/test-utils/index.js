import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../store/slices/authSlice';
import mediaEffectReducer from '../store/slices/mediaEffectSlice';
import sceneReducer from '../store/slices/sceneSlice';
import storyboardReducer from '../store/slices/storyboardSlice';
import uiReducer from '../store/slices/uiSlice';
import universeReducer from '../store/slices/universeSlice';
import theme from '../theme';

function render(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
        storyboard: storyboardReducer,
        scene: sceneReducer,
        mediaEffect: mediaEffectReducer,
        ui: uiReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockUniverse = (overrides = {}) => ({
  id: 1,
  name: 'Test Universe',
  description: 'A test universe',
  user_id: 1,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockStoryboard = (overrides = {}) => ({
  id: 1,
  title: 'Test Storyboard',
  description: 'A test storyboard',
  universe_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockScene = (overrides = {}) => ({
  id: 1,
  title: 'Test Scene',
  sequence: 1,
  content: {},
  storyboard_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockVisualEffect = (overrides = {}) => ({
  id: 1,
  name: 'Test Effect',
  effect_type: 'fade',
  parameters: { duration: 2.0, opacity: 0.5 },
  scene_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAudioTrack = (overrides = {}) => ({
  id: 1,
  name: 'Test Track',
  track_type: 'background',
  file_path: '/path/to/audio.mp3',
  parameters: { volume: 0.8, loop: true },
  scene_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Mock API response creators
export const createMockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
});

export const createMockErrorResponse = (status = 400, message = 'Error') => ({
  ok: false,
  status,
  json: () => Promise.resolve({ message }),
});

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { render };

import { configureStore } from '@reduxjs/toolkit'
import { render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import rootReducer from '../store/reducers'

function render(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    )
  }
  return {
    store,
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { render }

// Test data generators
export const createTestUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  ...overrides
})

export const createTestUniverse = (overrides = {}) => ({
  id: 1,
  name: 'Test Universe',
  description: 'A test universe',
  user_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestStoryboard = (overrides = {}) => ({
  id: 1,
  name: 'Test Storyboard',
  description: 'A test storyboard',
  universe_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestScene = (overrides = {}) => ({
  id: 1,
  name: 'Test Scene',
  description: 'A test scene',
  sequence: 0,
  content: { layout: 'grid', elements: [] },
  storyboard_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestVisualEffect = (overrides = {}) => ({
  id: 1,
  name: 'Test Effect',
  effect_type: 'particle',
  parameters: { speed: 1.0, size: 2.0 },
  scene_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestAudioTrack = (overrides = {}) => ({
  id: 1,
  name: 'Test Track',
  track_type: 'background',
  file_path: 'audio/test.mp3',
  parameters: { volume: 0.8, loop: true },
  scene_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

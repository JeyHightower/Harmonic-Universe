import { ThemeProvider } from '@mui/material/styles';
import type { PreloadedState } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { theme } from '../theme';

// Import your reducers
import authReducer from '../store/slices/authSlice';
import mediaEffectReducer from '../store/slices/mediaEffectSlice';
import sceneReducer from '../store/slices/sceneSlice';
import storyboardReducer from '../store/slices/storyboardSlice';
import universeReducer from '../store/slices/universeSlice';

// Import the RootState type
import type { RootState } from '../store/store';

// Create the root reducer
const rootReducer = {
  auth: authReducer,
  universe: universeReducer,
  storyboard: storyboardReducer,
  scene: sceneReducer,
  mediaEffect: mediaEffectReducer,
};

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof configureStore>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
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

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Custom test hooks
export function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

// Test helpers
export function createMockApiResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

export function createMockApiError(message: string, status = 400) {
  return {
    ok: false,
    status,
    json: async () => ({ error: message }),
  };
}

// re-export everything
export * from '@testing-library/react';
// override render method
export { render };


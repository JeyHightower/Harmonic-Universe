import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import authReducer from '../../store/slices/authSlice';
import universeReducer from '../../store/slices/universeSlice';
import userReducer from '../../store/slices/userSlice';

export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
        user: userReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

export const mockAuthState = {
  auth: {
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    },
    token: 'mock-token',
    isAuthenticated: true,
    loading: false,
  },
};

export const mockUniverseState = {
  universe: {
    universes: [
      {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
        is_public: true,
        creator_id: 1,
      },
    ],
    currentUniverse: null,
    loading: false,
    error: null,
  },
};

export const mockUserState = {
  user: {
    profile: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
    },
    loading: false,
    error: null,
  },
};

export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      universe: universeReducer,
      user: userReducer,
    },
    preloadedState: initialState,
  });
};

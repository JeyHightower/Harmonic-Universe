import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import authReducer from "../../store/slices/authSlice";
import universeReducer from "../../store/slices/universeSlice";
import userReducer from "../../store/slices/userSlice";

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
  } = {},
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

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  is_active: true,
  is_admin: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockUniverse = (overrides = {}) => ({
  id: 1,
  name: "Test Universe",
  description: "Test Description",
  is_public: false,
  allow_guests: false,
  creator_id: 1,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
  id: 1,
  user_id: 1,
  bio: "Test Bio",
  location: "Test Location",
  website: null,
  avatar_url: null,
  social_links: {},
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

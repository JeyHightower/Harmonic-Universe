import { ThemeProvider, createTheme } from "@mui/material";
import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import universeReducer from "../store/slices/universeSlice";

const theme = createTheme({
  palette: {
    mode: "light",
  },
});

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        universe: universeReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>{children}</BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock response creator
export const createMockApiResponse = (data, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
};

// Mock error response creator
export const createMockErrorResponse = (status = 400, message = "Error") => {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  };
};

// Helper to wait for async operations
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock data generators
export const createMockUniverse = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: "Test Universe",
  description: "A test universe description",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  username: "testuser",
  email: "test@example.com",
  ...overrides,
});

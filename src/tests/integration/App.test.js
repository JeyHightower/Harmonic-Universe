import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { authReducer } from '../../redux/slices/authSlice';
import { universeReducer } from '../../redux/slices/universeSlice';

describe('App Integration Tests', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: false,
          user: null,
          error: null,
        },
        universe: {
          universes: [],
          currentUniverse: null,
          error: null,
        },
      },
    });

    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form when not authenticated', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows signup link and navigates to signup form', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    fireEvent.click(signupLink);
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Invalid credentials'))
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('redirects to dashboard after successful login', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: mockUser, token: 'fake-token' }),
      })
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  test('shows universe list when authenticated', async () => {
    const mockUniverses = [
      { id: 1, name: 'Test Universe', description: 'A test universe' },
    ];
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUniverses),
      })
    );

    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          error: null,
        },
        universe: {
          universes: [],
          currentUniverse: null,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Universe')).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching data', async () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));

    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          error: null,
        },
        universe: {
          universes: [],
          currentUniverse: null,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import authReducer from '../../redux/slices/authSlice';
import universeReducer from '../../redux/slices/universeSlice';

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
          loading: false,
          error: null,
        },
        universe: {
          universes: [],
          currentUniverse: null,
          loading: false,
          error: null,
        },
      },
    });

    // Mock fetch globally
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form when not authenticated', () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  test('shows signup link and navigates to signup form', () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    const signupLink = screen.getByText(/sign up/i);
    expect(signupLink).toBeInTheDocument();
    fireEvent.click(signupLink);
    expect(
      screen.getByRole('heading', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      })
    );

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('redirects to dashboard after successful login', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: 1, email: 'test@example.com' },
            token: 'fake-token',
          }),
      })
    );

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
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
    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, email: 'test@example.com' },
          loading: false,
          error: null,
        },
        universe: {
          universes: [
            { id: 1, name: 'Test Universe', description: 'A test universe' },
          ],
          currentUniverse: null,
          loading: false,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/test universe/i)).toBeInTheDocument();
  });

  test('shows loading state while fetching data', async () => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
      },
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, email: 'test@example.com' },
          loading: true,
          error: null,
        },
        universe: {
          universes: [],
          currentUniverse: null,
          loading: true,
          error: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

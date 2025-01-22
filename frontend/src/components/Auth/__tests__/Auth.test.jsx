import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';
import Register from '../Register';
import ResetPassword from '../ResetPassword';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Authentication Components', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: (
          state = {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          },
          action
        ) => state,
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = component => {
    return render(
      <Provider store={store}>
        <BrowserRouter>{component}</BrowserRouter>
      </Provider>
    );
  };

  describe('Login Component', () => {
    it('renders login form correctly', () => {
      renderWithProviders(<Login />);
      expect(screen.getByTestId('login-container')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
    });

    it('handles form validation', async () => {
      renderWithProviders(<Login />);
      const submitButton = screen.getByTestId('login-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByTestId('password-error')).toBeInTheDocument();
      });
    });

    it('handles successful login', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles login error', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          auth: (
            state = {
              error: 'Invalid credentials',
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<Login />);
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toHaveTextContent(
          'Invalid credentials'
        );
      });
    });
  });

  describe('Register Component', () => {
    it('renders register form correctly', () => {
      renderWithProviders(<Register />);
      expect(screen.getByTestId('register-container')).toBeInTheDocument();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-button')).toBeInTheDocument();
    });

    it('validates matching passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(
        screen.getByTestId('confirm-password-input'),
        'password124'
      );
      await user.click(screen.getByTestId('register-button'));

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('handles successful registration', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByTestId('username-input'), 'testuser');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(
        screen.getByTestId('confirm-password-input'),
        'password123'
      );
      await user.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles registration error', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          auth: (
            state = {
              error: 'Email already exists',
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<Register />);
      await user.type(screen.getByTestId('username-input'), 'testuser');
      await user.type(
        screen.getByTestId('email-input'),
        'existing@example.com'
      );
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(
        screen.getByTestId('confirm-password-input'),
        'password123'
      );
      await user.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Reset Password Component', () => {
    it('renders reset password form correctly', () => {
      renderWithProviders(<ResetPassword />);
      expect(
        screen.getByTestId('reset-password-container')
      ).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    it('handles successful password reset request', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ResetPassword />);

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.getByText('Reset instructions sent')).toBeInTheDocument();
      });
    });

    it('handles reset password error', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          auth: (
            state = {
              error: 'Email not found',
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<ResetPassword />);
      await user.type(
        screen.getByTestId('email-input'),
        'nonexistent@example.com'
      );
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument();
      });
    });

    it('redirects to login after successful reset request', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ResetPassword />);

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Authentication Flow Integration', () => {
    it('maintains authentication state across navigation', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          auth: (
            state = {
              isAuthenticated: true,
              user: { id: 1, username: 'testuser' },
            },
            action
          ) => state,
        },
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/login']}>
            <Login />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles session expiration', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          auth: (
            state = {
              isAuthenticated: false,
              error: 'Session expired',
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<Login />);
      expect(screen.getByText('Session expired')).toBeInTheDocument();
    });
  });
});

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

// Mock useNavigate first
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Create mock auth service instance
const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  getToken: vi.fn(),
  isAuthenticated: vi.fn(),
};

// Mock the auth service with a proper implementation
vi.mock('../authService', () => ({
  authService: mockAuthService,
}));

// Import components and services after mocking
import { authReducer } from '../authSlice';
import Login from '../Login';
import Register from '../Register';
import ResetPassword from '../ResetPassword';

const renderWithProviders = ({
  preloadedState = {},
  initialPath = '/',
} = {}) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState,
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  };
};

describe('Auth Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Login component renders correctly', () => {
    renderWithProviders();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  test('validates form fields', async () => {
    renderWithProviders();
    const user = userEvent.setup();
    const loginButton = screen.getByTestId('login-button');

    await user.click(loginButton);
    expect(screen.getByTestId('email-error')).toHaveTextContent(
      'Email is required'
    );
    expect(screen.getByTestId('password-error')).toHaveTextContent(
      'Password is required'
    );
  });

  test('handles successful login', async () => {
    mockAuthService.login.mockResolvedValueOnce({
      user: { id: 1, email: 'test@example.com' },
      token: 'fake-token',
    });

    const { store } = renderWithProviders();
    const user = userEvent.setup();

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(store.getState().auth.user).toBeTruthy();
      expect(store.getState().auth.token).toBe('fake-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login error', async () => {
    mockAuthService.login.mockRejectedValueOnce({
      message: 'Invalid credentials',
      type: 'INVALID_CREDENTIALS',
      severity: 'LOW',
      details: [],
    });

    renderWithProviders();
    const user = userEvent.setup();

    await user.type(screen.getByTestId('email-input'), 'invalid@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpassword');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'Invalid credentials'
      );
    });
  });

  describe('Register Component', () => {
    test('renders register form correctly', () => {
      renderWithProviders({ initialPath: '/register' });
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-button')).toBeInTheDocument();
    });

    test('validates matching passwords', async () => {
      renderWithProviders({ initialPath: '/register' });
      const user = userEvent.setup();

      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(
        screen.getByTestId('confirm-password-input'),
        'password456'
      );
      await user.click(screen.getByTestId('register-button'));

      expect(screen.getByTestId('confirm-password-error')).toHaveTextContent(
        'Passwords do not match'
      );
    });

    test('handles successful registration', async () => {
      mockAuthService.register.mockResolvedValueOnce({
        user: { id: 1, email: 'test@example.com' },
        token: 'fake-token',
      });

      renderWithProviders({ initialPath: '/register' });
      const user = userEvent.setup();

      await user.type(screen.getByTestId('username-input'), 'testuser');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(
        screen.getByTestId('confirm-password-input'),
        'password123'
      );
      await user.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('handles registration error', async () => {
      mockAuthService.register.mockRejectedValueOnce({
        message: 'Email already exists',
        type: 'VALIDATION_ERROR',
        severity: 'LOW',
        details: [{ field: 'email', message: 'Email already exists' }],
      });

      renderWithProviders({ initialPath: '/register' });
      const user = userEvent.setup();

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
        expect(screen.getByTestId('submit-error')).toHaveTextContent(
          'Email already exists'
        );
      });
    });
  });

  describe('Reset Password Component', () => {
    test('renders reset password form correctly', () => {
      renderWithProviders({ initialPath: '/reset-password' });
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    test('handles successful password reset request', async () => {
      mockAuthService.resetPassword.mockResolvedValueOnce({
        message: 'Reset instructions sent',
      });

      renderWithProviders({ initialPath: '/reset-password' });
      const user = userEvent.setup();

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-success')).toHaveTextContent(
          'Reset instructions sent'
        );
      });
    });

    test('handles reset password error', async () => {
      mockAuthService.resetPassword.mockRejectedValueOnce({
        message: 'Email not found',
        type: 'VALIDATION_ERROR',
        severity: 'LOW',
        details: [{ field: 'email', message: 'Email not found' }],
      });

      renderWithProviders({ initialPath: '/reset-password' });
      const user = userEvent.setup();

      await user.type(
        screen.getByTestId('email-input'),
        'nonexistent@example.com'
      );
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toHaveTextContent(
          'Email not found'
        );
      });
    });

    test('redirects to login after successful reset request', async () => {
      mockAuthService.resetPassword.mockResolvedValueOnce({
        message: 'Reset instructions sent',
      });

      renderWithProviders({ initialPath: '/reset-password' });
      const user = userEvent.setup();

      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    test('maintains authentication state across navigation', () => {
      const preloadedState = {
        auth: {
          user: { id: 1, email: 'test@example.com' },
          token: 'fake-token',
          error: null,
        },
      };

      renderWithProviders({ preloadedState });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    test('handles session expiration', () => {
      const preloadedState = {
        auth: {
          user: null,
          token: null,
          error: 'Session expired',
        },
      };

      renderWithProviders({ preloadedState });
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'Session expired'
      );
    });
  });
});

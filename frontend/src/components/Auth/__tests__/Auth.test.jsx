/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Login, Register, ResetPassword } from '..';
import {
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
} from '../../../services/errorLogging.js';
import { authReducer } from '../../../store/slices/authSlice.js';
import Auth from '../Auth';

// Create localStorage mock
const createLocalStorageMock = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Setup test environment
const localStorageMock = createLocalStorageMock();

// Import auth service after environment setup
import { authService } from '../../../services/authService.js';

// Mock the auth service class
vi.mock('../../../services/authService', () => {
  const AuthServiceMock = {
    login: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    refreshToken: vi.fn(),
    getToken: vi.fn(),
    isAuthenticated: vi.fn(),
    handleAuthSuccess: vi.fn(),
    categorizeAuthError: vi.fn(),
    getErrorDetails: vi.fn(),
  };

  // Helper to serialize error
  const serializeError = (error, status) => ({
    message: error.message,
    status,
    timestamp: new Date().toISOString(),
  });

  // Set up default mock implementations
  AuthServiceMock.login.mockImplementation(async credentials => {
    if (
      credentials.email === 'test@example.com' &&
      credentials.password === 'password123'
    ) {
      const response = {
        user: { id: 1, email: 'test@example.com' },
        token: 'fake-token',
      };
      AuthServiceMock.handleAuthSuccess(response);
      return response;
    }

    const error = serializeError(new Error('Invalid credentials'), 401);
    const authError = AuthServiceMock.categorizeAuthError(error);
    throw authError;
  });

  AuthServiceMock.register.mockImplementation(async userData => {
    if (userData.email === 'existing@example.com') {
      const error = serializeError(new Error('Email already exists'), 422);
      const authError = AuthServiceMock.categorizeAuthError(error);
      throw authError;
    }

    const response = {
      user: { id: 1, email: userData.email },
      token: 'fake-token',
    };
    AuthServiceMock.handleAuthSuccess(response);
    return response;
  });

  AuthServiceMock.resetPassword.mockImplementation(async email => {
    if (email === 'nonexistent@example.com') {
      const error = serializeError(new Error('Email not found'), 404);
      const authError = AuthServiceMock.categorizeAuthError(error);
      throw authError;
    }
    return { message: 'Reset instructions sent' };
  });

  AuthServiceMock.getToken.mockImplementation(() => {
    return localStorageMock.getItem('token');
  });

  AuthServiceMock.isAuthenticated.mockImplementation(() => {
    return !!AuthServiceMock.getToken();
  });

  AuthServiceMock.handleAuthSuccess.mockImplementation(data => {
    if (data.token) {
      localStorageMock.setItem('token', data.token);
    }
  });

  AuthServiceMock.categorizeAuthError.mockImplementation(error => {
    const baseError = {
      message: 'An unexpected error occurred',
      type: ERROR_CATEGORIES.SERVER_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      details: [],
    };

    if (!error.status) {
      return {
        ...baseError,
        type: ERROR_CATEGORIES.NETWORK_ERROR,
        message: 'Network error occurred',
        severity: ERROR_SEVERITY.MEDIUM,
      };
    }

    switch (error.status) {
      case 401:
        return {
          ...baseError,
          type: ERROR_CATEGORIES.AUTHENTICATION,
          message: error.message || 'Invalid credentials',
          severity: ERROR_SEVERITY.LOW,
        };
      case 422:
        return {
          ...baseError,
          type: ERROR_CATEGORIES.VALIDATION,
          message: error.message || 'Validation error',
          severity: ERROR_SEVERITY.LOW,
        };
      default:
        return baseError;
    }
  });

  AuthServiceMock.getErrorDetails.mockImplementation(authError => {
    if (authError.details && authError.details.length > 0) {
      return authError.details.join(', ');
    }
    return (
      authError.message ||
      'Please try again or contact support if the issue persists.'
    );
  });

  return {
    authService: AuthServiceMock,
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithProviders = ({
  preloadedState = {},
  store = configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  }),
  initialPath = '/login',
  ...renderOptions
} = {}) => {
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
      renderOptions
    ),
  };
};

const mockStore = configureStore([]);

describe('Auth Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      session: {
        user: null,
        error: null,
      },
    });
  });

  it('renders login form by default', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Auth />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Log In/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  it('switches to signup form when signup link is clicked', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Auth />
        </BrowserRouter>
      </Provider>
    );

    const signupLink = screen.getByText(/Sign Up/i);
    fireEvent.click(signupLink);

    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
  });
});

describe('Auth Components', () => {
  beforeAll(() => {
    // Set up localStorage mock
    vi.stubGlobal('localStorage', localStorageMock);

    // Set up CustomEvent mock
    vi.stubGlobal(
      'CustomEvent',
      class CustomEvent {
        constructor(event, params) {
          this.type = event;
          this.detail = params?.detail;
        }
      }
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    localStorageMock.clear();
  });

  it('Login component renders correctly', () => {
    renderWithProviders();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const submitButton = screen.getByTestId('login-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Email is required'
      );
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password is required'
      );
    });
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders();

    // Mock successful login
    const mockResponse = {
      token: 'fake-token',
      user: { id: 1, email: 'test@example.com' },
    };
    authService.login.mockResolvedValueOnce(mockResponse);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(store.getState().auth.user).toBeTruthy();
      expect(store.getState().auth.token).toBe('fake-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'token',
        'fake-token'
      );
    });
  });

  it('handles login error', async () => {
    const user = userEvent.setup();

    // Mock failed login
    authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithProviders();
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
    it('renders register form correctly', () => {
      renderWithProviders({ initialPath: '/register' });
      expect(screen.getByTestId('register-container')).toBeInTheDocument();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-button')).toBeInTheDocument();
    });

    it('validates matching passwords', async () => {
      const user = userEvent.setup();
      renderWithProviders({ initialPath: '/register' });

      await user.type(screen.getByTestId('username-input'), 'testuser');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.type(
        screen.getByTestId('confirm-password-input'),
        'password124'
      );
      await user.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-password-error')).toHaveTextContent(
          'Passwords do not match'
        );
      });
    });

    it('handles successful registration', async () => {
      const user = userEvent.setup();

      // Mock successful registration
      authService.register.mockResolvedValueOnce({
        token: 'fake-token',
        user: { id: 1, email: 'test@example.com' },
      });

      renderWithProviders({ initialPath: '/register' });
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

    it('handles registration error', async () => {
      const user = userEvent.setup();

      // Mock failed registration
      authService.register.mockRejectedValueOnce(
        new Error('Email already exists')
      );

      renderWithProviders({ initialPath: '/register' });
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
    it('renders reset password form correctly', () => {
      renderWithProviders({ initialPath: '/reset-password' });
      expect(
        screen.getByTestId('reset-password-container')
      ).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    it('handles successful password reset request', async () => {
      const user = userEvent.setup();

      // Mock successful password reset
      authService.resetPassword.mockResolvedValueOnce({
        message: 'Reset instructions sent',
      });

      renderWithProviders({ initialPath: '/reset-password' });
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-success')).toHaveTextContent(
          'Reset instructions sent'
        );
      });
    });

    it('handles reset password error', async () => {
      const user = userEvent.setup();

      // Mock failed password reset
      authService.resetPassword.mockRejectedValueOnce(
        new Error('Email not found')
      );

      renderWithProviders({ initialPath: '/reset-password' });
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

    it('redirects to login after successful reset request', async () => {
      const user = userEvent.setup();

      // Mock successful password reset
      authService.resetPassword.mockResolvedValueOnce({
        message: 'Reset instructions sent',
      });

      renderWithProviders({ initialPath: '/reset-password' });
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    it('maintains authentication state across navigation', async () => {
      const preloadedState = {
        auth: {
          user: { id: 1, email: 'test@example.com' },
          token: 'fake-token',
        },
      };

      renderWithProviders({ preloadedState });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('handles session expiration', async () => {
      const preloadedState = {
        auth: {
          error: 'Session expired',
          user: null,
          token: null,
        },
      };

      renderWithProviders({ preloadedState });
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'Session expired'
      );
    });
  });
});

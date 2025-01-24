/**
 * @vitest-environment jsdom
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, vi } from 'vitest';
import Login from '../../pages/Login';
import Register from '../../pages/Register';
import { mockAuthState, renderWithProviders } from '../setup/test-utils';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        user: mockAuthState.auth.user,
        token: mockAuthState.auth.token,
      })
    );
  }),
  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        user: mockAuthState.auth.user,
        token: mockAuthState.auth.token,
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockNavigate.mockClear();
});
afterAll(() => server.close());

describe('Authentication Flow', () => {
  describe('Login', () => {
    it('should render login form', () => {
      renderWithProviders(<Login />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /login/i })
      ).toBeInTheDocument();
    });

    it('should handle successful login', async () => {
      const mockDispatch = vi.fn(() => ({
        unwrap: () =>
          Promise.resolve({
            user: mockAuthState.auth.user,
            token: mockAuthState.auth.token,
          }),
      }));
      const { store } = renderWithProviders(<Login />);
      store.dispatch = mockDispatch;

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid credentials/i)
        ).not.toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      const mockDispatch = vi.fn(() => ({
        unwrap: () => Promise.reject(mockError),
      }));
      const { store } = renderWithProviders(<Login />);
      store.dispatch = mockDispatch;

      renderWithProviders(<Login />);

      await userEvent.type(
        screen.getByLabelText(/email/i),
        'wrong@example.com'
      );
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const mockDispatch = vi.fn(() => ({
        unwrap: () => new Promise(() => {}), // Never resolves to keep loading state
      }));
      const { store } = renderWithProviders(<Login />);
      store.dispatch = mockDispatch;

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      expect(
        screen.getByRole('button', { name: /logging in\.\.\./i })
      ).toBeDisabled();
    });
  });

  describe('Register', () => {
    it('should render register form', () => {
      renderWithProviders(<Register />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /register/i })
      ).toBeInTheDocument();
    });

    it('should handle successful registration', async () => {
      const mockDispatch = vi.fn(() => ({
        unwrap: () =>
          Promise.resolve({
            user: mockAuthState.auth.user,
            token: mockAuthState.auth.token,
          }),
      }));
      const { store } = renderWithProviders(<Register />);
      store.dispatch = mockDispatch;

      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(
          screen.queryByText(/email already exists/i)
        ).not.toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle registration error', async () => {
      const mockError = new Error('Email already exists');
      const mockDispatch = vi.fn(() => ({
        unwrap: () => Promise.reject(mockError),
      }));
      const { store } = renderWithProviders(<Register />);
      store.dispatch = mockDispatch;

      renderWithProviders(<Register />);

      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(
        screen.getByLabelText(/email/i),
        'existing@example.com'
      );
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const mockDispatch = vi.fn(() => ({
        unwrap: () => new Promise(() => {}), // Never resolves to keep loading state
      }));
      const { store } = renderWithProviders(<Register />);
      store.dispatch = mockDispatch;

      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /register/i }));

      expect(
        screen.getByRole('button', { name: /registering\.\.\./i })
      ).toBeDisabled();
    });
  });
});

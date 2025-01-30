import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as authService from '../../../services/authService';
import { createMockApiResponse, createMockErrorResponse, createMockUser, render } from '../../../test-utils';
import Login from '../Login';

// Mock the auth service
jest.mock('../../../services/authService');

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser = createMockUser();
    const mockResponse = createMockApiResponse({ user: mockUser, token: 'test-token' });
    authService.login.mockResolvedValueOnce(mockResponse);

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message on login failure', async () => {
    const mockError = createMockErrorResponse(401, 'Invalid credentials');
    authService.login.mockRejectedValueOnce(mockError);

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('navigates to register page when clicking signup link', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(<Login />);
    fireEvent.click(screen.getByText(/sign up/i));

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('disables submit button while loading', async () => {
    authService.login.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    });
  });
});

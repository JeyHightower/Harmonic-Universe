import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginForm } from '../../../components/Auth/LoginForm';
import { useAuth } from '../../../hooks/useAuth';

// Mock the auth hook
jest.mock('../../../hooks/useAuth');

describe('LoginForm', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      login: jest.fn(),
      error: null,
      loading: false,
    });
  });

  it('renders login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockLogin = jest.fn();
    useAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      loading: false,
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays validation errors', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays error message from auth hook', () => {
    useAuth.mockReturnValue({
      login: jest.fn(),
      error: 'Invalid credentials',
      loading: false,
    });

    render(<LoginForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('disables form submission while loading', () => {
    useAuth.mockReturnValue({
      login: jest.fn(),
      error: null,
      loading: true,
    });

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
  });
});

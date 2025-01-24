import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../../pages/Login';
import Profile from '../../pages/Profile';
import Register from '../../pages/Register';
import authReducer from '../../store/slices/authSlice';

describe('Authentication and Profile Features', () => {
  const mockStore = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      },
    },
  });

  // Mock fetch for API calls
  global.fetch = vi.fn();

  beforeEach(() => {
    fetch.mockReset();
  });

  describe('Authentication', () => {
    test('handles login flow with success and error cases', async () => {
      render(
        <Provider store={mockStore}>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Initial render
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Try Demo Account')).toBeInTheDocument();

      // Test validation
      const loginButton = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(loginButton);
      expect(screen.getByText('Email is required')).toBeInTheDocument();

      // Test error case
      fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Invalid credentials'))
      );

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Test success case
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: { id: 1, email: 'test@example.com' },
            token: 'fake-token'
          }),
        })
      );

      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });

    test('handles registration flow with validation', async () => {
      render(
        <Provider store={mockStore}>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Register />} />
              <Route path="/login" element={<div>Login</div>} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Test validation
      const registerButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(registerButton);
      expect(screen.getByText('Username is required')).toBeInTheDocument();

      // Fill form with valid data
      fireEvent.change(screen.getByPlaceholderText('Username'), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
        target: { value: 'Password123!' },
      });

      // Test successful registration
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Registration successful' }),
        })
      );

      fireEvent.click(registerButton);
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });
  });

  describe('Profile Management', () => {
    const authenticatedStore = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            bio: 'Original bio',
            avatar_url: null,
          },
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      },
    });

    test('handles profile updates and settings management', async () => {
      render(
        <Provider store={authenticatedStore}>
          <MemoryRouter>
            <Routes>
              <Route path="/" element={<Profile />} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );

      // Initial render
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();

      // Edit profile
      fireEvent.click(screen.getByText('Edit Profile'));

      const bioInput = screen.getByPlaceholderText('Tell us about yourself...');
      fireEvent.change(bioInput, { target: { value: 'Updated bio' } });

      // Mock successful update
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              ...authenticatedStore.getState().auth.user,
              bio: 'Updated bio',
            },
          }),
        })
      );

      fireEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });

      // Test theme toggle
      const themeSwitch = screen.getByRole('checkbox', { name: /Dark Mode/i });
      fireEvent.click(themeSwitch);
      expect(themeSwitch).toBeChecked();

      // Test notification settings
      const emailNotifications = screen.getByRole('checkbox', { name: /Email Notifications/i });
      fireEvent.click(emailNotifications);
      expect(emailNotifications).toBeChecked();
    });
  });
});

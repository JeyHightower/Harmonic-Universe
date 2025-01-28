import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Login from '../../../components/Auth/Login';

const mockStore = configureStore([]);

describe('Login Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        loading: false,
        error: null,
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders login form', () => {
    renderComponent();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderComponent();
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('handles successful login', async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      const actions = store.getActions();
      expect(actions[0].type).toBe('auth/loginRequest');
    });
  });

  test('shows error message on failed login', async () => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        loading: false,
        error: 'Invalid credentials',
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('redirects to home when already authenticated', () => {
    store = mockStore({
      auth: {
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    });

    renderComponent();

    expect(window.location.pathname).toBe('/');
  });
});

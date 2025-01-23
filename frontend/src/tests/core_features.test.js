import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import App from '../App';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import Register from '../pages/Register';
import UniverseDetails from '../pages/UniverseDetails';
import UniverseList from '../pages/UniverseList';

const mockStore = configureStore([thunk]);

const renderWithProviders = (component, { store = mockStore({}) } = {}) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('Authentication', () => {
  test('login form submission', async () => {
    const store = mockStore({
      auth: { isAuthenticated: false, loading: false },
    });

    renderWithProviders(<Login />, { store });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'LOGIN_SUCCESS' })
      );
    });
  });

  test('register form submission', async () => {
    const store = mockStore({
      auth: { isAuthenticated: false, loading: false },
    });

    renderWithProviders(<Register />, { store });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'REGISTER_SUCCESS' })
      );
    });
  });
});

describe('Universe Management', () => {
  test('create universe', async () => {
    const store = mockStore({
      auth: { isAuthenticated: true },
      universe: { universes: [] },
    });

    renderWithProviders(<UniverseList />, { store });

    fireEvent.click(screen.getByRole('button', { name: /create universe/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A test universe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'CREATE_UNIVERSE_SUCCESS' })
      );
    });
  });

  test('view universe details', async () => {
    const mockUniverse = {
      id: 1,
      name: 'Test Universe',
      description: 'A test universe',
      is_public: true,
    };

    const store = mockStore({
      auth: { isAuthenticated: true },
      universe: { currentUniverse: mockUniverse },
    });

    renderWithProviders(<UniverseDetails />, { store });

    expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
    expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
  });
});

describe('Parameter Management', () => {
  test('update physics parameters', async () => {
    const mockUniverse = {
      id: 1,
      name: 'Test Universe',
      physics_parameters: { gravity: 9.81 },
    };

    const store = mockStore({
      auth: { isAuthenticated: true },
      universe: { currentUniverse: mockUniverse },
    });

    renderWithProviders(<UniverseDetails />, { store });

    fireEvent.change(screen.getByLabelText(/gravity/i), {
      target: { value: '10.0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save parameters/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_PARAMETERS_SUCCESS' })
      );
    });
  });
});

describe('Privacy Controls', () => {
  test('update privacy settings', async () => {
    const mockUniverse = {
      id: 1,
      name: 'Test Universe',
      is_public: true,
    };

    const store = mockStore({
      auth: { isAuthenticated: true },
      universe: { currentUniverse: mockUniverse },
    });

    renderWithProviders(<UniverseDetails />, { store });

    fireEvent.click(screen.getByRole('button', { name: /privacy settings/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /make private/i }));
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_PRIVACY_SUCCESS' })
      );
    });
  });
});

describe('Profile Management', () => {
  test('update profile', async () => {
    const store = mockStore({
      auth: { isAuthenticated: true, user: { username: 'testuser' } },
    });

    renderWithProviders(<Profile />, { store });

    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: { value: 'New bio text' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_PROFILE_SUCCESS' })
      );
    });
  });
});

describe('Favorites', () => {
  test('toggle favorite universe', async () => {
    const mockUniverse = {
      id: 1,
      name: 'Test Universe',
      isFavorite: false,
    };

    const store = mockStore({
      auth: { isAuthenticated: true },
      universe: { currentUniverse: mockUniverse },
    });

    renderWithProviders(<UniverseDetails />, { store });

    fireEvent.click(screen.getByRole('button', { name: /favorite/i }));

    await waitFor(() => {
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'TOGGLE_FAVORITE_SUCCESS' })
      );
    });
  });
});

describe('Navigation', () => {
  test('protected route redirection', async () => {
    const store = mockStore({
      auth: { isAuthenticated: false },
    });

    renderWithProviders(<App />, { store });

    // Try to access protected route
    window.history.pushState({}, '', '/dashboard');

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });
});

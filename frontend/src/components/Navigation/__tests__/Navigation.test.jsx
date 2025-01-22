import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../App';
import { monitoring } from '../../../services/monitoring';
import ProtectedRoute from '../ProtectedRoute';

vi.mock('../../../services/monitoring', () => ({
  monitoring: {
    trackEvent: vi.fn(),
    logError: vi.fn(),
  },
}));

describe('Navigation', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: (state = { isAuthenticated: false, user: null }, action) => state,
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui, { route = '/' } = {}) => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>
    );
  };

  describe('Protected Routes', () => {
    it('redirects to login when accessing protected route while unauthenticated', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { route: '/protected' }
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('allows access to protected route when authenticated', async () => {
      store = configureStore({
        reducer: {
          auth: (state = { isAuthenticated: true, user: { id: 1 } }, action) =>
            state,
        },
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { route: '/protected' }
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Route Transitions', () => {
    it('tracks route changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByText('Settings'));
      expect(monitoring.trackEvent).toHaveBeenCalledWith(
        'session_route_change',
        1,
        expect.any(Object)
      );
    });

    it('handles invalid routes', async () => {
      renderWithProviders(<App />, { route: '/invalid-route' });
      expect(screen.getByText('404 - Page Not Found')).toBeInTheDocument();
    });

    it('preserves route state during navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);

      await user.click(screen.getByText('Create Universe'));
      await user.type(screen.getByLabelText('Name'), 'Test Universe');
      await user.click(screen.getByText('Settings'));
      await user.click(screen.getByText('Create Universe'));

      expect(screen.getByLabelText('Name')).toHaveValue('Test Universe');
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('displays correct breadcrumb trail', async () => {
      renderWithProviders(<App />, {
        route: '/universes/1/edit',
      });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Universes')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('allows navigation through breadcrumbs', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />, {
        route: '/universes/1/edit',
      });

      await user.click(screen.getByText('Universes'));
      expect(screen.getByTestId('universe-list')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('shows loading spinner during component lazy loading', async () => {
      renderWithProviders(<App />, { route: '/settings' });
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });
    });

    it('handles lazy loading errors', async () => {
      const originalError = console.error;
      console.error = vi.fn();

      // Mock a failing import
      vi.mock('../../../components/Settings/Settings', () => {
        throw new Error('Failed to load Settings');
      });

      renderWithProviders(<App />, { route: '/settings' });

      await waitFor(() => {
        expect(screen.getByText('Error loading page')).toBeInTheDocument();
      });

      console.error = originalError;
    });
  });

  describe('Navigation Guards', () => {
    it('prompts for unsaved changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />, { route: '/universes/new' });

      await user.type(screen.getByLabelText('Name'), 'Test Universe');
      await user.click(screen.getByText('Settings'));

      expect(
        screen.getByText(
          'You have unsaved changes. Are you sure you want to leave?'
        )
      ).toBeInTheDocument();
    });

    it('prevents navigation when form is dirty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />, { route: '/universes/new' });

      await user.type(screen.getByLabelText('Name'), 'Test Universe');
      await user.click(screen.getByText('Settings'));
      await user.click(screen.getByText('Stay'));

      expect(screen.getByTestId('universe-create-form')).toBeInTheDocument();
    });

    it('allows navigation after confirmation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />, { route: '/universes/new' });

      await user.type(screen.getByLabelText('Name'), 'Test Universe');
      await user.click(screen.getByText('Settings'));
      await user.click(screen.getByText('Leave'));

      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
  });
});

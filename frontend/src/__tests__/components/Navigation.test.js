import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Navigation } from '../../components/Navigation';
import { logout } from '../../store/slices/authSlice';

const mockStore = configureStore([thunk]);

describe('Navigation System', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: {
          username: 'testuser',
          avatarUrl: 'https://example.com/avatar.jpg'
        }
      }
    });
  });

  test('renders navigation for authenticated user', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/universes/i)).toBeInTheDocument();
    expect(screen.getByText(/favorites/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByAltText(/user avatar/i)).toBeInTheDocument();
  });

  test('renders navigation for unauthenticated user', () => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        user: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  test('handles navigation clicks', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText(/dashboard/i));
    expect(window.location.pathname).toBe('/dashboard');

    fireEvent.click(screen.getByText(/universes/i));
    expect(window.location.pathname).toBe('/universes');

    fireEvent.click(screen.getByText(/favorites/i));
    expect(window.location.pathname).toBe('/favorites');

    fireEvent.click(screen.getByText(/profile/i));
    expect(window.location.pathname).toBe('/profile');
  });

  test('handles logout', async () => {
    store.dispatch = jest.fn().mockResolvedValue({ payload: null });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText(/logout/i));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(logout());
      expect(window.location.pathname).toBe('/login');
    });
  });

  test('displays user menu', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByTestId('user-menu-button'));

    expect(screen.getByText(/view profile/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  test('handles responsive menu toggle', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    const menuButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(menuButton);

    expect(screen.getByTestId('mobile-menu')).toHaveClass('open');

    fireEvent.click(menuButton);
    expect(screen.getByTestId('mobile-menu')).not.toHaveClass('open');
  });

  test('closes mobile menu on navigation', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByTestId('mobile-menu-button'));
    expect(screen.getByTestId('mobile-menu')).toHaveClass('open');

    fireEvent.click(screen.getByText(/dashboard/i));
    expect(screen.getByTestId('mobile-menu')).not.toHaveClass('open');
  });

  test('displays active route indicator', () => {
    window.history.pushState({}, '', '/dashboard');

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/dashboard/i).closest('a')).toHaveClass('active');
  });

  test('handles notification badge', () => {
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: {
          username: 'testuser',
          avatarUrl: 'https://example.com/avatar.jpg',
          notifications: 3
        }
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('notification-badge')).toHaveTextContent('3');
  });

  test('applies theme styles', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Navigation />
        </BrowserRouter>
      </Provider>
    );

    const nav = screen.getByRole('navigation');
    const styles = window.getComputedStyle(nav);

    expect(styles.backgroundColor).toBeTruthy();
    expect(styles.boxShadow).toBeTruthy();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import App from '../../App';

// Configure mock store with thunk middleware
const configureMockStore = () => {
  const middlewares = [thunk];
  return configureStore(middlewares);
};

describe('App Integration Tests', () => {
  let store;
  const mockStore = configureMockStore();

  beforeEach(() => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      },
      universe: {
        universes: [],
        currentUniverse: null,
        loading: false,
        error: null,
      },
      storyboard: {
        storyboards: [],
        currentStoryboard: null,
        loading: false,
        error: null,
      },
    });
  });

  const renderApp = (initialRoute = '/') => {
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <App />
        </MemoryRouter>
      </Provider>
    );
  };

  test('renders login form when not authenticated', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  test('shows signup link and navigates to signup form', async () => {
    renderApp();
    const signupLink = screen.getByText(/sign up/i);
    fireEvent.click(signupLink);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /create account/i })
      ).toBeInTheDocument();
    });
  });

  test('shows error message on failed login', async () => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Invalid credentials',
      },
      universe: {
        universes: [],
        currentUniverse: null,
        loading: false,
        error: null,
      },
      storyboard: {
        storyboards: [],
        currentStoryboard: null,
        loading: false,
        error: null,
      },
    });

    renderApp();
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  test('redirects to dashboard after successful login', async () => {
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' },
        loading: false,
        error: null,
      },
      universe: {
        universes: [],
        currentUniverse: null,
        loading: false,
        error: null,
      },
      storyboard: {
        storyboards: [],
        currentStoryboard: null,
        loading: false,
        error: null,
      },
    });

    renderApp();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /dashboard/i })
      ).toBeInTheDocument();
    });
  });

  test('shows universe list when authenticated', async () => {
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' },
        loading: false,
        error: null,
      },
      universe: {
        universes: [
          { id: 1, name: 'Test Universe', description: 'Test Description' },
        ],
        currentUniverse: null,
        loading: false,
        error: null,
      },
      storyboard: {
        storyboards: [],
        currentStoryboard: null,
        loading: false,
        error: null,
      },
    });

    renderApp('/universes');
    await waitFor(() => {
      expect(screen.getByText(/test universe/i)).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching data', async () => {
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: { id: 1, username: 'testuser' },
        loading: false,
        error: null,
      },
      universe: {
        universes: [],
        currentUniverse: null,
        loading: true,
        error: null,
      },
      storyboard: {
        storyboards: [],
        currentStoryboard: null,
        loading: false,
        error: null,
      },
    });

    renderApp('/universes');
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

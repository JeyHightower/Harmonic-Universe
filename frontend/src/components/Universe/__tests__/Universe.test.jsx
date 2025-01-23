import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice';
import favoritesReducer from '../../../store/slices/favoriteSlice';
import universeReducer from '../../../store/slices/universeSlice';
import userReducer from '../../../store/slices/userSlice';
import UniverseCreate from '../UniverseCreate';
import UniverseDetail from '../UniverseDetail';
import UniverseEdit from '../UniverseEdit';
import UniverseList from '../UniverseList';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Universe Components', () => {
  let store;

  const mockUniverses = [
    {
      id: 1,
      name: 'Test Universe 1',
      description: 'Description 1',
      isPublic: true,
      maxParticipants: 10,
      creator_id: 1,
      shared_with: [],
      owner: { id: 1, username: 'testuser' },
    },
    {
      id: 2,
      name: 'Test Universe 2',
      description: 'Description 2',
      isPublic: false,
      maxParticipants: 5,
      creator_id: 1,
      shared_with: [],
      owner: { id: 1, username: 'testuser' },
    },
  ];

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        auth: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        favorites: {
          favorites: [],
          isLoading: false,
          error: null,
        },
        universe: {
          universes: mockUniverses,
          currentUniverse: null,
          status: 'idle',
          error: null,
        },
        users: {
          searchResults: [],
          userDetails: {},
          isLoading: false,
          error: null,
        },
      },
      store = configureStore({
        reducer: {
          auth: authReducer,
          favorites: favoritesReducer,
          universe: universeReducer,
          users: userReducer,
        },
        preloadedState,
      }),
      ...renderOptions
    } = {}
  ) => {
    const Wrapper = ({ children }) => (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );

    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        favorites: favoritesReducer,
        universe: universeReducer,
        users: userReducer,
      },
      preloadedState: {
        auth: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        favorites: {
          favorites: [],
          isLoading: false,
          error: null,
        },
        universe: {
          universes: mockUniverses,
          currentUniverse: null,
          status: 'idle',
          error: null,
        },
        users: {
          searchResults: [],
          userDetails: {},
          isLoading: false,
          error: null,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe('UniverseList Component', () => {
    it('renders universe list correctly', async () => {
      renderWithProviders(<UniverseList />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });

      await waitFor(() => {
        mockUniverses.forEach(universe => {
          expect(screen.getByText(universe.name)).toBeInTheDocument();
          expect(screen.getByText(universe.description)).toBeInTheDocument();
        });
      });
    });

    it('handles empty universe list', async () => {
      renderWithProviders(<UniverseList />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });

      await waitFor(() => {
        expect(
          screen.getByText('No universes found. Create one to get started!')
        ).toBeInTheDocument();
      });
    });

    it('displays loading state', () => {
      renderWithProviders(<UniverseList />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'loading',
            error: null,
          },
        },
      });
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('handles universe filtering', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseList />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });

      const searchInput = screen.getByTestId('universe-search');
      await user.type(searchInput, 'Test Universe 1');

      await waitFor(() => {
        expect(screen.getByText('Test Universe 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Universe 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('UniverseCreate Component', () => {
    it('renders create form correctly', () => {
      renderWithProviders(<UniverseCreate />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });

      expect(screen.getByLabelText('Universe Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Participants')).toBeInTheDocument();
      expect(screen.getByLabelText('Make Universe Public')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create Universe' })
      ).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseCreate />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });

      await user.click(screen.getByRole('button', { name: 'Create Universe' }));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('handles successful universe creation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseCreate />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });

      await user.type(screen.getByLabelText('Universe Name'), 'New Universe');
      await user.type(screen.getByLabelText('Description'), 'Test Description');
      await user.type(screen.getByLabelText('Max Participants'), '10');
      await user.click(screen.getByLabelText('Make Universe Public'));
      await user.click(screen.getByRole('button', { name: 'Create Universe' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/universe/1');
      });
    });

    it('handles creation error', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseCreate />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'failed',
            error: 'Creation failed',
          },
        },
      });

      await user.type(screen.getByLabelText('Universe Name'), 'New Universe');
      await user.click(screen.getByRole('button', { name: 'Create Universe' }));

      expect(screen.getByText('Creation failed')).toBeInTheDocument();
    });
  });

  describe('UniverseDetail Component', () => {
    const mockUniverse = mockUniverses[0];

    it('renders universe details correctly', () => {
      renderWithProviders(<UniverseDetail />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: mockUniverse,
            status: 'idle',
            error: null,
          },
        },
      });

      expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
      expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Overview' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Physics' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Music' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Storyboard' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Comments' })
      ).toBeInTheDocument();
    });

    it('handles loading state', () => {
      renderWithProviders(<UniverseDetail />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'loading',
            error: null,
          },
        },
      });
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays error state', () => {
      renderWithProviders(<UniverseDetail />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'failed',
            error: 'Failed to load universe',
          },
        },
      });
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Failed to load universe'
      );
    });

    it('handles universe not found', () => {
      renderWithProviders(<UniverseDetail />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: [],
            currentUniverse: null,
            status: 'idle',
            error: null,
          },
        },
      });
      expect(screen.getByTestId('not-found-message')).toHaveTextContent(
        'Universe not found'
      );
    });
  });

  describe('UniverseEdit Component', () => {
    const mockUniverse = mockUniverses[0];

    it('renders edit form with universe data', () => {
      renderWithProviders(<UniverseEdit />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: mockUniverse,
            status: 'idle',
            error: null,
          },
        },
      });

      expect(screen.getByLabelText('Universe Name')).toHaveValue(
        mockUniverse.name
      );
      expect(screen.getByLabelText('Description')).toHaveValue(
        mockUniverse.description
      );
      expect(screen.getByLabelText('Max Participants')).toHaveValue(
        mockUniverse.maxParticipants
      );
    });

    it('handles successful update', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseEdit />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: mockUniverse,
            status: 'idle',
            error: null,
          },
        },
      });

      await user.type(screen.getByLabelText('Universe Name'), ' Updated');
      await user.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `/universe/${mockUniverse.id}`
        );
      });
    });

    it('handles update error', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseEdit />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: mockUniverse,
            status: 'failed',
            error: 'Update failed',
          },
        },
      });

      await user.type(screen.getByLabelText('Universe Name'), ' Updated');
      await user.click(screen.getByText('Save Changes'));

      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseEdit />, {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          favorites: {
            favorites: [],
            isLoading: false,
            error: null,
          },
          universe: {
            universes: mockUniverses,
            currentUniverse: mockUniverse,
            status: 'idle',
            error: null,
          },
        },
      });

      await user.clear(screen.getByLabelText('Universe Name'));
      await user.click(screen.getByText('Save Changes'));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });
});

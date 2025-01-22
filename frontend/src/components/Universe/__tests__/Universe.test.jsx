import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
      owner: { id: 1, username: 'testuser' },
    },
    {
      id: 2,
      name: 'Test Universe 2',
      description: 'Description 2',
      isPublic: false,
      maxParticipants: 5,
      owner: { id: 1, username: 'testuser' },
    },
  ];

  beforeEach(() => {
    store = configureStore({
      reducer: {
        universe: (
          state = {
            universes: mockUniverses,
            currentUniverse: null,
            isLoading: false,
            error: null,
          },
          action
        ) => state,
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = component => {
    return render(
      <Provider store={store}>
        <BrowserRouter>{component}</BrowserRouter>
      </Provider>
    );
  };

  describe('UniverseList Component', () => {
    it('renders universe list correctly', async () => {
      renderWithProviders(<UniverseList />);

      await waitFor(() => {
        mockUniverses.forEach(universe => {
          expect(screen.getByText(universe.name)).toBeInTheDocument();
          expect(screen.getByText(universe.description)).toBeInTheDocument();
        });
      });
    });

    it('handles empty universe list', async () => {
      store = configureStore({
        reducer: {
          universe: (state = { universes: [], isLoading: false }, action) =>
            state,
        },
      });

      renderWithProviders(<UniverseList />);

      await waitFor(() => {
        expect(screen.getByText(/no universes found/i)).toBeInTheDocument();
      });
    });

    it('displays loading state', () => {
      store = configureStore({
        reducer: {
          universe: (state = { isLoading: true }, action) => state,
        },
      });

      renderWithProviders(<UniverseList />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('handles universe filtering', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseList />);

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
      renderWithProviders(<UniverseCreate />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max participants/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/public/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseCreate />);

      await user.click(screen.getByText(/create universe/i));

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });

    it('handles successful universe creation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseCreate />);

      await user.type(screen.getByLabelText(/name/i), 'New Universe');
      await user.type(
        screen.getByLabelText(/description/i),
        'Test Description'
      );
      await user.type(screen.getByLabelText(/max participants/i), '10');
      await user.click(screen.getByLabelText(/public/i));
      await user.click(screen.getByText(/create universe/i));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/universe/1');
      });
    });

    it('handles creation error', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          universe: (state = { error: 'Creation failed' }, action) => state,
        },
      });

      renderWithProviders(<UniverseCreate />);
      await user.type(screen.getByLabelText(/name/i), 'New Universe');
      await user.click(screen.getByText(/create universe/i));

      expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
    });
  });

  describe('UniverseDetail Component', () => {
    const mockUniverse = mockUniverses[0];

    beforeEach(() => {
      store = configureStore({
        reducer: {
          universe: (state = { currentUniverse: mockUniverse }, action) =>
            state,
        },
      });
    });

    it('renders universe details correctly', () => {
      renderWithProviders(<UniverseDetail />);

      expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
      expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
      expect(
        screen.getByText(`Max Participants: ${mockUniverse.maxParticipants}`)
      ).toBeInTheDocument();
    });

    it('handles loading state', () => {
      store = configureStore({
        reducer: {
          universe: (state = { isLoading: true }, action) => state,
        },
      });

      renderWithProviders(<UniverseDetail />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays error state', () => {
      store = configureStore({
        reducer: {
          universe: (state = { error: 'Failed to load universe' }, action) =>
            state,
        },
      });

      renderWithProviders(<UniverseDetail />);
      expect(screen.getByText(/failed to load universe/i)).toBeInTheDocument();
    });

    it('handles universe not found', () => {
      store = configureStore({
        reducer: {
          universe: (state = { currentUniverse: null }, action) => state,
        },
      });

      renderWithProviders(<UniverseDetail />);
      expect(screen.getByText(/universe not found/i)).toBeInTheDocument();
    });
  });

  describe('UniverseEdit Component', () => {
    const mockUniverse = mockUniverses[0];

    beforeEach(() => {
      store = configureStore({
        reducer: {
          universe: (state = { currentUniverse: mockUniverse }, action) =>
            state,
        },
      });
    });

    it('renders edit form with universe data', () => {
      renderWithProviders(<UniverseEdit />);

      expect(screen.getByLabelText(/name/i)).toHaveValue(mockUniverse.name);
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        mockUniverse.description
      );
      expect(screen.getByLabelText(/max participants/i)).toHaveValue(
        mockUniverse.maxParticipants.toString()
      );
    });

    it('handles successful update', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseEdit />);

      await user.clear(screen.getByLabelText(/name/i));
      await user.type(screen.getByLabelText(/name/i), 'Updated Universe');
      await user.click(screen.getByText(/save changes/i));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `/universe/${mockUniverse.id}`
        );
      });
    });

    it('handles update error', async () => {
      const user = userEvent.setup();
      store = configureStore({
        reducer: {
          universe: (
            state = {
              currentUniverse: mockUniverse,
              error: 'Update failed',
            },
            action
          ) => state,
        },
      });

      renderWithProviders(<UniverseEdit />);
      await user.click(screen.getByText(/save changes/i));

      expect(screen.getByText(/update failed/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UniverseEdit />);

      await user.clear(screen.getByLabelText(/name/i));
      await user.click(screen.getByText(/save changes/i));

      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });
});

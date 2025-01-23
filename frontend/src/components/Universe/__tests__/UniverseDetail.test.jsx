/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import universeReducer, {
  fetchUniverses,
} from '../../../store/slices/universeSlice';
import styles from '../Universe.module.css';
import UniverseDetail from '../UniverseDetail';

// Mock the universe actions
vi.mock('../../../store/slices/universeSlice', () => ({
  fetchUniverses: vi.fn(() => ({
    type: 'universe/fetchUniverses',
    payload: undefined,
  })),
  updateUniverse: vi.fn(() => ({
    type: 'universe/updateUniverse',
    payload: undefined,
  })),
  __esModule: true,
  default: (
    state = {
      universes: [],
      currentUniverse: null,
      isLoading: false,
      error: null,
    }
  ) => state,
}));

// Mock child components
vi.mock('../FavoriteButton', () => ({
  default: () => <div data-testid="favorite-button">Favorite Button</div>,
}));

vi.mock('../PrivacyToggle', () => ({
  default: () => <div data-testid="privacy-toggle">Privacy Toggle</div>,
}));

vi.mock('../ShareUniverse', () => ({
  default: () => <div data-testid="share-universe">Share Universe</div>,
}));

vi.mock('../../Physics/PhysicsControls', () => ({
  default: () => <div data-testid="physics-controls">Physics Controls</div>,
}));

vi.mock('../../Music/MusicControls', () => ({
  default: () => <div data-testid="music-controls">Music Controls</div>,
}));

vi.mock('../../Storyboard/Storyboard', () => ({
  default: () => <div data-testid="storyboard">Storyboard</div>,
}));

vi.mock('../../Comments/CommentList', () => ({
  default: () => <div data-testid="comment-list">Comment List</div>,
}));

// Mock CSS modules
vi.mock('../Universe.module.css', () => ({
  default: {
    active: 'active',
    tab: 'tab',
    loading: 'loading',
    error: 'error',
  },
}));

describe('UniverseDetail Component', () => {
  const mockUniverse = {
    id: '1',
    name: 'Test Universe',
    description: 'A test universe description',
    isPrivate: false,
    ownerId: 'user1',
    gravity_constant: 9.81,
    environment_harmony: 0.75,
    created_at: '2024-01-23T12:00:00Z',
    updated_at: '2024-01-24T14:30:00Z',
  };

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        universe: {
          universes: [],
          currentUniverse: mockUniverse,
          isLoading: false,
          error: null,
        },
      },
      store = configureStore({
        reducer: {
          universe: universeReducer,
        },
        preloadedState,
      }),
      ...renderOptions
    } = {}
  ) => {
    const Wrapper = ({ children }) => (
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={children} />
          </Routes>
        </BrowserRouter>
      </Provider>
    );
    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
  };

  it('renders loading state initially', () => {
    renderWithProviders(<UniverseDetail />, {
      preloadedState: {
        universe: {
          universes: [],
          currentUniverse: null,
          isLoading: true,
          error: null,
        },
      },
    });

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    const errorMessage = 'Failed to load universe';
    renderWithProviders(<UniverseDetail />, {
      preloadedState: {
        universe: {
          universes: [],
          currentUniverse: null,
          isLoading: false,
          error: errorMessage,
        },
      },
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
  });

  it('renders not found message when universe is null', () => {
    renderWithProviders(<UniverseDetail />, {
      preloadedState: {
        universe: {
          universes: [],
          currentUniverse: null,
          isLoading: false,
          error: null,
        },
      },
    });

    expect(screen.getByTestId('not-found-message')).toBeInTheDocument();
  });

  it('renders universe details correctly', () => {
    renderWithProviders(<UniverseDetail />);

    expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
    expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
    expect(screen.getByTestId('favorite-button')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('share-universe')).toBeInTheDocument();
  });

  it('switches tabs correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UniverseDetail />);

    // Test each tab
    const tabs = [
      { name: 'Physics', testId: 'physics-controls' },
      { name: 'Music', testId: 'music-controls' },
      { name: 'Storyboard', testId: 'storyboard' },
      { name: 'Comments', testId: 'comment-list' },
    ];

    for (const tab of tabs) {
      await user.click(screen.getByRole('button', { name: tab.name }));
      expect(screen.getByTestId(tab.testId)).toBeInTheDocument();
    }

    // Test switching back to overview
    await user.click(screen.getByRole('button', { name: 'Overview' }));
    expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
  });

  it('fetches universe data on mount', async () => {
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<UniverseDetail />);
    store.dispatch = mockDispatch;

    await waitFor(() => {
      expect(fetchUniverses).toHaveBeenCalled();
    });
  });

  it('updates active tab state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UniverseDetail />);

    // Initially shows overview
    expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();

    // Switch to physics tab
    await user.click(screen.getByRole('button', { name: 'Physics' }));
    expect(screen.getByTestId('physics-controls')).toBeInTheDocument();
    expect(
      screen.queryByText(mockUniverse.description)
    ).not.toBeInTheDocument();
  });

  it('handles tab button styling', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UniverseDetail />);

    const physicsTab = screen.getByRole('button', { name: 'Physics' });

    // Initially not active
    expect(physicsTab.className).not.toContain(styles.active);

    // Click to activate
    await user.click(physicsTab);
    expect(physicsTab.className).toContain(styles.active);

    // Click another tab
    await user.click(screen.getByRole('button', { name: 'Music' }));
    expect(physicsTab.className).not.toContain(styles.active);
  });

  it('preserves tab state on universe update', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<UniverseDetail />);

    // Switch to physics tab
    await user.click(screen.getByRole('button', { name: 'Physics' }));
    expect(screen.getByTestId('physics-controls')).toBeInTheDocument();

    // Simulate universe update
    rerender(<UniverseDetail />);
    expect(screen.getByTestId('physics-controls')).toBeInTheDocument();
  });
});

/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice';
import favoritesReducer, {
  addFavorite,
  removeFavorite,
} from '../../../store/slices/favoriteSlice';
import FavoriteButton from '../FavoriteButton';

// Mock the favorites actions
vi.mock('../../../store/slices/favoriteSlice', () => ({
  addFavorite: vi.fn(() => ({
    type: 'favorites/addFavorite',
    payload: undefined,
  })),
  removeFavorite: vi.fn(() => ({
    type: 'favorites/removeFavorite',
    payload: undefined,
  })),
  __esModule: true,
  default: (state = { favorites: [], isLoading: false }) => state,
}));

describe('FavoriteButton Component', () => {
  const universeId = 1;

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        auth: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          isAuthenticated: true,
        },
        favorites: {
          favorites: [],
          isLoading: false,
        },
      },
      store = configureStore({
        reducer: {
          auth: authReducer,
          favorites: favoritesReducer,
        },
        preloadedState,
      }),
      ...renderOptions
    } = {}
  ) => {
    const Wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
  };

  it('renders favorite button with correct aria-label when not favorited', () => {
    renderWithProviders(<FavoriteButton universeId={universeId} />);
    const button = screen.getByRole('button', { name: 'Add to favorites' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Add to favorites');
  });

  it('renders favorite button with correct aria-label when favorited', () => {
    renderWithProviders(<FavoriteButton universeId={universeId} />, {
      preloadedState: {
        auth: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          isAuthenticated: true,
        },
        favorites: {
          favorites: [{ universe_id: universeId }],
          isLoading: false,
        },
      },
    });
    const button = screen.getByRole('button', {
      name: 'Remove from favorites',
    });
    expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
  });

  it('shows filled heart icon when universe is favorited', () => {
    renderWithProviders(<FavoriteButton universeId={universeId} />, {
      preloadedState: {
        auth: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          isAuthenticated: true,
        },
        favorites: {
          favorites: [{ universe_id: universeId }],
          isLoading: false,
        },
      },
    });
    const button = screen.getByRole('button', {
      name: 'Remove from favorites',
    });
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'currentColor');
  });

  it('shows empty heart icon when universe is not favorited', () => {
    renderWithProviders(<FavoriteButton universeId={universeId} />);
    const button = screen.getByRole('button', { name: 'Add to favorites' });
    const svg = button.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
  });

  it('dispatches addFavorite when clicking non-favorited button', async () => {
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(
      <FavoriteButton universeId={universeId} />
    );
    store.dispatch = mockDispatch;

    const button = screen.getByRole('button', { name: 'Add to favorites' });
    fireEvent.click(button);

    expect(addFavorite).toHaveBeenCalledWith(universeId);
  });

  it('dispatches removeFavorite when clicking favorited button', async () => {
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(
      <FavoriteButton universeId={universeId} />,
      {
        preloadedState: {
          auth: {
            user: { id: 1, username: 'testuser' },
            token: 'test-token',
            isAuthenticated: true,
          },
          favorites: {
            favorites: [{ universe_id: universeId }],
            isLoading: false,
          },
        },
      }
    );
    store.dispatch = mockDispatch;

    const button = screen.getByRole('button', {
      name: 'Remove from favorites',
    });
    fireEvent.click(button);

    expect(removeFavorite).toHaveBeenCalledWith(universeId);
  });

  it('shows loading spinner while toggling favorite', () => {
    renderWithProviders(<FavoriteButton universeId={universeId} />, {
      preloadedState: {
        auth: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token',
          isAuthenticated: true,
        },
        favorites: {
          favorites: [],
          isLoading: true,
        },
      },
    });

    const button = screen.getByRole('button', { name: 'Add to favorites' });
    expect(button).toBeDisabled();
    expect(button.querySelector('.loadingSpinner')).toBeInTheDocument();
  });

  it('handles error when toggling favorite fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Failed to toggle');
    const mockDispatch = vi.fn(() => Promise.reject(mockError));

    const { store } = renderWithProviders(
      <FavoriteButton universeId={universeId} />
    );
    store.dispatch = mockDispatch;

    const button = screen.getByRole('button', { name: 'Add to favorites' });
    fireEvent.click(button);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to toggle favorite:',
      mockError
    );

    consoleSpy.mockRestore();
  });
});

/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import authReducer from '../../../store/slices/authSlice';
import favoritesReducer from '../../../store/slices/favoriteSlice';
import universeReducer from '../../../store/slices/universeSlice';
import {
  createMockUniverse,
  renderWithProviders,
} from '../../../utils/test-utils';
import UniverseCard from '../UniverseCard';

describe('UniverseCard', () => {
  it('renders universe information', () => {
    const universe = {
      id: 1,
      name: 'Test Universe',
      description: 'Test Description',
    };

    renderWithProviders(<UniverseCard universe={universe} />);

    expect(screen.getByText('Test Universe')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});

describe('UniverseCard Component', () => {
  const mockUniverse = createMockUniverse({
    id: 1,
    name: 'Test Universe',
    description: 'A test universe description',
  });

  it('renders universe card with correct information', () => {
    renderWithProviders(<UniverseCard universe={mockUniverse} />);

    expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
    expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
  });

  it('displays created and updated dates', () => {
    renderWithProviders(<UniverseCard universe={mockUniverse} />);

    const createdDate = new Date(mockUniverse.createdAt).toLocaleDateString();
    const updatedDate = new Date(mockUniverse.updatedAt).toLocaleDateString();

    expect(screen.getByText(new RegExp(createdDate))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(updatedDate))).toBeInTheDocument();
  });

  it('renders without crashing when minimal props are provided', () => {
    const minimalUniverse = createMockUniverse({
      name: 'Minimal Universe',
      description: '',
    });

    renderWithProviders(<UniverseCard universe={minimalUniverse} />);
    expect(screen.getByText('Minimal Universe')).toBeInTheDocument();
  });

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
        universe: {
          universes: [mockUniverse],
          currentUniverse: null,
          status: 'idle',
        },
      },
      store = configureStore({
        reducer: {
          auth: authReducer,
          favorites: favoritesReducer,
          universe: universeReducer,
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

  it('displays creation date correctly', () => {
    renderWithProviders(<UniverseCard universe={mockUniverse} />);

    const formattedDate = new Date(
      mockUniverse.created_at
    ).toLocaleDateString();
    expect(screen.getByText(`Created: ${formattedDate}`)).toBeInTheDocument();
  });

  it('displays favorite count when greater than zero', () => {
    renderWithProviders(<UniverseCard universe={mockUniverse} />);

    expect(screen.getByText('♥ 5')).toBeInTheDocument();
  });

  it('does not display favorite count when zero', () => {
    const universeWithNoFavorites = {
      ...mockUniverse,
      favorite_count: 0,
    };

    renderWithProviders(<UniverseCard universe={universeWithNoFavorites} />);

    expect(screen.queryByText('♥ 0')).not.toBeInTheDocument();
  });

  it('links to the correct universe detail page', () => {
    renderWithProviders(<UniverseCard universe={mockUniverse} />);

    const link = screen.getByRole('link', { name: mockUniverse.name });
    expect(link).toHaveAttribute('href', `/universe/${mockUniverse.id}`);
  });
});

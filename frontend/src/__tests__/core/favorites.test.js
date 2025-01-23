import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { FavoritesList } from '../../components/Favorites';
import {
    addFavorite,
    fetchFavorites,
    removeFavorite
} from '../../store/slices/favoritesSlice';

const mockStore = configureStore([thunk]);

describe('Favorites Management', () => {
  let store;
  const mockFavorites = [
    {
      id: '1',
      universeId: '123',
      universeName: 'Test Universe 1',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      universeId: '456',
      universeName: 'Test Universe 2',
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    store = mockStore({
      favorites: {
        items: mockFavorites,
        loading: false,
        error: null
      }
    });
  });

  test('renders favorites list', async () => {
    store.dispatch = jest.fn().mockResolvedValue({ payload: mockFavorites });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(fetchFavorites());
    });

    mockFavorites.forEach(favorite => {
      expect(screen.getByText(favorite.universeName)).toBeInTheDocument();
    });
  });

  test('handles adding favorite', async () => {
    const newFavorite = {
      universeId: '789',
      universeName: 'New Favorite Universe'
    };
    store.dispatch = jest.fn().mockResolvedValue({
      payload: [...mockFavorites, { ...newFavorite, id: '3' }]
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByTestId(`add-favorite-${newFavorite.universeId}`));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        addFavorite(newFavorite.universeId)
      );
    });
  });

  test('handles removing favorite', async () => {
    const favoriteToRemove = mockFavorites[0];
    store.dispatch = jest.fn().mockResolvedValue({
      payload: mockFavorites.filter(f => f.id !== favoriteToRemove.id)
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    fireEvent.click(screen.getByTestId(`remove-favorite-${favoriteToRemove.id}`));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        removeFavorite(favoriteToRemove.id)
      );
    });
  });

  test('sorts favorites by date', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    const favoriteItems = screen.getAllByTestId(/favorite-item/);
    expect(favoriteItems).toHaveLength(mockFavorites.length);

    // Verify items are sorted by date (newest first)
    const dates = favoriteItems.map(item =>
      new Date(item.getAttribute('data-created-at'))
    );
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  test('displays empty state', () => {
    store = mockStore({
      favorites: {
        items: [],
        loading: false,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
  });

  test('displays error message', () => {
    const error = 'Failed to fetch favorites';
    store = mockStore({
      favorites: {
        items: [],
        loading: false,
        error
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    store = mockStore({
      favorites: {
        items: [],
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('navigates to universe details', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <FavoritesList />
        </BrowserRouter>
      </Provider>
    );

    const firstFavorite = mockFavorites[0];
    fireEvent.click(screen.getByTestId(`favorite-link-${firstFavorite.id}`));

    expect(window.location.pathname).toBe(`/universes/${firstFavorite.universeId}`);
  });
});

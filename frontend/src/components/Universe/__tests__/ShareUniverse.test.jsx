/**
 * @vitest-environment jsdom
 */
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import universeReducer, {
  shareUniverse,
  unshareUniverse,
} from '../../../store/slices/universeSlice';
import userReducer, {
  clearSearchResults,
  searchUsers,
} from '../../../store/slices/userSlice';

// Mock the universe and user actions
vi.mock('../../../store/slices/universeSlice', () => ({
  shareUniverse: vi.fn(() => ({
    type: 'universe/shareUniverse',
    payload: undefined,
  })),
  unshareUniverse: vi.fn(() => ({
    type: 'universe/unshareUniverse',
    payload: undefined,
  })),
  __esModule: true,
  default: (state = { currentUniverse: null }) => state,
}));

vi.mock('../../../store/slices/userSlice', () => ({
  searchUsers: vi.fn(() => ({
    type: 'users/searchUsers',
    payload: undefined,
  })),
  clearSearchResults: vi.fn(() => ({
    type: 'users/clearSearchResults',
    payload: undefined,
  })),
  __esModule: true,
  default: (state = { searchResults: [], isLoading: false }) => state,
}));

// Mock CSS modules
vi.mock('../Universe.module.css', () => ({
  default: {
    shareSection: 'shareSection',
    searchInput: 'searchInput',
    userList: 'userList',
    userItem: 'userItem',
    sharedWith: 'sharedWith',
  },
}));

describe('ShareUniverse Component', () => {
  const mockUniverse = {
    id: '1',
    name: 'Test Universe',
    shared_with: [
      { id: 2, username: 'user2' },
      { id: 3, username: 'user3' },
    ],
  };

  const mockSearchResults = [
    { id: 4, username: 'user4' },
    { id: 5, username: 'user5' },
  ];

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        universe: {
          currentUniverse: mockUniverse,
          isLoading: false,
          error: null,
        },
        users: {
          searchResults: mockSearchResults,
          isLoading: false,
          error: null,
        },
      },
      store = configureStore({
        reducer: {
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

  it('renders share interface correctly', () => {
    renderWithProviders(<ShareUniverse universeId="1" />);

    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    expect(screen.getByText('Shared with:')).toBeInTheDocument();
    mockUniverse.shared_with.forEach(user => {
      expect(screen.getByText(user.username)).toBeInTheDocument();
    });
  });

  it('handles user search', async () => {
    const user = userEvent.setup();
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<ShareUniverse universeId="1" />);
    store.dispatch = mockDispatch;

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'test');

    await waitFor(() => {
      expect(searchUsers).toHaveBeenCalledWith('test');
    });
  });

  it('displays search results', () => {
    renderWithProviders(<ShareUniverse universeId="1" />);

    mockSearchResults.forEach(user => {
      expect(screen.getByText(user.username)).toBeInTheDocument();
    });
  });

  it('handles sharing with user', async () => {
    const user = userEvent.setup();
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<ShareUniverse universeId="1" />);
    store.dispatch = mockDispatch;

    const shareButton = screen.getByRole('button', {
      name: `Share with ${mockSearchResults[0].username}`,
    });
    await user.click(shareButton);

    await waitFor(() => {
      expect(shareUniverse).toHaveBeenCalledWith({
        universeId: '1',
        userId: mockSearchResults[0].id,
      });
    });
  });

  it('handles unsharing with user', async () => {
    const user = userEvent.setup();
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<ShareUniverse universeId="1" />);
    store.dispatch = mockDispatch;

    const unshareButton = screen.getByRole('button', {
      name: `Remove ${mockUniverse.shared_with[0].username}`,
    });
    await user.click(unshareButton);

    await waitFor(() => {
      expect(unshareUniverse).toHaveBeenCalledWith({
        universeId: '1',
        userId: mockUniverse.shared_with[0].id,
      });
    });
  });

  it('clears search results when search input is cleared', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShareUniverse universeId="1" />);

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'test');
    await user.clear(searchInput);

    expect(clearSearchResults).toHaveBeenCalled();
  });

  it('shows loading state during search', () => {
    renderWithProviders(<ShareUniverse universeId="1" />, {
      preloadedState: {
        universe: {
          currentUniverse: mockUniverse,
          isLoading: false,
          error: null,
        },
        users: {
          searchResults: [],
          isLoading: true,
          error: null,
        },
      },
    });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error message when search fails', () => {
    const errorMessage = 'Failed to search users';
    renderWithProviders(<ShareUniverse universeId="1" />, {
      preloadedState: {
        universe: {
          currentUniverse: mockUniverse,
          isLoading: false,
          error: null,
        },
        users: {
          searchResults: [],
          isLoading: false,
          error: errorMessage,
        },
      },
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('debounces search input', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    const mockDispatch = vi.fn(() => Promise.resolve());
    const { store } = renderWithProviders(<ShareUniverse universeId="1" />);
    store.dispatch = mockDispatch;

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'test');

    expect(searchUsers).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(searchUsers).toHaveBeenCalledWith('test');
    vi.useRealTimers();
  });
});

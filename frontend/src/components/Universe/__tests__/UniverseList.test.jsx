/**
 * @vitest-environment jsdom
 */

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  createMockUniverse,
  renderWithProviders,
} from '../../../utils/test-utils';
import UniverseList from '../UniverseList';

// Mock the store

// Mock data
const mockUniverses = [
  createMockUniverse({ id: 1, name: 'Test Universe 1' }),
  createMockUniverse({ id: 2, name: 'Test Universe 2' }),
  createMockUniverse({ id: 3, name: 'Another Universe' }),
];

vi.mock('../../../store/slices/universeSlice', () => ({
  fetchUniverses: vi.fn().mockImplementation(() => {
    const thunk = async dispatch => {
      dispatch({ type: 'universe/fetchUniverses/pending' });
      await Promise.resolve();
      dispatch({
        type: 'universe/fetchUniverses/fulfilled',
        payload: mockUniverses,
      });
      return { data: mockUniverses };
    };
    thunk.unwrap = () => Promise.resolve(mockUniverses);
    return thunk;
  }),
  createUniverse: vi.fn().mockImplementation(universe => {
    const thunk = async dispatch => {
      dispatch({ type: 'universe/createUniverse/pending' });
      await Promise.resolve();
      const newUniverse = { id: 3, name: universe.name };
      dispatch({
        type: 'universe/createUniverse/fulfilled',
        payload: newUniverse,
      });
      return { data: newUniverse };
    };
    thunk.unwrap = () => Promise.resolve({ id: 3, name: universe.name });
    return thunk;
  }),
}));

vi.mock('../UniverseCard', () => ({
  default: ({ universe }) => (
    <div data-testid="universe-card">{universe.name}</div>
  ),
}));

vi.mock('../UniverseForm', () => ({
  default: ({ onSubmit, onCancel }) => (
    <div data-testid="universe-form">
      <button onClick={() => onSubmit({ name: 'New Universe' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../Common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-indicator">Loading...</div>,
}));

vi.mock('../../Common/ErrorMessage', () => ({
  default: ({ message }) => <div data-testid="error-message">{message}</div>,
}));

describe('UniverseList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner when loading', () => {
    renderWithProviders(<UniverseList />, {
      preloadedState: {
        universe: {
          universeList: [],
          loading: true,
          error: null,
        },
      },
    });
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders error message when there is an error', () => {
    const errorMessage = 'Failed to fetch universes';
    renderWithProviders(<UniverseList />, {
      preloadedState: {
        universe: {
          universeList: [],
          loading: false,
          error: errorMessage,
        },
      },
    });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders universe cards when data is loaded', () => {
    renderWithProviders(<UniverseList />, {
      preloadedState: {
        universe: {
          universeList: mockUniverses,
          loading: false,
          error: null,
        },
      },
    });
    expect(screen.getByTestId('universe-list')).toBeInTheDocument();
    mockUniverses.forEach(universe => {
      expect(screen.getByText(universe.name)).toBeInTheDocument();
    });
  });

  it('filters universes based on search query', () => {
    renderWithProviders(<UniverseList />, {
      preloadedState: {
        universe: {
          universeList: mockUniverses,
          loading: false,
          error: null,
        },
      },
    });

    const searchInput = screen.getByTestId('universe-search');
    fireEvent.change(searchInput, { target: { value: 'Another' } });

    expect(screen.getByText('Another Universe')).toBeInTheDocument();
    expect(screen.queryByText('Test Universe 1')).not.toBeInTheDocument();
  });

  it('shows create universe form when create button is clicked', () => {
    renderWithProviders(<UniverseList />, {
      preloadedState: {
        universe: {
          universeList: mockUniverses,
          loading: false,
          error: null,
        },
      },
    });

    const createButton = screen.getByTestId('create-universe-button');
    fireEvent.click(createButton);

    expect(screen.getByTestId('universe-form')).toBeInTheDocument();
  });

  it('displays no matches message when search returns no results', () => {
    renderWithProviders(<UniverseList />, {
      preloadedState: {
        universe: {
          universeList: mockUniverses,
          loading: false,
          error: null,
        },
      },
    });

    const searchInput = screen.getByTestId('universe-search');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    expect(
      screen.getByText('No universes match your search.')
    ).toBeInTheDocument();
  });
});

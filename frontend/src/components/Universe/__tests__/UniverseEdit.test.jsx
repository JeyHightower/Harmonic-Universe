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
  fetchUniverse,
  updateUniverse,
} from '../../../store/slices/universeSlice';
import UniverseEdit from '../UniverseEdit';

// Mock the universe actions
vi.mock('../../../store/slices/universeSlice', () => ({
  fetchUniverse: vi.fn(() => ({
    type: 'universe/fetchUniverse',
    payload: undefined,
  })),
  updateUniverse: vi.fn(() => ({
    type: 'universe/updateUniverse',
    payload: undefined,
  })),
  __esModule: true,
  default: (state = { universes: [], currentUniverse: null, status: 'idle' }) =>
    state,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

describe('UniverseEdit Component', () => {
  const mockUniverse = {
    id: '1',
    name: 'Test Universe',
    description: 'Test Description',
    isPublic: false,
    maxParticipants: 10,
  };

  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        universe: {
          universes: [],
          currentUniverse: mockUniverse,
          status: 'idle',
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
    return {
      store,
      ...render(ui, {
        wrapper: Wrapper,
        ...renderOptions,
      }),
    };
  };

  it('fetches universe data on mount', async () => {
    const mockDispatch = vi.fn(() => Promise.resolve(mockUniverse));
    const { store } = renderWithProviders(<UniverseEdit />);
    store.dispatch = mockDispatch;

    await waitFor(() => {
      expect(fetchUniverse).toHaveBeenCalledWith('1');
    });
  });

  it('pre-fills form with existing universe data', async () => {
    renderWithProviders(<UniverseEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText('Universe Name')).toHaveValue(
        mockUniverse.name
      );
      expect(screen.getByLabelText('Description')).toHaveValue(
        mockUniverse.description
      );
      expect(screen.getByLabelText('Max Participants')).toHaveValue(
        mockUniverse.maxParticipants
      );
      expect(screen.getByLabelText('Make Universe Public')).not.toBeChecked();
    });
  });

  it('handles form updates correctly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UniverseEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText('Universe Name')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText('Universe Name');
    const descriptionInput = screen.getByLabelText('Description');
    const maxParticipantsInput = screen.getByLabelText('Max Participants');
    const isPublicCheckbox = screen.getByLabelText('Make Universe Public');

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Universe');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated Description');
    await user.clear(maxParticipantsInput);
    await user.type(maxParticipantsInput, '20');
    await user.click(isPublicCheckbox);

    expect(nameInput).toHaveValue('Updated Universe');
    expect(descriptionInput).toHaveValue('Updated Description');
    expect(maxParticipantsInput).toHaveValue(20);
    expect(isPublicCheckbox).toBeChecked();
  });

  it('handles successful universe update', async () => {
    const mockDispatch = vi.fn(() => ({
      unwrap: () => Promise.resolve({ id: 1 }),
    }));
    const { store } = renderWithProviders(<UniverseEdit />);
    store.dispatch = mockDispatch;

    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByLabelText('Universe Name')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('Universe Name'));
    await user.type(screen.getByLabelText('Universe Name'), 'Updated Universe');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateUniverse).toHaveBeenCalledWith({
        id: '1',
        name: 'Updated Universe',
        description: mockUniverse.description,
        isPublic: mockUniverse.isPublic,
        maxParticipants: mockUniverse.maxParticipants,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/universe/1');
    });
  });

  it('handles update error', async () => {
    const mockError = new Error('Failed to update universe');
    const mockDispatch = vi.fn(() => ({
      unwrap: () => Promise.reject(mockError),
    }));
    const { store } = renderWithProviders(<UniverseEdit />);
    store.dispatch = mockDispatch;

    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByLabelText('Universe Name')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('Universe Name'));
    await user.type(screen.getByLabelText('Universe Name'), 'Updated Universe');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update universe')).toBeInTheDocument();
    });
  });

  it('handles loading state during update', async () => {
    const mockDispatch = vi.fn(() => ({
      unwrap: () => new Promise(() => {}), // Never resolves to keep loading state
    }));
    const { store } = renderWithProviders(<UniverseEdit />);
    store.dispatch = mockDispatch;

    const user = userEvent.setup();
    await waitFor(() => {
      expect(screen.getByLabelText('Universe Name')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText('Universe Name'));
    await user.type(screen.getByLabelText('Universe Name'), 'Updated Universe');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });
});

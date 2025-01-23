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
  createUniverse,
} from '../../../store/slices/universeSlice';
import UniverseCreate from '../UniverseCreate';

// Mock the createUniverse action
vi.mock('../../../store/slices/universeSlice', () => ({
  createUniverse: vi.fn(() => ({
    type: 'universe/createUniverse',
    payload: undefined,
  })),
  __esModule: true,
  default: (state = { universes: [], currentUniverse: null, status: 'idle' }) =>
    state,
}));

describe('UniverseCreate Component', () => {
  const renderWithProviders = (
    ui,
    {
      preloadedState = {
        universe: {
          universes: [],
          currentUniverse: null,
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
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
    return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
  };

  it('renders create universe form correctly', () => {
    renderWithProviders(<UniverseCreate />);

    expect(screen.getByText('Create New Universe')).toBeInTheDocument();
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
    renderWithProviders(<UniverseCreate />);

    const submitButton = screen.getByRole('button', {
      name: 'Create Universe',
    });
    await user.click(submitButton);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('handles form input changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UniverseCreate />);

    const nameInput = screen.getByLabelText('Universe Name');
    const descriptionInput = screen.getByLabelText('Description');
    const maxParticipantsInput = screen.getByLabelText('Max Participants');
    const isPublicCheckbox = screen.getByLabelText('Make Universe Public');

    await user.type(nameInput, 'Test Universe');
    await user.type(descriptionInput, 'Test Description');
    await user.clear(maxParticipantsInput);
    await user.type(maxParticipantsInput, '20');
    await user.click(isPublicCheckbox);

    expect(nameInput).toHaveValue('Test Universe');
    expect(descriptionInput).toHaveValue('Test Description');
    expect(maxParticipantsInput).toHaveValue(20);
    expect(isPublicCheckbox).toBeChecked();
  });

  it('handles successful universe creation', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    const mockDispatch = vi.fn(() => Promise.resolve({ id: 1 }));
    const { store } = renderWithProviders(<UniverseCreate />);
    store.dispatch = mockDispatch;

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Universe Name'), 'Test Universe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.click(screen.getByRole('button', { name: 'Create Universe' }));

    await waitFor(() => {
      expect(createUniverse).toHaveBeenCalledWith({
        name: 'Test Universe',
        description: 'Test Description',
        isPublic: false,
        maxParticipants: 10,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/universe/1');
    });
  });

  it('handles creation error', async () => {
    const mockError = new Error('Failed to create universe');
    const mockDispatch = vi.fn(() => Promise.reject(mockError));
    const { store } = renderWithProviders(<UniverseCreate />);
    store.dispatch = mockDispatch;

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Universe Name'), 'Test Universe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.click(screen.getByRole('button', { name: 'Create Universe' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create universe')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    const mockDispatch = vi.fn(() => new Promise(() => {})); // Never resolves to keep loading state
    const { store } = renderWithProviders(<UniverseCreate />);
    store.dispatch = mockDispatch;

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Universe Name'), 'Test Universe');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.click(screen.getByRole('button', { name: 'Create Universe' }));

    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });

  it('navigates back on cancel', async () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    const user = userEvent.setup();
    renderWithProviders(<UniverseCreate />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/universes');
  });
});

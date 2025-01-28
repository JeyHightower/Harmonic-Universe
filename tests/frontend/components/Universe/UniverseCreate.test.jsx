import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import UniverseCreate from '../../../components/Universe/UniverseCreate';

const mockStore = configureStore([]);

describe('UniverseCreate Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      universe: {
        loading: false,
        error: null,
      },
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'testuser',
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <UniverseCreate />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders universe creation form', () => {
    renderComponent();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gravity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time dilation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderComponent();
    const createButton = screen.getByRole('button', { name: /create/i });

    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  test('handles successful universe creation', async () => {
    renderComponent();

    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const gravityInput = screen.getByLabelText(/gravity/i);
    const timeDilationInput = screen.getByLabelText(/time dilation/i);
    const createButton = screen.getByRole('button', { name: /create/i });

    fireEvent.change(nameInput, { target: { value: 'Test Universe' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'A test universe' },
    });
    fireEvent.change(gravityInput, { target: { value: '9.81' } });
    fireEvent.change(timeDilationInput, { target: { value: '1.0' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      const actions = store.getActions();
      expect(actions[0].type).toBe('universe/createRequest');
      expect(actions[0].payload).toEqual({
        name: 'Test Universe',
        description: 'A test universe',
        physics_parameters: {
          gravity: 9.81,
          time_dilation: 1.0,
        },
      });
    });
  });

  test('shows error message on creation failure', async () => {
    store = mockStore({
      universe: {
        loading: false,
        error: 'Failed to create universe',
      },
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          username: 'testuser',
        },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/failed to create universe/i)
      ).toBeInTheDocument();
    });
  });

  test('validates physics parameters', async () => {
    renderComponent();

    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const gravityInput = screen.getByLabelText(/gravity/i);
    const timeDilationInput = screen.getByLabelText(/time dilation/i);
    const createButton = screen.getByRole('button', { name: /create/i });

    fireEvent.change(nameInput, { target: { value: 'Test Universe' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'A test universe' },
    });
    fireEvent.change(gravityInput, { target: { value: '-1' } }); // Invalid gravity
    fireEvent.change(timeDilationInput, { target: { value: '0' } }); // Invalid time dilation
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/gravity must be positive/i)).toBeInTheDocument();
      expect(
        screen.getByText(/time dilation must be greater than zero/i)
      ).toBeInTheDocument();
    });
  });
});

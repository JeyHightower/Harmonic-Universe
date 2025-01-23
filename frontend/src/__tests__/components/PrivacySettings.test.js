import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { PrivacySettings } from '../../components/Universe/PrivacySettings';
import { updateUniversePrivacy } from '../../store/slices/universeSlice';

const mockStore = configureStore([thunk]);

describe('PrivacySettings', () => {
  let store;
  const mockUniverse = {
    id: '123',
    name: 'Test Universe',
    isPublic: true,
    allowGuests: true,
    collaborators: [],
    viewers: []
  };

  beforeEach(() => {
    store = mockStore({
      universe: {
        currentUniverse: mockUniverse,
        loading: false,
        error: null
      }
    });
  });

  test('renders privacy settings form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/privacy settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/public universe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allow guests/i)).toBeInTheDocument();
    expect(screen.getByText(/collaborator permissions/i)).toBeInTheDocument();
    expect(screen.getByText(/viewer permissions/i)).toBeInTheDocument();
  });

  test('toggles universe visibility', async () => {
    store.dispatch = jest.fn().mockResolvedValue({
      payload: { ...mockUniverse, isPublic: false }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const visibilityToggle = screen.getByLabelText(/public universe/i);
    fireEvent.click(visibilityToggle);

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        updateUniversePrivacy({
          id: mockUniverse.id,
          isPublic: false,
          allowGuests: mockUniverse.allowGuests
        })
      );
    });
  });

  test('toggles guest access', async () => {
    store.dispatch = jest.fn().mockResolvedValue({
      payload: { ...mockUniverse, allowGuests: false }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const guestToggle = screen.getByLabelText(/allow guests/i);
    fireEvent.click(guestToggle);

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        updateUniversePrivacy({
          id: mockUniverse.id,
          isPublic: mockUniverse.isPublic,
          allowGuests: false
        })
      );
    });
  });

  test('adds collaborator', async () => {
    const newCollaborator = 'test@example.com';
    store.dispatch = jest.fn().mockResolvedValue({
      payload: {
        ...mockUniverse,
        collaborators: [{ email: newCollaborator }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    const input = screen.getByLabelText(/add collaborator/i);
    fireEvent.change(input, { target: { value: newCollaborator } });
    fireEvent.click(screen.getByText(/add/i));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            collaborators: expect.arrayContaining([newCollaborator])
          })
        })
      );
    });
  });

  test('removes collaborator', async () => {
    const collaborator = { email: 'test@example.com' };
    const universeWithCollaborator = {
      ...mockUniverse,
      collaborators: [collaborator]
    };

    store = mockStore({
      universe: {
        currentUniverse: universeWithCollaborator,
        loading: false,
        error: null
      }
    });

    store.dispatch = jest.fn().mockResolvedValue({
      payload: { ...universeWithCollaborator, collaborators: [] }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={universeWithCollaborator} />
        </BrowserRouter>
      </Provider>
    );

    const removeButton = screen.getByTestId(`remove-collaborator-${collaborator.email}`);
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            collaborators: expect.not.arrayContaining([collaborator.email])
          })
        })
      );
    });
  });

  test('displays error message', async () => {
    const error = 'Failed to update privacy settings';
    store = mockStore({
      universe: {
        currentUniverse: mockUniverse,
        loading: false,
        error
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    store = mockStore({
      universe: {
        currentUniverse: mockUniverse,
        loading: true,
        error: null
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <PrivacySettings universe={mockUniverse} />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { UniverseDetails, UniverseForm, UniverseList } from '../../components/Universe';
import {
    createUniverse,
    deleteUniverse,
    fetchUniverses,
    updateUniverse
} from '../../store/slices/universeSlice';

const mockStore = configureStore([thunk]);

describe('Universe Management', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      universe: {
        universes: [],
        currentUniverse: null,
        loading: false,
        error: null
      }
    });
  });

  describe('Universe List', () => {
    const mockUniverses = [
      { id: 1, name: 'Test Universe 1', description: 'Description 1' },
      { id: 2, name: 'Test Universe 2', description: 'Description 2' }
    ];

    test('renders universe list', async () => {
      store.dispatch = jest.fn().mockResolvedValue({ payload: mockUniverses });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseList />
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(fetchUniverses());
      });

      mockUniverses.forEach(universe => {
        expect(screen.getByText(universe.name)).toBeInTheDocument();
        expect(screen.getByText(universe.description)).toBeInTheDocument();
      });
    });

    test('handles universe deletion', async () => {
      store.dispatch = jest.fn().mockResolvedValue({ payload: { id: 1 } });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseList />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.click(screen.getByTestId('delete-universe-1'));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(deleteUniverse(1));
      });
    });
  });

  describe('Universe Form', () => {
    test('renders create universe form', () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseForm />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    test('handles universe creation', async () => {
      const mockUniverse = {
        name: 'New Universe',
        description: 'A new test universe',
        isPublic: true
      };
      store.dispatch = jest.fn().mockResolvedValue({ payload: mockUniverse });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseForm />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: mockUniverse.name }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: mockUniverse.description }
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(createUniverse(mockUniverse));
      });
    });

    test('handles universe update', async () => {
      const mockUniverse = {
        id: 1,
        name: 'Updated Universe',
        description: 'An updated test universe',
        isPublic: true
      };
      store = mockStore({
        universe: {
          currentUniverse: mockUniverse,
          loading: false,
          error: null
        }
      });
      store.dispatch = jest.fn().mockResolvedValue({ payload: mockUniverse });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseForm isEdit={true} />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: mockUniverse.name }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: mockUniverse.description }
      });
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(updateUniverse(mockUniverse));
      });
    });
  });

  describe('Universe Details', () => {
    const mockUniverse = {
      id: 1,
      name: 'Test Universe',
      description: 'A test universe',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    test('renders universe details', async () => {
      store = mockStore({
        universe: {
          currentUniverse: mockUniverse,
          loading: false,
          error: null
        }
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseDetails />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText(mockUniverse.name)).toBeInTheDocument();
      expect(screen.getByText(mockUniverse.description)).toBeInTheDocument();
      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    test('displays loading state', () => {
      store = mockStore({
        universe: {
          currentUniverse: null,
          loading: true,
          error: null
        }
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseDetails />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('displays error state', () => {
      const error = 'Failed to load universe';
      store = mockStore({
        universe: {
          currentUniverse: null,
          loading: false,
          error
        }
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <UniverseDetails />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });
});

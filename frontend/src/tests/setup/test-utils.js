import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const mockStore = configureStore([thunk]);

export const renderWithProviders = (
  component,
  { initialState = {}, store = mockStore(initialState), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(component, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  };
};

export const createMockStore = (initialState = {}) => mockStore(initialState);

export const mockAuthState = {
  auth: {
    isAuthenticated: true,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    },
    loading: false,
  },
};

export const mockUniverseState = {
  universe: {
    universes: [
      {
        id: 1,
        name: 'Test Universe',
        description: 'A test universe',
        is_public: true,
        creator_id: 1,
      },
    ],
    currentUniverse: {
      id: 1,
      name: 'Test Universe',
      description: 'A test universe',
      is_public: true,
      creator_id: 1,
      physics_parameters: { gravity: 9.81 },
    },
    loading: false,
  },
};

export const mockErrorState = {
  error: {
    message: 'Test error message',
    status: 400,
  },
};

export const mockLoadingState = {
  loading: true,
};

export const mockSuccessState = {
  success: {
    message: 'Operation successful',
  },
};

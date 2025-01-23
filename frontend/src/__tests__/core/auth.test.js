import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Login, Register } from '../../components/Auth';
import { loginUser, registerUser } from '../../store/slices/authSlice';

const mockStore = configureStore([thunk]);

describe('Authentication', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }
    });
  });

  describe('Login', () => {
    test('renders login form', () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('handles successful login', async () => {
      const mockUser = { email: 'test@example.com', password: 'password123' };
      store.dispatch = jest.fn().mockResolvedValue({ payload: mockUser });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: mockUser.email }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: mockUser.password }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(
          loginUser({ email: mockUser.email, password: mockUser.password })
        );
      });
    });

    test('displays error message on failed login', async () => {
      const error = 'Invalid credentials';
      store.dispatch = jest.fn().mockRejectedValue({ error });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(error)).toBeInTheDocument();
      });
    });
  });

  describe('Register', () => {
    test('renders registration form', () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    test('handles successful registration', async () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };
      store.dispatch = jest.fn().mockResolvedValue({ payload: mockUser });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: mockUser.username }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: mockUser.email }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: mockUser.password }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: mockUser.confirmPassword }
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(
          registerUser({
            username: mockUser.username,
            email: mockUser.email,
            password: mockUser.password
          })
        );
      });
    });

    test('validates password match', async () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password456' }
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });
});

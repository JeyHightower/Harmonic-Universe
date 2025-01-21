import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LoginPage from '../../../src/pages/LoginPage';
import SignupPage from '../../../src/pages/SignupPage';

const mockStore = configureStore([thunk]);

describe('Auth Components', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        status: 'idle',
        error: null,
      },
    });
    store.dispatch = jest.fn();
  });

  describe('LoginPage', () => {
    it('renders login form', () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /login/i })
      ).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it('displays error message', () => {
      store = mockStore({
        auth: {
          user: null,
          status: 'failed',
          error: 'Invalid credentials',
        },
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  describe('SignupPage', () => {
    it('renders signup form', () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign up/i })
      ).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it('validates form fields', async () => {
      render(
        <Provider store={store}>
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    it('displays error message', () => {
      store = mockStore({
        auth: {
          user: null,
          status: 'failed',
          error: 'Email already exists',
        },
      });

      render(
        <Provider store={store}>
          <BrowserRouter>
            <SignupPage />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });
});

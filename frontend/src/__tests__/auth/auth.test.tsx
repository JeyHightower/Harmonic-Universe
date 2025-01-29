import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import { render } from '../../test-utils';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';

describe('Authentication', () => {
  describe('Login', () => {
    it('should successfully log in with valid credentials', async () => {
      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });

    it('should show error message with invalid credentials', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ error: 'Invalid credentials' })
          );
        })
      );

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Registration', () => {
    it('should successfully register with valid data', async () => {
      render(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

    it('should show error message with invalid data', async () => {
      server.use(
        rest.post('/api/auth/register', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Email already exists' })
          );
        })
      );

      render(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Logout', () => {
    it('should successfully log out', async () => {
      // TODO: Implement logout test after NavBar component is created
    });
  });
});



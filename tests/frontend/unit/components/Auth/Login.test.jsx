import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Login from '../../../../../frontend/src/components/Auth/Login';

// Mock the auth context
vi.mock('../../../../../frontend/src/contexts/AuthContext', () => ({
    useAuth: () => ({
        login: vi.fn().mockResolvedValue({ success: true }),
        isAuthenticated: false
    })
}));

describe('Login Component', () => {
    const renderLogin = () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
    };

    it('renders login form', () => {
        renderLogin();

        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('handles form submission', async () => {
        renderLogin();

        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /login/i });

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
        });
    });

    it('displays validation errors', async () => {
        renderLogin();

        const submitButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/username is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });
    });

    it('shows error message on failed login', async () => {
        // Mock failed login
        vi.mock('../../../../../frontend/src/contexts/AuthContext', () => ({
            useAuth: () => ({
                login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
                isAuthenticated: false
            })
        }));

        renderLogin();

        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /login/i });

        fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });
});

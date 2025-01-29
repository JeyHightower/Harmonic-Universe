import { fireEvent, render, screen } from '@testing-library/react';
import { Login, LoginProps } from '../../../components/Auth/Login';

interface LoginFormData {
  username: string;
  password: string;
}

describe('Login Component', () => {
  const mockSubmit = jest.fn();

  const defaultProps: LoginProps = {
    onSubmit: (data: LoginFormData) => mockSubmit(data),
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders login form', () => {
    render(<Login {...defaultProps} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<Login {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('handles form submission', () => {
    render(<Login {...defaultProps} />);

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
  });

  it('displays loading state', () => {
    render(<Login {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });

  it('displays error message', () => {
    const errorMessage = 'Invalid credentials';
    render(<Login {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(<Login {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('validates password length', () => {
    render(<Login {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});

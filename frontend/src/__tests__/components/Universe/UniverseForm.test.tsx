import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UniverseForm } from '../../../components/Universe/UniverseForm';
import { useUniverse } from '../../../hooks/useUniverse';

// Mock the useUniverse hook
jest.mock('../../../hooks/useUniverse');

interface Universe {
  id?: number;
  name: string;
  description: string;
  is_public: boolean;
}

describe('UniverseForm', () => {
  const mockCreateUniverse = jest.fn();
  const mockUpdateUniverse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUniverse as jest.Mock).mockReturnValue({
      createUniverse: mockCreateUniverse,
      updateUniverse: mockUpdateUniverse,
      error: null,
      loading: false,
    });
  });

  it('renders create universe form', () => {
    render(<UniverseForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/public/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('renders edit universe form with existing data', () => {
    const universe: Universe = {
      id: 1,
      name: 'Test Universe',
      description: 'Test Description',
      is_public: true,
    };

    render(<UniverseForm universe={universe} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('Test Universe');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/public/i)).toBeChecked();
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('handles create universe submission', async () => {
    render(<UniverseForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    const publicCheckbox = screen.getByLabelText(/public/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'New Universe' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    fireEvent.click(publicCheckbox);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockCreateUniverse).toHaveBeenCalledWith({
        name: 'New Universe',
        description: 'New Description',
        is_public: true,
      });
    });
  });

  it('handles update universe submission', async () => {
    const universe: Universe = {
      id: 1,
      name: 'Existing Universe',
      description: 'Existing Description',
      is_public: false,
    };

    render(<UniverseForm universe={universe} />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Updated Universe' } });

    fireEvent.click(screen.getByRole('button', { name: /update/i }));

    await waitFor(() => {
      expect(mockUpdateUniverse).toHaveBeenCalledWith(1, {
        name: 'Updated Universe',
        description: 'Existing Description',
        is_public: false,
      });
    });
  });

  it('displays validation errors', async () => {
    render(<UniverseForm />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('displays error from hook', () => {
    (useUniverse as jest.Mock).mockReturnValue({
      createUniverse: mockCreateUniverse,
      updateUniverse: mockUpdateUniverse,
      error: 'Failed to create universe',
      loading: false,
    });

    render(<UniverseForm />);

    expect(screen.getByText(/failed to create universe/i)).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (useUniverse as jest.Mock).mockReturnValue({
      createUniverse: mockCreateUniverse,
      updateUniverse: mockUpdateUniverse,
      error: null,
      loading: true,
    });

    render(<UniverseForm />);

    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
  });

  it('handles form reset', () => {
    render(<UniverseForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Test' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(nameInput.value).toBe('');
    expect(descriptionInput.value).toBe('');
  });
});

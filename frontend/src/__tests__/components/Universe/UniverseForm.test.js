import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { UniverseForm } from '../../../components/Universe/UniverseForm';
import { useUniverse } from '../../../hooks/useUniverse';

jest.mock('../../../hooks/useUniverse');

describe('UniverseForm', () => {
  const mockCreateUniverse = jest.fn();
  const mockUpdateUniverse = jest.fn();

  beforeEach(() => {
    useUniverse.mockReturnValue({
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

  it('handles create universe submission', async () => {
    render(<UniverseForm />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Universe' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.click(screen.getByLabelText(/public/i));

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockCreateUniverse).toHaveBeenCalledWith({
        name: 'Test Universe',
        description: 'Test Description',
        is_public: true,
      });
    });
  });

  it('handles update universe submission', async () => {
    const universe = {
      id: 1,
      name: 'Existing Universe',
      description: 'Existing Description',
      is_public: false,
    };

    render(<UniverseForm universe={universe} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Updated Universe' },
    });

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
    useUniverse.mockReturnValue({
      createUniverse: mockCreateUniverse,
      updateUniverse: mockUpdateUniverse,
      error: 'Failed to create universe',
      loading: false,
    });

    render(<UniverseForm />);

    expect(screen.getByText(/failed to create universe/i)).toBeInTheDocument();
  });

  it('disables form submission while loading', () => {
    useUniverse.mockReturnValue({
      createUniverse: mockCreateUniverse,
      updateUniverse: mockUpdateUniverse,
      error: null,
      loading: true,
    });

    render(<UniverseForm />);

    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });
});

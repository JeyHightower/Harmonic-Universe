import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  createMockUniverse,
  renderWithProviders,
} from '../../../utils/test-utils';
import UniverseForm from '../UniverseForm';
import UniverseList from '../UniverseList';

// Mock the API calls
vi.mock('../../../services/universeService', () => ({
  universeService: {
    createUniverse: vi.fn(),
    getUniverse: vi.fn(),
    updateUniverse: vi.fn(),
    deleteUniverse: vi.fn(),
  },
}));

describe('Universe CRUD Operations', () => {
  const mockUniverse = createMockUniverse({
    id: 1,
    name: 'Test Universe',
    description: 'A test universe description',
  });

  describe('Create Universe', () => {
    it('should create a new universe', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ data: mockUniverse });
      universeService.createUniverse.mockImplementation(mockCreate);

      renderWithProviders(<UniverseForm />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Universe' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'A test universe description' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          name: 'Test Universe',
          description: 'A test universe description',
        });
      });
    });

    it('should show error message on creation failure', async () => {
      const mockError = new Error('Creation failed');
      universeService.createUniverse.mockRejectedValue(mockError);

      renderWithProviders(<UniverseForm />);

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test Universe' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/Creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Read Universe', () => {
    it('should display universe list', async () => {
      const mockUniverses = [mockUniverse];
      universeService.getUniverse.mockResolvedValue({ data: mockUniverses });

      renderWithProviders(<UniverseList />);

      await waitFor(() => {
        expect(screen.getByText('Test Universe')).toBeInTheDocument();
        expect(
          screen.getByText('A test universe description')
        ).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching', () => {
      renderWithProviders(<UniverseList />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Update Universe', () => {
    it('should update universe details', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: { ...mockUniverse, name: 'Updated Universe' },
      });
      universeService.updateUniverse.mockImplementation(mockUpdate);

      renderWithProviders(<UniverseForm universe={mockUniverse} isEdit />);

      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Updated Universe' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(mockUniverse.id, {
          ...mockUniverse,
          name: 'Updated Universe',
        });
      });
    });
  });

  describe('Delete Universe', () => {
    it('should delete universe', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ success: true });
      universeService.deleteUniverse.mockImplementation(mockDelete);

      renderWithProviders(<UniverseList />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      // Confirm deletion
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(mockUniverse.id);
      });
    });

    it('should show confirmation dialog before deletion', () => {
      renderWithProviders(<UniverseList />);

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });
  });
});

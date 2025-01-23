import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { musicService } from '../../../services/musicService';
import { renderWithProviders } from '../../../utils/test-utils';
import MusicParameters from '../MusicParameters';

// Mock the music service
vi.mock('../../../services/musicService', () => ({
  musicService: {
    getMusicParameters: vi.fn(),
    updateMusicParameters: vi.fn(),
    deleteSettings: vi.fn(),
    generateAIMusic: vi.fn(),
  },
}));

describe('Music Parameters CRUD Operations', () => {
  const mockParameters = {
    tempo: 120,
    key: 'C',
    scale: 'major',
    harmony: 0.5,
    volume: 0.8,
    reverb: 0.3,
  };

  describe('Create Music Parameters', () => {
    it('should create new music parameters', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ data: mockParameters });
      musicService.updateMusicParameters.mockImplementation(mockCreate);

      renderWithProviders(<MusicParameters />);

      // Adjust parameters
      fireEvent.change(screen.getByLabelText(/tempo/i), {
        target: { value: 120 },
      });
      fireEvent.change(screen.getByLabelText(/key/i), {
        target: { value: 'C' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            tempo: 120,
            key: 'C',
          })
        );
      });
    });

    it('should show error on creation failure', async () => {
      musicService.updateMusicParameters.mockRejectedValue(
        new Error('Creation failed')
      );

      renderWithProviders(<MusicParameters />);

      fireEvent.change(screen.getByLabelText(/tempo/i), {
        target: { value: 120 },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/Creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Read Music Parameters', () => {
    it('should load existing parameters', async () => {
      musicService.getMusicParameters.mockResolvedValue({
        data: mockParameters,
      });

      renderWithProviders(<MusicParameters universeId={1} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('120')).toBeInTheDocument();
        expect(screen.getByDisplayValue('C')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      renderWithProviders(<MusicParameters universeId={1} />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Update Music Parameters', () => {
    it('should update parameters', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: { ...mockParameters, tempo: 140 },
      });
      musicService.updateMusicParameters.mockImplementation(mockUpdate);

      renderWithProviders(<MusicParameters parameters={mockParameters} />);

      fireEvent.change(screen.getByLabelText(/tempo/i), {
        target: { value: 140 },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            tempo: 140,
          })
        );
      });
    });
  });

  describe('Delete Music Parameters', () => {
    it('should delete parameters', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ success: true });
      musicService.deleteSettings.mockImplementation(mockDelete);

      renderWithProviders(<MusicParameters universeId={1} />);

      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(1);
      });
    });

    it('should show confirmation before deletion', () => {
      renderWithProviders(<MusicParameters universeId={1} />);

      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });
  });

  describe('AI Music Generation', () => {
    it('should generate AI music', async () => {
      const mockGenerate = vi.fn().mockResolvedValue({
        data: { parameters: mockParameters },
      });
      musicService.generateAIMusic.mockImplementation(mockGenerate);

      renderWithProviders(<MusicParameters universeId={1} />);

      fireEvent.click(screen.getByRole('button', { name: /generate/i }));

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(1, expect.any(Object));
      });
    });
  });
});

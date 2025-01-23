import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { audioService } from '../../../services/audioService';
import { renderWithProviders } from '../../../utils/test-utils';
import AudioSettings from '../AudioSettings';

// Mock the audio service
vi.mock('../../../services/audioService', () => ({
  audioService: {
    getAudioSettings: vi.fn(),
    updateAudioSettings: vi.fn(),
    deleteSettings: vi.fn(),
    previewAudio: vi.fn(),
  },
}));

describe('Audio Settings CRUD Operations', () => {
  const mockSettings = {
    masterVolume: 0.8,
    effectsVolume: 0.6,
    reverbAmount: 0.3,
    delayTime: 0.4,
    compression: {
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
    },
  };

  describe('Create Audio Settings', () => {
    it('should create new audio settings', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ data: mockSettings });
      audioService.updateAudioSettings.mockImplementation(mockCreate);

      renderWithProviders(<AudioSettings />);

      // Set volume controls
      fireEvent.change(screen.getByLabelText(/master volume/i), {
        target: { value: 0.8 },
      });
      fireEvent.change(screen.getByLabelText(/effects volume/i), {
        target: { value: 0.6 },
      });

      // Set audio effects
      fireEvent.change(screen.getByLabelText(/reverb amount/i), {
        target: { value: 0.3 },
      });
      fireEvent.change(screen.getByLabelText(/delay time/i), {
        target: { value: 0.4 },
      });

      // Save settings
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            masterVolume: 0.8,
            effectsVolume: 0.6,
            reverbAmount: 0.3,
            delayTime: 0.4,
          })
        );
      });
    });

    it('should show error on creation failure', async () => {
      audioService.updateAudioSettings.mockRejectedValue(
        new Error('Creation failed')
      );

      renderWithProviders(<AudioSettings />);

      fireEvent.change(screen.getByLabelText(/master volume/i), {
        target: { value: 0.8 },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/Creation failed/i)).toBeInTheDocument();
      });
    });

    it('should validate volume ranges', async () => {
      renderWithProviders(<AudioSettings />);

      fireEvent.change(screen.getByLabelText(/master volume/i), {
        target: { value: 1.5 },
      });

      expect(
        screen.getByText(/Volume must be between 0 and 1/i)
      ).toBeInTheDocument();
    });
  });

  describe('Read Audio Settings', () => {
    it('should load existing settings', async () => {
      audioService.getAudioSettings.mockResolvedValue({
        data: mockSettings,
      });

      renderWithProviders(<AudioSettings universeId={1} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0.6')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      renderWithProviders(<AudioSettings universeId={1} />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  describe('Update Audio Settings', () => {
    it('should update settings', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: { ...mockSettings, masterVolume: 0.7 },
      });
      audioService.updateAudioSettings.mockImplementation(mockUpdate);

      renderWithProviders(<AudioSettings settings={mockSettings} />);

      fireEvent.change(screen.getByLabelText(/master volume/i), {
        target: { value: 0.7 },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            masterVolume: 0.7,
          })
        );
      });
    });
  });

  describe('Delete Audio Settings', () => {
    it('should delete settings', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ success: true });
      audioService.deleteSettings.mockImplementation(mockDelete);

      renderWithProviders(<AudioSettings universeId={1} />);

      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith(1);
      });
    });

    it('should show confirmation before deletion', () => {
      renderWithProviders(<AudioSettings universeId={1} />);

      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });
  });

  describe('Audio Preview', () => {
    it('should preview audio settings', async () => {
      const mockPreview = vi.fn().mockResolvedValue({
        data: { url: 'test-audio.mp3' },
      });
      audioService.previewAudio.mockImplementation(mockPreview);

      renderWithProviders(<AudioSettings universeId={1} />);

      fireEvent.click(screen.getByRole('button', { name: /preview/i }));

      await waitFor(() => {
        expect(mockPreview).toHaveBeenCalledWith(1);
        expect(screen.getByTestId('audio-player')).toBeInTheDocument();
      });
    });
  });
});

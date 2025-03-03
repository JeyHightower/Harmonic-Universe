import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import * as audioService from '../../../services/audioService';
import AudioDetailsModal from '../AudioDetailsModal';

// Mock the audioService
jest.mock('../../../services/audioService');

// Mock the Modal component
jest.mock('../../../components/common/Modal', () => {
  return ({ children, title, onClose }) => (
    <div data-testid="modal" aria-label={title}>
      <button data-testid="close-button" onClick={onClose}>
        Close
      </button>
      <div>{children}</div>
    </div>
  );
});

// Mock window.confirm
window.confirm = jest.fn();

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(callback, 0);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

describe('AudioDetailsModal Component', () => {
  const mockUniverseId = 'universe-123';
  const mockSceneId = 'scene-456';
  const mockAudioId = 'audio-789';
  const mockAudioUrl = 'http://example.com/audio.wav';

  const mockOnClose = jest.fn();

  const mockAudioData = {
    id: mockAudioId,
    name: 'Test Audio',
    description: 'Test Description',
    algorithm: 'harmonic_synthesis',
    duration: 120,
    key: 'C',
    scale: 'major',
    tempo: 120,
    audio_url: mockAudioUrl,
    parameters: {
      harmonicity: 1.0,
      modulation_index: 3.0,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.5,
      release: 0.8,
    },
  };

  const defaultProps = {
    universeId: mockUniverseId,
    sceneId: mockSceneId,
    audioId: mockAudioId,
    onClose: mockOnClose,
  };

  // Mock HTMLMediaElement methods
  beforeAll(() => {
    // Create a mock implementation of HTMLMediaElement
    window.HTMLMediaElement.prototype.load = jest.fn();
    window.HTMLMediaElement.prototype.play = jest.fn();
    window.HTMLMediaElement.prototype.pause = jest.fn();

    // Define getters and setters for properties that are used in the component
    Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
      writable: true,
      value: 120,
    });

    Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
      writable: true,
      value: 0,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the fetchAudioDetails function
    audioService.fetchAudioDetails.mockResolvedValue(mockAudioData);

    // Mock the deleteAudio function
    audioService.deleteAudio.mockResolvedValue(true);

    // Reset confirm mock
    window.confirm.mockReset();
    window.confirm.mockImplementation(() => true);
  });

  test('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Check that loading spinner is shown
    expect(screen.getByText(/loading audio data/i)).toBeInTheDocument();
  });

  test('renders audio details after loading', async () => {
    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Check that audio details are rendered
    expect(screen.getByText(/test audio/i)).toBeInTheDocument();
    expect(screen.getByText(/test description/i)).toBeInTheDocument();
    expect(screen.getByText(/harmonic synthesis/i)).toBeInTheDocument();

    // Check that parameters are rendered
    expect(screen.getByText(/harmonicity:/i)).toBeInTheDocument();
    expect(screen.getByText(/modulation index:/i)).toBeInTheDocument();

    // Check that audio player controls are rendered
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error message when fetching audio fails', async () => {
    // Mock the service to throw an error
    audioService.fetchAudioDetails.mockRejectedValueOnce(
      new Error('Failed to fetch audio')
    );

    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch audio/i)).toBeInTheDocument();
    });

    // Should not show audio details
    expect(screen.queryByText(/test audio/i)).not.toBeInTheDocument();
  });

  test('toggles play/pause when play button is clicked', async () => {
    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Get play button
    const playButton = screen.getByRole('button', { name: /play/i });

    // Click play button
    await userEvent.click(playButton);

    // Should call play method
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Button should now be pause
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();

    // Click pause button
    await userEvent.click(screen.getByRole('button', { name: /pause/i }));

    // Should call pause method
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();

    // Button should now be play again
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  test('seeks to position when progress bar is clicked', async () => {
    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Get progress bar
    const progressBar = screen.getByRole('progressbar');

    // Mock getBoundingClientRect
    progressBar.getBoundingClientRect = jest.fn().mockReturnValue({
      left: 0,
      width: 100,
    });

    // Click at 50% of progress bar
    fireEvent.click(progressBar, { clientX: 50 });

    // Current time should be set to 50% of duration (60 seconds)
    expect(window.HTMLMediaElement.prototype.currentTime).toBe(60);
  });

  test('deletes audio when delete button is clicked and confirmed', async () => {
    const navigate = jest.fn();

    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => navigate,
    }));

    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Click delete button
    await userEvent.click(
      screen.getByRole('button', { name: /delete audio/i })
    );

    // Confirm should have been called
    expect(window.confirm).toHaveBeenCalled();

    // Wait for delete to complete
    await waitFor(() => {
      expect(audioService.deleteAudio).toHaveBeenCalledWith(
        mockAudioId,
        mockUniverseId,
        mockSceneId
      );
    });

    // Should have called onClose
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not delete audio when delete is canceled', async () => {
    // Mock confirm to return false
    window.confirm.mockImplementationOnce(() => false);

    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Click delete button
    await userEvent.click(
      screen.getByRole('button', { name: /delete audio/i })
    );

    // Confirm should have been called
    expect(window.confirm).toHaveBeenCalled();

    // Delete should not have been called
    expect(audioService.deleteAudio).not.toHaveBeenCalled();

    // onClose should not have been called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('shows error message when delete fails', async () => {
    // Mock the service to throw an error on delete
    audioService.deleteAudio.mockRejectedValueOnce(new Error('Delete failed'));

    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Click delete button
    await userEvent.click(
      screen.getByRole('button', { name: /delete audio/i })
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/delete failed/i)).toBeInTheDocument();
    });

    // Should not have called onClose
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('closes modal when close button is clicked', async () => {
    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Click close button
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    // Should have called onClose
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('formats time correctly', async () => {
    render(
      <MemoryRouter>
        <AudioDetailsModal {...defaultProps} />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading audio data/i)).not.toBeInTheDocument();
    });

    // Check that time is formatted correctly (120 seconds = 2:00)
    expect(screen.getByText(/2:00/)).toBeInTheDocument();
  });
});

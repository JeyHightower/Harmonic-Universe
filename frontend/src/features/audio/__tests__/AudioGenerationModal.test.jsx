import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import * as audioService from '../../../services/audioService';
import AudioGenerationModal from '../AudioGenerationModal';

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

describe('AudioGenerationModal Component', () => {
  const mockUniverseId = 'universe-123';
  const mockSceneId = 'scene-456';
  const mockAudioId = 'audio-789';
  const mockAudioUrl = 'http://example.com/audio.wav';

  const mockOnClose = jest.fn();

  const defaultProps = {
    universeId: mockUniverseId,
    sceneId: mockSceneId,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the fetchAudioByParams function
    audioService.fetchAudioByParams.mockImplementation(async params => {
      if (params.preview) {
        return {
          id: mockAudioId,
          audio_url: mockAudioUrl,
        };
      }
      return {
        id: mockAudioId,
        name: params.name,
        algorithm: params.algorithm,
      };
    });
  });

  test('renders with default props', () => {
    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Check that the modal title is correct
    expect(
      screen.getByRole('heading', { name: /generate audio/i })
    ).toBeInTheDocument();

    // Check that form fields are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/algorithm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();

    // Check that buttons are rendered
    expect(
      screen.getByRole('button', { name: /generate preview/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('renders with initial data for editing', () => {
    const initialData = {
      id: mockAudioId,
      name: 'Test Audio',
      description: 'Test Description',
      algorithm: 'granular_synthesis',
      duration: 15,
      tempo: 100,
      key: 'D',
      scale: 'minor',
      parameters: {
        grain_size: 0.2,
        grain_spacing: 0.3,
        position: 0.4,
        spread: 0.5,
        density: 60,
        reverb_amount: 0.6,
      },
      audio_url: mockAudioUrl,
    };

    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} initialData={initialData} />
      </MemoryRouter>
    );

    // Check that the modal title is correct for editing
    expect(
      screen.getByRole('heading', { name: /edit audio/i })
    ).toBeInTheDocument();

    // Check that form fields are populated with initial data
    expect(screen.getByLabelText(/name/i)).toHaveValue('Test Audio');
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      'Test Description'
    );
    expect(screen.getByLabelText(/duration/i)).toHaveValue(15);
    expect(screen.getByLabelText(/tempo/i)).toHaveValue(100);

    // Check that audio preview is rendered
    expect(screen.getByText(/preview/i)).toBeInTheDocument();
    expect(screen.getByRole('audio')).toHaveAttribute('src', mockAudioUrl);

    // Check that the update button is rendered instead of save
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  test('changes algorithm and updates parameter controls', async () => {
    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Initially should show harmonic synthesis parameters
    expect(
      screen.getByText(/harmonic synthesis parameters/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/harmonicity/i)).toBeInTheDocument();

    // Change algorithm to granular synthesis
    const algorithmSelect = screen.getByLabelText(/algorithm/i);
    await userEvent.click(algorithmSelect);
    await userEvent.click(screen.getByText(/granular synthesis/i));

    // Should now show granular synthesis parameters
    expect(
      screen.getByText(/granular synthesis parameters/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/grain size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grain spacing/i)).toBeInTheDocument();

    // Change algorithm to physical modeling
    await userEvent.click(algorithmSelect);
    await userEvent.click(screen.getByText(/physical modeling/i));

    // Should now show physical modeling parameters
    expect(
      screen.getByText(/physical modeling parameters/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/stiffness/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/damping/i)).toBeInTheDocument();
  });

  test('generates audio preview when button is clicked', async () => {
    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Fill in required name field
    await userEvent.type(screen.getByLabelText(/name/i), 'Test Preview');

    // Click generate preview button
    await userEvent.click(
      screen.getByRole('button', { name: /generate preview/i })
    );

    // Should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();

    // Wait for preview to be generated
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /generate preview/i })
      ).toBeInTheDocument();
    });

    // Should have called the service with correct parameters
    expect(audioService.fetchAudioByParams).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Preview',
        universe_id: mockUniverseId,
        scene_id: mockSceneId,
        preview: true,
      })
    );

    // Audio preview should be rendered
    expect(screen.getByText(/preview/i)).toBeInTheDocument();
    expect(screen.getByRole('audio')).toHaveAttribute('src', mockAudioUrl);
  });

  test('shows error message when preview generation fails', async () => {
    // Mock the service to throw an error
    audioService.fetchAudioByParams.mockRejectedValueOnce(
      new Error('Preview failed')
    );

    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Click generate preview button
    await userEvent.click(
      screen.getByRole('button', { name: /generate preview/i })
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/preview failed/i)).toBeInTheDocument();
    });

    // Should not show audio preview
    expect(screen.queryByRole('audio')).not.toBeInTheDocument();
  });

  test('submits form and navigates on successful save', async () => {
    const navigate = jest.fn();

    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => navigate,
    }));

    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Fill in required name field
    await userEvent.type(screen.getByLabelText(/name/i), 'Test Audio');

    // Click save button
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Should show loading state
    expect(screen.getByText(/saving/i)).toBeInTheDocument();

    // Wait for save to complete
    await waitFor(() => {
      expect(audioService.fetchAudioByParams).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Audio',
          universe_id: mockUniverseId,
          scene_id: mockSceneId,
          preview: false,
        })
      );
    });

    // Should have called onClose
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows error message when form submission fails', async () => {
    // Mock the service to throw an error on save
    audioService.fetchAudioByParams.mockImplementation(async params => {
      if (!params.preview) {
        throw new Error('Save failed');
      }
      return {
        id: mockAudioId,
        audio_url: mockAudioUrl,
      };
    });

    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Fill in required name field
    await userEvent.type(screen.getByLabelText(/name/i), 'Test Audio');

    // Click save button
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/save failed/i)).toBeInTheDocument();
    });

    // Should not have called onClose
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('validates required fields before submission', async () => {
    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Leave name field empty

    // Click save button
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // Should show validation error
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();

    // Should not have called the service
    expect(audioService.fetchAudioByParams).not.toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    render(
      <MemoryRouter>
        <AudioGenerationModal {...defaultProps} />
      </MemoryRouter>
    );

    // Click cancel button
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Should have called onClose
    expect(mockOnClose).toHaveBeenCalled();
  });
});

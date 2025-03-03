import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import VisualizationFormModal from '../VisualizationFormModal';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Modal component
jest.mock('../../../components/common/Modal', () => {
  return ({ children, title, onClose }) => (
    <div data-testid="modal" aria-label={title}>
      <h2>{title || 'Modal Title'}</h2>
      <button data-testid="close-button" onClick={onClose}>
        Close
      </button>
      <div>{children}</div>
    </div>
  );
});

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('VisualizationFormModal Component', () => {
  const mockUniverseId = 'universe-123';
  const mockSceneId = 'scene-456';
  const mockVisualizationId = 'visualization-789';

  const mockOnClose = jest.fn();

  const defaultProps = {
    universeId: mockUniverseId,
    sceneId: mockSceneId,
    onClose: mockOnClose,
  };

  const mockVisualizationData = {
    id: mockVisualizationId,
    name: 'Test Visualization',
    type: 'WAVEFORM',
    parameters: {
      particleCount: 200,
      particleSize: 8,
      particleColor: '#FF5500',
      backgroundColor: '#111111',
      speedFactor: 2.0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful fetch responses
    global.fetch.mockImplementation(url => {
      if (url.includes(`/visualizations/${mockVisualizationId}`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVisualizationData),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'new-visualization-id' }),
      });
    });
  });

  test('renders create form with default values', () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal {...defaultProps} />
      </MemoryRouter>
    );

    // Check that the modal title is correct
    expect(screen.getByText('Create Visualization')).toBeInTheDocument();

    // Check that form fields are rendered with default values
    expect(screen.getByLabelText(/visualization name/i)).toHaveValue('');
    expect(screen.getByLabelText(/visualization type/i)).toHaveValue(
      'PARTICLE'
    );
    expect(screen.getByLabelText(/particle count/i)).toHaveValue(100);
    expect(screen.getByLabelText(/particle size/i)).toHaveValue(5);
    expect(screen.getByLabelText(/particle color/i)).toHaveValue('#00AAFF');
    expect(screen.getByLabelText(/background color/i)).toHaveValue('#000000');
    expect(screen.getByLabelText(/speed factor/i)).toHaveValue(1.0);

    // Check that buttons are rendered
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create visualization/i })
    ).toBeInTheDocument();
  });

  test('renders loading state when fetching visualization data', () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal
          {...defaultProps}
          visualizationId={mockVisualizationId}
        />
      </MemoryRouter>
    );

    // Check that loading spinner is shown
    expect(screen.getByText(/loading visualization data/i)).toBeInTheDocument();
  });

  test('renders edit form with fetched data', async () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal
          {...defaultProps}
          visualizationId={mockVisualizationId}
        />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(
        screen.queryByText(/loading visualization data/i)
      ).not.toBeInTheDocument();
    });

    // Check that the modal title is correct for editing
    expect(screen.getByText('Edit Visualization')).toBeInTheDocument();

    // Check that form fields are populated with fetched data
    expect(screen.getByLabelText(/visualization name/i)).toHaveValue(
      'Test Visualization'
    );
    expect(screen.getByLabelText(/visualization type/i)).toHaveValue(
      'WAVEFORM'
    );
    expect(screen.getByLabelText(/background color/i)).toHaveValue('#111111');
    expect(screen.getByLabelText(/speed factor/i)).toHaveValue(2.0);

    // Check that the save button is rendered
    expect(
      screen.getByRole('button', { name: /save changes/i })
    ).toBeInTheDocument();
  });

  test('shows error message when fetching visualization fails', async () => {
    // Mock fetch to return an error
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to fetch' }),
      })
    );

    render(
      <MemoryRouter>
        <VisualizationFormModal
          {...defaultProps}
          visualizationId={mockVisualizationId}
        />
      </MemoryRouter>
    );

    // Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch visualization data/i)
      ).toBeInTheDocument();
    });
  });

  test('updates form values when inputs change', async () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal {...defaultProps} />
      </MemoryRouter>
    );

    // Change name
    await userEvent.type(
      screen.getByLabelText(/visualization name/i),
      'New Visualization'
    );
    expect(screen.getByLabelText(/visualization name/i)).toHaveValue(
      'New Visualization'
    );

    // Change type
    await userEvent.selectOptions(
      screen.getByLabelText(/visualization type/i),
      'SPECTRUM'
    );
    expect(screen.getByLabelText(/visualization type/i)).toHaveValue(
      'SPECTRUM'
    );

    // Change particle count
    await userEvent.clear(screen.getByLabelText(/particle count/i));
    await userEvent.type(screen.getByLabelText(/particle count/i), '150');
    expect(screen.getByLabelText(/particle count/i)).toHaveValue(150);

    // Change speed factor
    await userEvent.clear(screen.getByLabelText(/speed factor/i));
    await userEvent.type(screen.getByLabelText(/speed factor/i), '2.5');
    expect(screen.getByLabelText(/speed factor/i)).toHaveValue(2.5);
  });

  test('submits form data when create button is clicked', async () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal {...defaultProps} />
      </MemoryRouter>
    );

    // Fill in required name field
    await userEvent.type(
      screen.getByLabelText(/visualization name/i),
      'New Visualization'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /create visualization/i })
    );

    // Check that fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/visualizations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"name":"New Visualization"'),
        })
      );
    });

    // Check that the body contains the universe and scene IDs
    const fetchCall = global.fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.universe_id).toBe(mockUniverseId);
    expect(requestBody.scene_id).toBe(mockSceneId);

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('submits form data when save button is clicked in edit mode', async () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal
          {...defaultProps}
          visualizationId={mockVisualizationId}
        />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(
        screen.queryByText(/loading visualization data/i)
      ).not.toBeInTheDocument();
    });

    // Change name
    await userEvent.clear(screen.getByLabelText(/visualization name/i));
    await userEvent.type(
      screen.getByLabelText(/visualization name/i),
      'Updated Visualization'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i })
    );

    // Check that fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/visualizations/${mockVisualizationId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"name":"Updated Visualization"'),
        })
      );
    });

    // Check that the body does NOT contain the universe and scene IDs for edit
    const fetchCall = global.fetch.mock.calls[1]; // Second call (first was to fetch data)
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.universe_id).toBeUndefined();
    expect(requestBody.scene_id).toBeUndefined();

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows error message when form submission fails', async () => {
    // Mock fetch to return an error on POST
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Validation failed' }),
      })
    );

    render(
      <MemoryRouter>
        <VisualizationFormModal {...defaultProps} />
      </MemoryRouter>
    );

    // Fill in required name field
    await userEvent.type(
      screen.getByLabelText(/visualization name/i),
      'New Visualization'
    );

    // Submit form
    await userEvent.click(
      screen.getByRole('button', { name: /create visualization/i })
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
    });

    // Check that onClose was not called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal {...defaultProps} />
      </MemoryRouter>
    );

    // Click cancel button
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Check that onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows different parameters based on visualization type', async () => {
    render(
      <MemoryRouter>
        <VisualizationFormModal {...defaultProps} />
      </MemoryRouter>
    );

    // Initially should show particle parameters
    expect(screen.getByLabelText(/particle count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/particle size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/particle color/i)).toBeInTheDocument();

    // Change type to WAVEFORM
    await userEvent.selectOptions(
      screen.getByLabelText(/visualization type/i),
      'WAVEFORM'
    );

    // Should no longer show particle-specific parameters
    expect(screen.queryByLabelText(/particle count/i)).not.toBeInTheDocument();

    // But should still show common parameters
    expect(screen.getByLabelText(/background color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/speed factor/i)).toBeInTheDocument();
  });
});

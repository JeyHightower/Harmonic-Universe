import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ParameterManager from '../../components/Universe/ParameterManager';

// Mock the WebSocket service
vi.mock('../../services/WebSocketService', () => ({
  WebSocketService: {
    getInstance: () => ({
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    }),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('ParameterManager', () => {
  const mockParameters = {
    gravity: 50,
    friction: 0.5,
    elasticity: 0.7,
  };

  beforeEach(() => {
    fetch.mockReset();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      universeId: '1',
      type: 'physics',
      parameters: mockParameters,
      ...props,
    };
    return render(<ParameterManager {...defaultProps} />);
  };

  it('renders all parameters with correct values', () => {
    renderComponent();

    expect(screen.getByText('Gravity')).toBeInTheDocument();
    expect(screen.getByText('Friction')).toBeInTheDocument();
    expect(screen.getByText('Elasticity')).toBeInTheDocument();
  });

  it('updates parameter value when slider changes', () => {
    renderComponent();

    const gravitySlider = screen.getByRole('slider', { name: /Gravity/i });
    fireEvent.change(gravitySlider, { target: { value: 75 } });

    expect(gravitySlider.value).toBe('75');
  });

  it('emits websocket event when parameter changes', () => {
    renderComponent();

    const ws = WebSocketService.getInstance();
    const gravitySlider = screen.getByRole('slider', { name: /Gravity/i });

    fireEvent.change(gravitySlider, { target: { value: 75 } });

    expect(ws.emit).toHaveBeenCalledWith('parameter_update', {
      universe_id: '1',
      type: 'physics',
      parameter: 'gravity',
      value: 75,
    });
  });

  it('saves parameters when save button is clicked', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    }));

    renderComponent();

    const saveButton = screen.getByTestId('SaveIcon').closest('button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/universes/1/parameters/physics',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockParameters),
        })
      );
    });
  });

  it('shows error message when save fails', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Failed to save')));

    renderComponent();

    const saveButton = screen.getByTestId('SaveIcon').closest('button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save parameters')).toBeInTheDocument();
    });
  });

  it('resets parameters when reset button is clicked', () => {
    renderComponent();

    const gravitySlider = screen.getByRole('slider', { name: /Gravity/i });
    fireEvent.change(gravitySlider, { target: { value: 75 } });

    const resetButton = screen.getByTestId('RefreshIcon').closest('button');
    fireEvent.click(resetButton);

    expect(gravitySlider.value).toBe('50');
  });

  it('updates when receiving websocket events', () => {
    const { rerender } = renderComponent();

    const ws = WebSocketService.getInstance();
    const handleParameterUpdate = ws.on.mock.calls[0][1];

    handleParameterUpdate({
      universe_id: '1',
      parameter: 'gravity',
      value: 80,
    });

    rerender(
      <ParameterManager
        universeId="1"
        type="physics"
        parameters={{ ...mockParameters, gravity: 80 }}
      />
    );

    const gravitySlider = screen.getByRole('slider', { name: /Gravity/i });
    expect(gravitySlider.value).toBe('80');
  });
});

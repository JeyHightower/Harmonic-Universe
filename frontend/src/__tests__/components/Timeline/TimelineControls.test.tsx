import { fireEvent, screen } from '@testing-library/react';
import { TimelineControls } from '../../../components/Timeline/TimelineControls';
import { renderWithProviders } from '../../../utils/test-utils';

describe('TimelineControls', () => {
  const mockOnPlay = jest.fn();
  const mockOnPause = jest.fn();
  const mockOnStop = jest.fn();
  const mockOnSeek = jest.fn();
  const mockOnZoom = jest.fn();

  const defaultProps = {
    isPlaying: false,
    currentTime: 0,
    duration: 100,
    zoom: 1,
    onPlay: mockOnPlay,
    onPause: mockOnPause,
    onStop: mockOnStop,
    onSeek: mockOnSeek,
    onZoom: mockOnZoom,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline controls with initial state', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop')).toBeInTheDocument();
    expect(screen.getByLabelText('Timeline Slider')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom Slider')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument(); // Current time
    expect(screen.getByText('01:40')).toBeInTheDocument(); // Duration
  });

  it('toggles play/pause state', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    // Click play
    fireEvent.click(screen.getByLabelText('Play'));
    expect(mockOnPlay).toHaveBeenCalled();

    // Render with isPlaying true
    renderWithProviders(<TimelineControls {...defaultProps} isPlaying={true} />);

    // Click pause
    fireEvent.click(screen.getByLabelText('Pause'));
    expect(mockOnPause).toHaveBeenCalled();
  });

  it('handles stop button click', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Stop'));
    expect(mockOnStop).toHaveBeenCalled();
  });

  it('updates timeline position on seek', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    const slider = screen.getByLabelText('Timeline Slider');
    fireEvent.change(slider, { target: { value: '50' } });

    expect(mockOnSeek).toHaveBeenCalledWith(50);
  });

  it('updates zoom level', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    const zoomSlider = screen.getByLabelText('Zoom Slider');
    fireEvent.change(zoomSlider, { target: { value: '2' } });

    expect(mockOnZoom).toHaveBeenCalledWith(2);
  });

  it('displays formatted time correctly', () => {
    renderWithProviders(
      <TimelineControls
        {...defaultProps}
        currentTime={65}
        duration={185}
      />
    );

    expect(screen.getByText('01:05')).toBeInTheDocument(); // Current time
    expect(screen.getByText('03:05')).toBeInTheDocument(); // Duration
  });

  it('disables controls when no duration', () => {
    renderWithProviders(
      <TimelineControls
        {...defaultProps}
        duration={0}
      />
    );

    expect(screen.getByLabelText('Play')).toBeDisabled();
    expect(screen.getByLabelText('Stop')).toBeDisabled();
    expect(screen.getByLabelText('Timeline Slider')).toBeDisabled();
  });

  it('handles keyboard shortcuts', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    // Space key toggles play/pause
    fireEvent.keyDown(document, { key: ' ' });
    expect(mockOnPlay).toHaveBeenCalled();

    // Escape key stops playback
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnStop).toHaveBeenCalled();

    // Arrow keys seek
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(mockOnSeek).toHaveBeenCalledWith(5); // 5 second skip forward

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(mockOnSeek).toHaveBeenCalledWith(-5); // 5 second skip backward
  });

  it('updates time display during playback', async () => {
    const { rerender } = renderWithProviders(
      <TimelineControls {...defaultProps} currentTime={0} />
    );

    expect(screen.getByText('00:00')).toBeInTheDocument();

    // Simulate time update during playback
    rerender(
      <TimelineControls {...defaultProps} currentTime={30} />
    );

    expect(screen.getByText('00:30')).toBeInTheDocument();
  });

  it('maintains zoom level state', () => {
    const { rerender } = renderWithProviders(
      <TimelineControls {...defaultProps} zoom={1} />
    );

    const zoomSlider = screen.getByLabelText('Zoom Slider');
    fireEvent.change(zoomSlider, { target: { value: '2' } });
    expect(mockOnZoom).toHaveBeenCalledWith(2);

    rerender(
      <TimelineControls {...defaultProps} zoom={2} />
    );

    expect(zoomSlider).toHaveValue('2');
  });

  it('handles rapid play/pause toggles', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    const playButton = screen.getByLabelText('Play');

    // Rapid clicks
    fireEvent.click(playButton);
    fireEvent.click(playButton);
    fireEvent.click(playButton);

    expect(mockOnPlay).toHaveBeenCalledTimes(1);
  });

  it('prevents seeking beyond duration bounds', () => {
    renderWithProviders(<TimelineControls {...defaultProps} />);

    const slider = screen.getByLabelText('Timeline Slider');

    // Try to seek beyond duration
    fireEvent.change(slider, { target: { value: '150' } });
    expect(mockOnSeek).not.toHaveBeenCalledWith(150);

    // Try to seek before 0
    fireEvent.change(slider, { target: { value: '-10' } });
    expect(mockOnSeek).not.toHaveBeenCalledWith(-10);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { TimelineControls } from '../../../components/Storyboard/TimelineControls';
import { theme } from '../../../theme';

const mockScenes = [
  {
    id: 1,
    content: { duration: 60 },
  },
  {
    id: 2,
    content: { duration: 120 },
  },
];

const mockVisualEffects = [
  {
    startTime: 10,
    duration: 20,
    type: 'fade',
  },
];

const mockAudioTracks = [
  {
    startTime: 30,
    duration: 40,
    type: 'background',
  },
];

const renderWithTheme = ui => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('TimelineControls', () => {
  const mockProps = {
    currentTime: 0,
    isPlaying: false,
    scenes: mockScenes,
    visualEffects: mockVisualEffects,
    audioTracks: mockAudioTracks,
    onTimeUpdate: jest.fn(),
    onPlayPause: jest.fn(),
    onAddVisualEffect: jest.fn(),
    onUpdateVisualEffect: jest.fn(),
    onRemoveVisualEffect: jest.fn(),
    onAddAudioTrack: jest.fn(),
    onUpdateAudioTrack: jest.fn(),
    onRemoveAudioTrack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders playback controls', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByTitle('Add visual effect')).toBeInTheDocument();
    expect(screen.getByTitle('Add audio track')).toBeInTheDocument();
  });

  it('displays current time', () => {
    renderWithTheme(<TimelineControls {...mockProps} currentTime={65} />);

    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('toggles play/pause button', () => {
    const { rerender } = renderWithTheme(<TimelineControls {...mockProps} />);

    const playButton = screen.getByTitle('Play');
    fireEvent.click(playButton);
    expect(mockProps.onPlayPause).toHaveBeenCalled();

    rerender(<TimelineControls {...mockProps} isPlaying={true} />);
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
  });

  it('handles adding visual effect', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    const addButton = screen.getByTitle('Add visual effect');
    fireEvent.click(addButton);
    expect(mockProps.onAddVisualEffect).toHaveBeenCalledWith({
      startTime: 0,
    });
  });

  it('handles adding audio track', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    const addButton = screen.getByTitle('Add audio track');
    fireEvent.click(addButton);
    expect(mockProps.onAddAudioTrack).toHaveBeenCalledWith({
      startTime: 0,
    });
  });

  it('renders time markers', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    // Total duration is 180 seconds (60 + 120)
    // Markers are placed every 30 seconds
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
    expect(screen.getByText('2:30')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('renders visual effects and audio tracks', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    const visualEffect = screen.getByTitle('fade');
    expect(visualEffect).toBeInTheDocument();
    expect(visualEffect).toHaveStyle({
      left: '1000px', // 10 seconds * 100 pixels per second
      width: '2000px', // 20 seconds * 100 pixels per second
    });

    const audioTrack = screen.getByTitle('background');
    expect(audioTrack).toBeInTheDocument();
    expect(audioTrack).toHaveStyle({
      left: '3000px', // 30 seconds * 100 pixels per second
      width: '4000px', // 40 seconds * 100 pixels per second
    });
  });

  it('handles clicking visual effect', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    const visualEffect = screen.getByTitle('fade');
    fireEvent.click(visualEffect);
    expect(mockProps.onUpdateVisualEffect).toHaveBeenCalledWith(
      mockVisualEffects[0]
    );
  });

  it('handles clicking audio track', () => {
    renderWithTheme(<TimelineControls {...mockProps} />);

    const audioTrack = screen.getByTitle('background');
    fireEvent.click(audioTrack);
    expect(mockProps.onUpdateAudioTrack).toHaveBeenCalledWith(
      mockAudioTracks[0]
    );
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import TrackList from '../components/Music/TrackList';
import * as audioSlice from '../store/slices/audioSlice';

const mockStore = configureStore([]);

describe('TrackList', () => {
  let store;

  const initialState = {
    audio: {
      tracks: [
        {
          id: 1,
          name: 'Track 1',
          isPlaying: false,
          isMuted: false,
          isSolo: false,
          volume: 0,
          pan: 0,
        },
      ],
      activeTrackId: 1,
      masterVolume: 0,
    },
  };

  beforeEach(() => {
    store = mockStore(initialState);
    store.dispatch = jest.fn();
  });

  test('renders track list with initial track', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    expect(screen.getByText('Tracks')).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
  });

  test('handles adding new track', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add Track'));
    expect(store.dispatch).toHaveBeenCalledWith(audioSlice.addTrack());
  });

  test('handles removing track', () => {
    const storeWithMultipleTracks = mockStore({
      audio: {
        ...initialState.audio,
        tracks: [
          ...initialState.audio.tracks,
          {
            id: 2,
            name: 'Track 2',
            isPlaying: false,
            isMuted: false,
            isSolo: false,
            volume: 0,
            pan: 0,
          },
        ],
      },
    });
    storeWithMultipleTracks.dispatch = jest.fn();

    render(
      <Provider store={storeWithMultipleTracks}>
        <TrackList />
      </Provider>
    );

    const removeButtons = screen.getAllByTitle('Remove track');
    fireEvent.click(removeButtons[1]); // Remove second track
    expect(storeWithMultipleTracks.dispatch).toHaveBeenCalledWith(
      audioSlice.removeTrack(2)
    );
  });

  test('handles track mute toggle', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    fireEvent.click(screen.getByTitle('Mute track'));
    expect(store.dispatch).toHaveBeenCalledWith(
      audioSlice.setTrackMute({ trackId: 1, isMuted: true })
    );
  });

  test('handles track solo toggle', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    fireEvent.click(screen.getByTitle('Solo track'));
    expect(store.dispatch).toHaveBeenCalledWith(
      audioSlice.setTrackSolo({ trackId: 1, isSolo: true })
    );
  });

  test('handles volume change', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    const volumeSlider = screen.getByLabelText('Volume');
    fireEvent.change(volumeSlider, { target: { value: '-6' } });
    expect(store.dispatch).toHaveBeenCalledWith(
      audioSlice.setTrackVolume({ trackId: 1, volume: -6 })
    );
  });

  test('handles pan change', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    const panSlider = screen.getByLabelText('Pan');
    fireEvent.change(panSlider, { target: { value: '0.5' } });
    expect(store.dispatch).toHaveBeenCalledWith(
      audioSlice.setTrackPan({ trackId: 1, pan: 0.5 })
    );
  });

  test('handles master volume change', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    const masterVolumeSlider = screen.getByLabelText('Master Volume');
    fireEvent.change(masterVolumeSlider, { target: { value: '-12' } });
    expect(store.dispatch).toHaveBeenCalledWith(
      audioSlice.setMasterVolume(-12)
    );
  });

  test('displays track as active when selected', () => {
    render(
      <Provider store={store}>
        <TrackList />
      </Provider>
    );

    const track = screen.getByText('Track 1').closest('div[class*="track"]');
    expect(track).toHaveClass('active');
  });

  test('displays correct volume value', () => {
    const storeWithVolume = mockStore({
      audio: {
        ...initialState.audio,
        tracks: [
          {
            ...initialState.audio.tracks[0],
            volume: -6,
          },
        ],
      },
    });

    render(
      <Provider store={storeWithVolume}>
        <TrackList />
      </Provider>
    );

    expect(screen.getByText('-6.0 dB')).toBeInTheDocument();
  });

  test('displays correct pan value', () => {
    const storeWithPan = mockStore({
      audio: {
        ...initialState.audio,
        tracks: [
          {
            ...initialState.audio.tracks[0],
            pan: 0.5,
          },
        ],
      },
    });

    render(
      <Provider store={storeWithPan}>
        <TrackList />
      </Provider>
    );

    expect(screen.getByText('R50')).toBeInTheDocument();
  });
});

import audioReducer, {
  addTrack,
  clearTracks,
  removeTrack,
  setPlaybackStatus,
  updateBpm,
  updateTrackVolume,
} from '../../redux/audioSlice';

describe('audioSlice', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      tracks: [],
      isPlaying: false,
      bpm: 120,
      masterVolume: 1,
    };
  });

  test('should handle initial state', () => {
    expect(audioReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle addTrack', () => {
    const actual = audioReducer(
      initialState,
      addTrack({
        id: '1',
        type: 'synth',
        volume: 0.8,
        notes: [],
      })
    );

    expect(actual.tracks).toHaveLength(1);
    expect(actual.tracks[0]).toEqual({
      id: '1',
      type: 'synth',
      volume: 0.8,
      notes: [],
    });
  });

  test('should handle removeTrack', () => {
    const stateWithTrack = {
      ...initialState,
      tracks: [
        {
          id: '1',
          type: 'synth',
          volume: 0.8,
          notes: [],
        },
      ],
    };

    const actual = audioReducer(stateWithTrack, removeTrack('1'));
    expect(actual.tracks).toHaveLength(0);
  });

  test('should handle updateTrackVolume', () => {
    const stateWithTrack = {
      ...initialState,
      tracks: [
        {
          id: '1',
          type: 'synth',
          volume: 0.8,
          notes: [],
        },
      ],
    };

    const actual = audioReducer(
      stateWithTrack,
      updateTrackVolume({
        id: '1',
        volume: 0.5,
      })
    );

    expect(actual.tracks[0].volume).toBe(0.5);
  });

  test('should handle setPlaybackStatus', () => {
    const actual = audioReducer(initialState, setPlaybackStatus(true));
    expect(actual.isPlaying).toBe(true);
  });

  test('should handle updateBpm', () => {
    const actual = audioReducer(initialState, updateBpm(140));
    expect(actual.bpm).toBe(140);
  });

  test('should handle clearTracks', () => {
    const stateWithTracks = {
      ...initialState,
      tracks: [
        { id: '1', type: 'synth', volume: 0.8, notes: [] },
        { id: '2', type: 'synth', volume: 0.7, notes: [] },
      ],
    };

    const actual = audioReducer(stateWithTracks, clearTracks());
    expect(actual.tracks).toHaveLength(0);
  });

  test('should not modify state for unknown action types', () => {
    const state = {
      ...initialState,
      tracks: [{ id: '1', type: 'synth', volume: 0.8, notes: [] }],
    };

    const actual = audioReducer(state, { type: 'unknown' });
    expect(actual).toEqual(state);
  });
});

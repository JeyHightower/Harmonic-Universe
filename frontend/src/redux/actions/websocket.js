// Action Types
export const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
export const SET_CURRENT_ROOM = 'SET_CURRENT_ROOM';
export const SET_ERROR = 'SET_ERROR';
export const UPDATE_PARAMETERS = 'UPDATE_PARAMETERS';
export const ADD_PARTICIPANT = 'ADD_PARTICIPANT';
export const REMOVE_PARTICIPANT = 'REMOVE_PARTICIPANT';
export const SET_MUSIC_DATA = 'SET_MUSIC_DATA';
export const SET_VISUALIZATION_DATA = 'SET_VISUALIZATION_DATA';

// Action Creators
export const setConnectionStatus = isConnected => ({
  type: SET_CONNECTION_STATUS,
  payload: isConnected,
});

export const setCurrentRoom = room => ({
  type: SET_CURRENT_ROOM,
  payload: room,
});

export const setError = error => ({
  type: SET_ERROR,
  payload: error,
});

export const updateParameters = parameters => ({
  type: UPDATE_PARAMETERS,
  payload: parameters,
});

export const addParticipant = participant => ({
  type: ADD_PARTICIPANT,
  payload: participant,
});

export const removeParticipant = userId => ({
  type: REMOVE_PARTICIPANT,
  payload: userId,
});

export const setMusicData = musicData => ({
  type: SET_MUSIC_DATA,
  payload: musicData,
});

export const setVisualizationData = visualizationData => ({
  type: SET_VISUALIZATION_DATA,
  payload: visualizationData,
});

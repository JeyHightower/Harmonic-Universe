import {
  ADD_PARTICIPANT,
  REMOVE_PARTICIPANT,
  SET_CONNECTION_STATUS,
  SET_CURRENT_ROOM,
  SET_ERROR,
  SET_MUSIC_DATA,
  SET_VISUALIZATION_DATA,
  UPDATE_PARAMETERS,
} from '../actions/websocket';

const initialState = {
  connected: false,
  currentRoom: null,
  error: null,
  participants: {},
  parameters: {
    physics: {
      gravity: 9.81,
      friction: 0.5,
      elasticity: 0.7,
      airResistance: 0.1,
      density: 1.0,
    },
    music: {
      harmony: 0.5,
      tempo: 120,
      key: 'C',
      scale: 'major',
    },
    visualization: {
      brightness: 0.8,
      saturation: 0.7,
      complexity: 0.5,
      colorScheme: 'rainbow',
    },
  },
  musicData: null,
  visualizationData: null,
};

const websocketReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_CONNECTION_STATUS:
      return {
        ...state,
        connected: action.payload,
        error: null, // Clear any connection-related errors
      };

    case SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.payload,
        error: null,
      };

    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case UPDATE_PARAMETERS:
      return {
        ...state,
        parameters: {
          ...state.parameters,
          physics: {
            ...state.parameters.physics,
            ...(action.payload.physics || {}),
          },
          music: {
            ...state.parameters.music,
            ...(action.payload.music || {}),
          },
          visualization: {
            ...state.parameters.visualization,
            ...(action.payload.visualization || {}),
          },
        },
      };

    case ADD_PARTICIPANT:
      return {
        ...state,
        participants: {
          ...state.participants,
          [action.payload.user_id]: action.payload,
        },
      };

    case REMOVE_PARTICIPANT:
      const { [action.payload]: removed, ...remainingParticipants } =
        state.participants;
      return {
        ...state,
        participants: remainingParticipants,
      };

    case SET_MUSIC_DATA:
      return {
        ...state,
        musicData: action.payload,
      };

    case SET_VISUALIZATION_DATA:
      return {
        ...state,
        visualizationData: action.payload,
      };

    default:
      return state;
  }
};

export default websocketReducer;

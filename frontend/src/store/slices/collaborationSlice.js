import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cursors: {},
  chatMessages: [],
  comments: [],
  activeUsers: {},
  currentVersion: 0,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    updateCollaborationState: (state, action) => {
      switch (action.payload.type) {
        case 'INITIAL_STATE':
          return {
            ...state,
            cursors: action.payload.data.cursors.reduce((acc, cursor) => {
              acc[cursor.user_id] = cursor;
              return acc;
            }, {}),
            chatMessages: action.payload.data.chat_messages,
            comments: action.payload.data.comments,
            activeUsers: action.payload.data.active_users,
            currentVersion: action.payload.data.current_version,
          };

        case 'USER_JOINED':
          return {
            ...state,
            activeUsers: {
              ...state.activeUsers,
              [action.payload.user_id]: action.payload.username,
            },
          };

        case 'USER_LEFT':
          const { [action.payload.user_id]: _, ...remainingUsers } = state.activeUsers;
          const { [action.payload.user_id]: __, ...remainingCursors } = state.cursors;
          return {
            ...state,
            activeUsers: remainingUsers,
            cursors: remainingCursors,
          };

        case 'CURSOR_UPDATE':
          return {
            ...state,
            cursors: {
              ...state.cursors,
              [action.payload.user_id]: action.payload,
            },
          };

        case 'CHAT_MESSAGE':
          return {
            ...state,
            chatMessages: [...state.chatMessages, action.payload],
          };

        case 'ADD_COMMENT':
          return {
            ...state,
            comments: [...state.comments, action.payload],
          };

        case 'RESOLVE_COMMENT':
          return {
            ...state,
            comments: state.comments.map(comment =>
              comment.id === action.payload.comment_id ? { ...comment, resolved: true } : comment
            ),
          };

        default:
          return state;
      }
    },
    clearCollaborationState: () => initialState,
  },
});

export const { updateCollaborationState, clearCollaborationState } = collaborationSlice.actions;
export default collaborationSlice.reducer;

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';

export const searchUsers = createAsyncThunk(
  'users/search',
  async (query, { rejectWithValue }) => {
    try {
      return await userService.searchUsers(query);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUsersByIds = createAsyncThunk(
  'users/fetchByIds',
  async (userIds, { rejectWithValue }) => {
    try {
      return await userService.getUsersByIds(userIds);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  searchResults: [],
  userDetails: {},
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSearchResults: state => {
      state.searchResults = [];
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Search Users
      .addCase(searchUsers.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Users by IDs
      .addCase(fetchUsersByIds.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersByIds.fulfilled, (state, action) => {
        state.isLoading = false;
        // Convert array of users to object with IDs as keys
        const userMap = action.payload.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        state.userDetails = { ...state.userDetails, ...userMap };
      })
      .addCase(fetchUsersByIds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, clearError } = userSlice.actions;
export default userSlice.reducer;

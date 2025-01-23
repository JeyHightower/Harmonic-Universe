import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const searchUsers = createAsyncThunk('users/search', async query => {
  const response = await fetch(
    `/api/users/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error('Failed to search users');
  return await response.json();
});

export const fetchUsersByIds = createAsyncThunk(
  'users/fetchByIds',
  async userIds => {
    const response = await fetch('/api/users/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  searchResults: [],
  userDetails: {},
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: state => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearSearchResults: state => {
      state.searchResults = [];
    },
  },
  extraReducers: builder => {
    builder
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
        state.error = action.error.message;
      })
      .addCase(fetchUsersByIds.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersByIds.fulfilled, (state, action) => {
        state.isLoading = false;
        const userMap = action.payload.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        state.userDetails = { ...state.userDetails, ...userMap };
      })
      .addCase(fetchUsersByIds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { setUser, setLoading, setError, logout, clearSearchResults } =
  userSlice.actions;

export default userSlice.reducer;

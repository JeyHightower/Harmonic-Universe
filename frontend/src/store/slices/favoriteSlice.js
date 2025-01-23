import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { favoriteService } from '../../services/favoriteService';

// Async thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      return await favoriteService.getFavorites();
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (universeId, { rejectWithValue }) => {
    try {
      return await favoriteService.addFavorite(universeId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (universeId, { rejectWithValue }) => {
    try {
      await favoriteService.removeFavorite(universeId);
      return universeId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  favorites: [],
  isLoading: false,
  error: null,
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add favorite
      .addCase(addFavorite.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favorites.push(action.payload.favorite);
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove favorite
      .addCase(removeFavorite.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favorites = state.favorites.filter(
          favorite => favorite.universe_id !== action.payload
        );
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = favoriteSlice.actions;
export default favoriteSlice.reducer;

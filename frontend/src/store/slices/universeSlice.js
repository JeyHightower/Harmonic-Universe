import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  universes: [],
  currentUniverse: null,
  userUniverses: [],
  collaboratingUniverses: [],
  favoriteUniverses: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortBy: 'recent',
  filterBy: {
    isPublic: null,
    allowGuests: null,
  },
};

export const fetchUniverses = createAsyncThunk(
  'universe/fetchUniverses',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { universe } = getState();
      const { searchQuery, sortBy } = universe;

      const response = await axios.get('/api/universes', {
        params: { q: searchQuery, sort_by: sortBy },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch universes'
      );
    }
  }
);

export const fetchUniverseById = createAsyncThunk(
  'universe/fetchUniverseById',
  async (universeId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/universes/${universeId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch universe'
      );
    }
  }
);

export const createUniverse = createAsyncThunk(
  'universe/createUniverse',
  async (universeData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/universes', universeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create universe'
      );
    }
  }
);

export const updateUniverse = createAsyncThunk(
  'universe/updateUniverse',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/universes/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to update universe'
      );
    }
  }
);

export const deleteUniverse = createAsyncThunk(
  'universe/deleteUniverse',
  async (universeId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/universes/${universeId}`);
      return universeId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to delete universe'
      );
    }
  }
);

export const fetchUserUniverses = createAsyncThunk(
  'universe/fetchUserUniverses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/users/me/universes');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch user universes'
      );
    }
  }
);

export const fetchCollaboratingUniverses = createAsyncThunk(
  'universe/fetchCollaboratingUniverses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/users/me/collaborations');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch collaborating universes'
      );
    }
  }
);

export const fetchFavoriteUniverses = createAsyncThunk(
  'universe/fetchFavoriteUniverses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/users/me/favorites');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch favorite universes'
      );
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'universe/toggleFavorite',
  async ({ universeId, isFavorited }, { rejectWithValue }) => {
    try {
      if (isFavorited) {
        await axios.delete(`/api/universes/${universeId}/favorite`);
      } else {
        await axios.post(`/api/universes/${universeId}/favorite`);
      }
      return { universeId, isFavorited: !isFavorited };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to toggle favorite'
      );
    }
  }
);

const universeSlice = createSlice({
  name: 'universe',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setFilterBy: (state, action) => {
      state.filterBy = { ...state.filterBy, ...action.payload };
    },
    clearFilters: state => {
      state.searchQuery = '';
      state.sortBy = 'recent';
      state.filterBy = {
        isPublic: null,
        allowGuests: null,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUniverses.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes = action.payload;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchUniverseById.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUniverseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUniverse = action.payload;
      })
      .addCase(fetchUniverseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createUniverse.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes.unshift(action.payload);
        state.userUniverses.unshift(action.payload);
      })
      .addCase(createUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateUniverse.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        const updateUniverseInList = list =>
          list.map(u =>
            u.id === action.payload.id ? { ...u, ...action.payload } : u
          );
        state.universes = updateUniverseInList(state.universes);
        state.userUniverses = updateUniverseInList(state.userUniverses);
        state.collaboratingUniverses = updateUniverseInList(
          state.collaboratingUniverses
        );
        state.favoriteUniverses = updateUniverseInList(state.favoriteUniverses);
        if (state.currentUniverse?.id === action.payload.id) {
          state.currentUniverse = {
            ...state.currentUniverse,
            ...action.payload,
          };
        }
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteUniverse.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        const removeUniverseFromList = list =>
          list.filter(u => u.id !== action.payload);
        state.universes = removeUniverseFromList(state.universes);
        state.userUniverses = removeUniverseFromList(state.userUniverses);
        state.collaboratingUniverses = removeUniverseFromList(
          state.collaboratingUniverses
        );
        state.favoriteUniverses = removeUniverseFromList(
          state.favoriteUniverses
        );
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserUniverses.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userUniverses = action.payload;
      })
      .addCase(fetchUserUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchCollaboratingUniverses.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCollaboratingUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collaboratingUniverses = action.payload;
      })
      .addCase(fetchCollaboratingUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchFavoriteUniverses.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favoriteUniverses = action.payload;
      })
      .addCase(fetchFavoriteUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(toggleFavorite.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isFavorited) {
          state.favoriteUniverses = state.favoriteUniverses.filter(
            u => u.id !== action.payload.universeId
          );
        } else {
          const universe = state.universes.find(
            u => u.id === action.payload.universeId
          );
          if (universe) {
            state.favoriteUniverses.push(universe);
          }
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setSearchQuery, setSortBy, setFilterBy, clearFilters } =
  universeSlice.actions;

export default universeSlice.reducer;

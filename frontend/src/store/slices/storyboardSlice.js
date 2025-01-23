import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const fetchStoryboards = createAsyncThunk(
  'storyboards/fetchAll',
  async universeId => {
    const response = await fetch(`/api/universe/${universeId}/storyboards`);
    if (!response.ok) throw new Error('Failed to fetch storyboards');
    return await response.json();
  }
);

export const deleteStoryboard = createAsyncThunk(
  'storyboards/delete',
  async ({ universeId, storyboardId }) => {
    const response = await fetch(
      `/api/universe/${universeId}/storyboard/${storyboardId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) throw new Error('Failed to delete storyboard');
    return storyboardId;
  }
);

export const updateStoryboard = createAsyncThunk(
  'storyboards/update',
  async ({ universeId, storyboardId, data }) => {
    const response = await fetch(
      `/api/universe/${universeId}/storyboard/${storyboardId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Failed to update storyboard');
    return await response.json();
  }
);

export const addStoryboard = createAsyncThunk(
  'storyboards/add',
  async ({ universeId, data }) => {
    const response = await fetch(`/api/universe/${universeId}/storyboards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create storyboard');
    return await response.json();
  }
);

const initialState = {
  storyboards: [],
  currentStoryboard: null,
  selectedStoryboard: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  sort: {
    field: 'createdAt',
    direction: 'desc',
  },
};

const storyboardSlice = createSlice({
  name: 'storyboards',
  initialState,
  reducers: {
    setCurrentStoryboard: (state, action) => {
      state.currentStoryboard = action.payload;
    },
    setSelectedStoryboard: (state, action) => {
      state.selectedStoryboard = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Storyboards
      .addCase(fetchStoryboards.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStoryboards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards = action.payload;
      })
      .addCase(fetchStoryboards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Delete Storyboard
      .addCase(deleteStoryboard.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStoryboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards = state.storyboards.filter(
          sb => sb.id !== action.payload
        );
        if (state.currentStoryboard?.id === action.payload) {
          state.currentStoryboard = null;
        }
        if (state.selectedStoryboard?.id === action.payload) {
          state.selectedStoryboard = null;
        }
      })
      .addCase(deleteStoryboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Update Storyboard
      .addCase(updateStoryboard.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStoryboard.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedStoryboard = action.payload;
        state.storyboards = state.storyboards.map(sb =>
          sb.id === updatedStoryboard.id ? updatedStoryboard : sb
        );
        if (state.currentStoryboard?.id === updatedStoryboard.id) {
          state.currentStoryboard = updatedStoryboard;
        }
        if (state.selectedStoryboard?.id === updatedStoryboard.id) {
          state.selectedStoryboard = updatedStoryboard;
        }
      })
      .addCase(updateStoryboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Add Storyboard
      .addCase(addStoryboard.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addStoryboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards.push(action.payload);
      })
      .addCase(addStoryboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setCurrentStoryboard,
  setSelectedStoryboard,
  clearError,
  setFilters,
  setPagination,
  setSort,
} = storyboardSlice.actions;

export default storyboardSlice.reducer;

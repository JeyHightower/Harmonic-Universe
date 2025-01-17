import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { storyboardService } from '../../services/storyboardService';

// Async Thunks
export const fetchStoryboards = createAsyncThunk(
  'storyboard/fetchStoryboards',
  async (universeId, queryParams, { rejectWithValue }) => {
    try {
      const data = await storyboardService.getStoryboards(
        universeId,
        queryParams
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch storyboards'
      );
    }
  }
);

export const addStoryboard = createAsyncThunk(
  'storyboard/addStoryboard',
  async ({ universeId, storyboardData }, { rejectWithValue }) => {
    try {
      const data = await storyboardService.addStoryboard(
        universeId,
        storyboardData
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add storyboard'
      );
    }
  }
);

export const updateStoryboard = createAsyncThunk(
  'storyboard/updateStoryboard',
  async ({ universeId, storyboardId, storyboardData }, { rejectWithValue }) => {
    try {
      const data = await storyboardService.updateStoryboard(
        universeId,
        storyboardId,
        storyboardData
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update storyboard'
      );
    }
  }
);

export const deleteStoryboard = createAsyncThunk(
  'storyboard/deleteStoryboard',
  async ({ universeId, storyboardId }, { rejectWithValue }) => {
    try {
      await storyboardService.deleteStoryboard(universeId, storyboardId);
      return storyboardId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete storyboard'
      );
    }
  }
);

const initialState = {
  storyboards: [],
  pagination: {
    page: 1,
    perPage: 10,
    totalCount: 0,
    totalPages: 0,
  },
  sort: {
    field: 'created_at',
    order: 'desc',
  },
  filters: {
    search: '',
    harmonyMin: null,
    harmonyMax: null,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,
  selectedStoryboard: null,
};

const storyboardSlice = createSlice({
  name: 'storyboard',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setSelectedStoryboard: (state, action) => {
      state.selectedStoryboard = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
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
        state.storyboards = action.payload.storyboards;
        state.pagination = action.payload.pagination;
        state.sort = action.payload.sort;
        state.filters = action.payload.filters;
        state.error = null;
      })
      .addCase(fetchStoryboards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Storyboard
      .addCase(addStoryboard.pending, state => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addStoryboard.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.storyboards.unshift(action.payload);
        state.error = null;
      })
      .addCase(addStoryboard.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // Update Storyboard
      .addCase(updateStoryboard.pending, state => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateStoryboard.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.storyboards.findIndex(
          s => s.id === action.payload.id
        );
        if (index !== -1) {
          state.storyboards[index] = action.payload;
        }
        if (state.selectedStoryboard?.id === action.payload.id) {
          state.selectedStoryboard = action.payload;
        }
        state.error = null;
      })
      .addCase(updateStoryboard.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      // Delete Storyboard
      .addCase(deleteStoryboard.pending, state => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteStoryboard.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.storyboards = state.storyboards.filter(
          s => s.id !== action.payload
        );
        if (state.selectedStoryboard?.id === action.payload) {
          state.selectedStoryboard = null;
        }
        state.error = null;
      })
      .addCase(deleteStoryboard.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedStoryboard,
  setPagination,
  setSort,
  setFilters,
} = storyboardSlice.actions;
export default storyboardSlice.reducer;

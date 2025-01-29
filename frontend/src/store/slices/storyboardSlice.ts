import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

interface Storyboard {
  id: number;
  universe_id: number;
  title: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface StoryboardState {
  storyboards: Storyboard[];
  currentStoryboard: Storyboard | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StoryboardState = {
  storyboards: [],
  currentStoryboard: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchStoryboards = createAsyncThunk(
  'storyboard/fetchStoryboards',
  async (universeId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/universes/${universeId}/storyboards`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch storyboards');
    }
  }
);

export const fetchStoryboardById = createAsyncThunk(
  'storyboard/fetchStoryboardById',
  async ({ universeId, storyboardId }: { universeId: number; storyboardId: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/universes/${universeId}/storyboards/${storyboardId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch storyboard');
    }
  }
);

export const createStoryboard = createAsyncThunk(
  'storyboard/createStoryboard',
  async ({ universeId, storyboardData }: { universeId: number; storyboardData: Partial<Storyboard> }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/universes/${universeId}/storyboards`, storyboardData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create storyboard');
    }
  }
);

export const updateStoryboard = createAsyncThunk(
  'storyboard/updateStoryboard',
  async (
    { universeId, storyboardId, storyboardData }:
    { universeId: number; storyboardId: number; storyboardData: Partial<Storyboard> },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `/api/universes/${universeId}/storyboards/${storyboardId}`,
        storyboardData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update storyboard');
    }
  }
);

export const deleteStoryboard = createAsyncThunk(
  'storyboard/deleteStoryboard',
  async ({ universeId, storyboardId }: { universeId: number; storyboardId: number }, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/universes/${universeId}/storyboards/${storyboardId}`);
      return storyboardId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete storyboard');
    }
  }
);

const storyboardSlice = createSlice({
  name: 'storyboard',
  initialState,
  reducers: {
    clearCurrentStoryboard: (state) => {
      state.currentStoryboard = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Storyboards
      .addCase(fetchStoryboards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStoryboards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards = action.payload;
      })
      .addCase(fetchStoryboards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Single Storyboard
      .addCase(fetchStoryboardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStoryboardById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentStoryboard = action.payload;
      })
      .addCase(fetchStoryboardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Storyboard
      .addCase(createStoryboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStoryboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards.push(action.payload);
        state.currentStoryboard = action.payload;
      })
      .addCase(createStoryboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Storyboard
      .addCase(updateStoryboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStoryboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards = state.storyboards.map(storyboard =>
          storyboard.id === action.payload.id ? action.payload : storyboard
        );
        state.currentStoryboard = action.payload;
      })
      .addCase(updateStoryboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Storyboard
      .addCase(deleteStoryboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStoryboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.storyboards = state.storyboards.filter(
          storyboard => storyboard.id !== action.payload
        );
        if (state.currentStoryboard?.id === action.payload) {
          state.currentStoryboard = null;
        }
      })
      .addCase(deleteStoryboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentStoryboard, clearError } = storyboardSlice.actions;

export const selectStoryboards = (state: RootState) => state.storyboard.storyboards;
export const selectCurrentStoryboard = (state: RootState) => state.storyboard.currentStoryboard;
export const selectStoryboardLoading = (state: RootState) => state.storyboard.isLoading;
export const selectStoryboardError = (state: RootState) => state.storyboard.error;

export default storyboardSlice.reducer;


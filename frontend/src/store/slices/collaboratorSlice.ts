import api from "@/services/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface Collaborator {
  id: number;
  user_id: number;
  role: string;
  user: {
    username: string;
    email: string;
  };
}

interface CollaboratorState {
  collaborators: Collaborator[];
  loading: boolean;
  error: string | null;
}

const initialState: CollaboratorState = {
  collaborators: [],
  loading: false,
  error: null,
};

export const fetchCollaborators = createAsyncThunk(
  "collaborators/fetch",
  async (universeId: number) => {
    const response = await api.get(
      `/api/universes/${universeId}/collaborators`,
    );
    return response.data;
  },
);

export const addCollaborator = createAsyncThunk(
  "collaborators/add",
  async ({
    universeId,
    userId,
    role,
  }: {
    universeId: number;
    userId: number;
    role: string;
  }) => {
    const response = await api.post(
      `/api/universes/${universeId}/collaborators`,
      {
        user_id: userId,
        role,
      },
    );
    return response.data;
  },
);

export const updateCollaborator = createAsyncThunk(
  "collaborators/update",
  async ({
    universeId,
    userId,
    role,
  }: {
    universeId: number;
    userId: number;
    role: string;
  }) => {
    const response = await api.put(
      `/api/universes/${universeId}/collaborators/${userId}`,
      { role },
    );
    return response.data;
  },
);

export const removeCollaborator = createAsyncThunk(
  "collaborators/remove",
  async ({ universeId, userId }: { universeId: number; userId: number }) => {
    await api.delete(`/api/universes/${universeId}/collaborators/${userId}`);
    return userId;
  },
);

const collaboratorSlice = createSlice({
  name: "collaborators",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch collaborators
      .addCase(fetchCollaborators.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCollaborators.fulfilled, (state, action) => {
        state.loading = false;
        state.collaborators = action.payload;
      })
      .addCase(fetchCollaborators.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch collaborators";
      })
      // Add collaborator
      .addCase(addCollaborator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCollaborator.fulfilled, (state, action) => {
        state.loading = false;
        state.collaborators.push(action.payload);
      })
      .addCase(addCollaborator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add collaborator";
      })
      // Update collaborator
      .addCase(updateCollaborator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCollaborator.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.collaborators.findIndex(
          (c) => c.user_id === action.payload.user_id,
        );
        if (index !== -1) {
          state.collaborators[index] = action.payload;
        }
      })
      .addCase(updateCollaborator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update collaborator";
      })
      // Remove collaborator
      .addCase(removeCollaborator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        state.loading = false;
        state.collaborators = state.collaborators.filter(
          (c) => c.user_id !== action.payload,
        );
      })
      .addCase(removeCollaborator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to remove collaborator";
      });
  },
});

export default collaboratorSlice.reducer;

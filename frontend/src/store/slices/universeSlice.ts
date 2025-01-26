import { Universe } from "@/types/universe";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

interface UniverseState {
  universes: Universe[];
  currentUniverse: Universe | null;
  userUniverses: Universe[];
  collaboratingUniverses: Universe[];
  favoriteUniverses: Universe[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: "recent" | "popular" | "name";
  filterBy: {
    isPublic: boolean | null;
    allowGuests: boolean | null;
  };
}

const initialState: UniverseState = {
  universes: [],
  currentUniverse: null,
  userUniverses: [],
  collaboratingUniverses: [],
  favoriteUniverses: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  sortBy: "recent",
  filterBy: {
    isPublic: null,
    allowGuests: null,
  },
};

export const fetchUniverses = createAsyncThunk(
  "universe/fetchUniverses",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { universe } = getState() as { universe: UniverseState };
      const { searchQuery, sortBy } = universe;

      const response = await axios.get("/api/universes", {
        params: { q: searchQuery, sort_by: sortBy },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch universes",
      );
    }
  },
);

export const fetchUniverseById = createAsyncThunk(
  "universe/fetchUniverseById",
  async (universeId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/universes/${universeId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch universe",
      );
    }
  },
);

export const createUniverse = createAsyncThunk(
  "universe/createUniverse",
  async (universeData: Partial<Universe>, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/universes", universeData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create universe",
      );
    }
  },
);

export const updateUniverse = createAsyncThunk(
  "universe/updateUniverse",
  async (
    { id, data }: { id: number; data: Partial<Universe> },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(`/api/universes/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update universe",
      );
    }
  },
);

export const deleteUniverse = createAsyncThunk(
  "universe/deleteUniverse",
  async (universeId: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/universes/${universeId}`);
      return universeId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete universe",
      );
    }
  },
);

export const fetchUserUniverses = createAsyncThunk(
  "universe/fetchUserUniverses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/users/me/universes");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch user universes",
      );
    }
  },
);

export const fetchCollaboratingUniverses = createAsyncThunk(
  "universe/fetchCollaboratingUniverses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/users/me/collaborations");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
          "Failed to fetch collaborating universes",
      );
    }
  },
);

export const fetchFavoriteUniverses = createAsyncThunk(
  "universe/fetchFavoriteUniverses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/users/me/favorites");
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch favorite universes",
      );
    }
  },
);

export const toggleFavorite = createAsyncThunk(
  "universe/toggleFavorite",
  async (
    { universeId, isFavorited }: { universeId: number; isFavorited: boolean },
    { rejectWithValue },
  ) => {
    try {
      if (isFavorited) {
        await axios.delete(`/api/universes/${universeId}/favorite`);
      } else {
        await axios.post(`/api/universes/${universeId}/favorite`);
      }
      return { universeId, isFavorited: !isFavorited };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to toggle favorite",
      );
    }
  },
);

const universeSlice = createSlice({
  name: "universe",
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
    clearFilters: (state) => {
      state.searchQuery = "";
      state.sortBy = "recent";
      state.filterBy = {
        isPublic: null,
        allowGuests: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch Universes
    builder
      .addCase(fetchUniverses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes = action.payload;
      })
      .addCase(fetchUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Universe by ID
    builder
      .addCase(fetchUniverseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUniverseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUniverse = action.payload;
      })
      .addCase(fetchUniverseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Universe
    builder
      .addCase(createUniverse.pending, (state) => {
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
        state.error = action.payload as string;
      });

    // Update Universe
    builder
      .addCase(updateUniverse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUniverse = action.payload;
        state.universes = state.universes.map((u) =>
          u.id === action.payload.id ? action.payload : u,
        );
        state.userUniverses = state.userUniverses.map((u) =>
          u.id === action.payload.id ? action.payload : u,
        );
      })
      .addCase(updateUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Universe
    builder
      .addCase(deleteUniverse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUniverse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.universes = state.universes.filter(
          (u) => u.id !== action.payload,
        );
        state.userUniverses = state.userUniverses.filter(
          (u) => u.id !== action.payload,
        );
        if (state.currentUniverse?.id === action.payload) {
          state.currentUniverse = null;
        }
      })
      .addCase(deleteUniverse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch User Universes
    builder
      .addCase(fetchUserUniverses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userUniverses = action.payload;
      })
      .addCase(fetchUserUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Collaborating Universes
    builder
      .addCase(fetchCollaboratingUniverses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCollaboratingUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.collaboratingUniverses = action.payload;
      })
      .addCase(fetchCollaboratingUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Favorite Universes
    builder
      .addCase(fetchFavoriteUniverses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFavoriteUniverses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favoriteUniverses = action.payload;
      })
      .addCase(fetchFavoriteUniverses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Toggle Favorite
    builder.addCase(toggleFavorite.fulfilled, (state, action) => {
      const { universeId, isFavorited } = action.payload;

      // Update is_favorited in all universe lists
      const updateUniverseInList = (list: Universe[]) =>
        list.map((u) =>
          u.id === universeId ? { ...u, is_favorited: isFavorited } : u,
        );

      state.universes = updateUniverseInList(state.universes);
      state.userUniverses = updateUniverseInList(state.userUniverses);
      state.collaboratingUniverses = updateUniverseInList(
        state.collaboratingUniverses,
      );

      if (state.currentUniverse?.id === universeId) {
        state.currentUniverse = {
          ...state.currentUniverse,
          is_favorited: isFavorited,
        };
      }

      // Update favorite universes list
      if (isFavorited) {
        const universe = state.universes.find((u) => u.id === universeId);
        if (universe) {
          state.favoriteUniverses.push({ ...universe, is_favorited: true });
        }
      } else {
        state.favoriteUniverses = state.favoriteUniverses.filter(
          (u) => u.id !== universeId,
        );
      }
    });
  },
});

export const { setSearchQuery, setSortBy, setFilterBy, clearFilters } =
  universeSlice.actions;

export default universeSlice.reducer;

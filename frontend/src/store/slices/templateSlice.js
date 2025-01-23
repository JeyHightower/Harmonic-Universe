import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { templateService } from '../../services/templateService';

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchAll',
  async (category, { rejectWithValue }) => {
    try {
      return await templateService.getTemplates(category);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTemplate = createAsyncThunk(
  'templates/fetchOne',
  async (templateId, { rejectWithValue }) => {
    try {
      return await templateService.getTemplate(templateId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createTemplate = createAsyncThunk(
  'templates/create',
  async (templateData, { rejectWithValue }) => {
    try {
      return await templateService.createTemplate(templateData);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/update',
  async ({ templateId, templateData }, { rejectWithValue }) => {
    try {
      return await templateService.updateTemplate(templateId, templateData);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/delete',
  async (templateId, { rejectWithValue }) => {
    try {
      await templateService.deleteTemplate(templateId);
      return templateId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'templates/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await templateService.getCategories();
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createUniverseFromTemplate = createAsyncThunk(
  'templates/createUniverse',
  async ({ templateId, universeData }, { rejectWithValue }) => {
    try {
      return await templateService.createUniverseFromTemplate(
        templateId,
        universeData
      );
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  templates: [],
  currentTemplate: null,
  categories: [],
  isLoading: false,
  error: null,
};

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    clearCurrentTemplate: state => {
      state.currentTemplate = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch templates
      .addCase(fetchTemplates.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single template
      .addCase(fetchTemplate.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTemplate = action.payload;
      })
      .addCase(fetchTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create template
      .addCase(createTemplate.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates.push(action.payload);
        state.currentTemplate = action.payload;
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update template
      .addCase(updateTemplate.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.templates.findIndex(
          t => t.id === action.payload.id
        );
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.currentTemplate = action.payload;
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete template
      .addCase(deleteTemplate.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = state.templates.filter(t => t.id !== action.payload);
        if (state.currentTemplate?.id === action.payload) {
          state.currentTemplate = null;
        }
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch categories
      .addCase(fetchCategories.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentTemplate } = templateSlice.actions;
export default templateSlice.reducer;

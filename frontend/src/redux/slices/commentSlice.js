import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { commentService } from '../../services/commentService';

// Async thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (universeId, { rejectWithValue }) => {
    try {
      return await commentService.getComments(universeId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ universeId, content, parentId }, { rejectWithValue }) => {
    try {
      return await commentService.addComment(universeId, content, parentId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ universeId, commentId, content }, { rejectWithValue }) => {
    try {
      return await commentService.updateComment(universeId, commentId, content);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ universeId, commentId }, { rejectWithValue }) => {
    try {
      await commentService.deleteComment(universeId, commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  comments: [],
  isLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add comment
      .addCase(addComment.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.isLoading = false;
        const newComment = action.payload.comment;
        if (newComment.parent_id) {
          // Add reply to parent comment
          const parentComment = state.comments.find(
            c => c.id === newComment.parent_id
          );
          if (parentComment) {
            parentComment.replies = [
              ...(parentComment.replies || []),
              newComment,
            ];
          }
        } else {
          // Add top-level comment
          state.comments.unshift(newComment);
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update comment
      .addCase(updateComment.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedComment = action.payload.comment;
        if (updatedComment.parent_id) {
          // Update reply
          const parentComment = state.comments.find(
            c => c.id === updatedComment.parent_id
          );
          if (parentComment) {
            parentComment.replies = parentComment.replies.map(reply =>
              reply.id === updatedComment.id ? updatedComment : reply
            );
          }
        } else {
          // Update top-level comment
          state.comments = state.comments.map(comment =>
            comment.id === updatedComment.id ? updatedComment : comment
          );
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete comment
      .addCase(deleteComment.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.isLoading = false;
        const commentId = action.payload;
        // Remove comment and its replies
        state.comments = state.comments.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies) {
            comment.replies = comment.replies.filter(
              reply => reply.id !== commentId
            );
          }
          return true;
        });
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = commentSlice.actions;
export default commentSlice.reducer;

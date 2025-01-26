import api from "@/services/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface Comment {
  id: number;
  universe_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user: {
    id: number;
    username: string;
    email: string;
  };
  replies?: Comment[];
}

interface CommentState {
  comments: Comment[];
  userComments: Comment[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentState = {
  comments: [],
  userComments: [],
  loading: false,
  error: null,
};

export const fetchComments = createAsyncThunk(
  "comments/fetch",
  async (universeId: number) => {
    const response = await api.get(`/api/universes/${universeId}/comments`);
    return response.data;
  },
);

export const addComment = createAsyncThunk(
  "comments/add",
  async ({
    universeId,
    content,
    parentId,
  }: {
    universeId: number;
    content: string;
    parentId?: number;
  }) => {
    const response = await api.post(`/api/universes/${universeId}/comments`, {
      content,
      parent_id: parentId,
    });
    return response.data;
  },
);

export const updateComment = createAsyncThunk(
  "comments/update",
  async ({
    universeId,
    commentId,
    content,
  }: {
    universeId: number;
    commentId: number;
    content: string;
  }) => {
    const response = await api.put(
      `/api/universes/${universeId}/comments/${commentId}`,
      { content },
    );
    return response.data;
  },
);

export const deleteComment = createAsyncThunk(
  "comments/delete",
  async ({
    universeId,
    commentId,
  }: {
    universeId: number;
    commentId: number;
  }) => {
    await api.delete(`/api/universes/${universeId}/comments/${commentId}`);
    return commentId;
  },
);

export const fetchUserComments = createAsyncThunk(
  "comments/fetchUserComments",
  async () => {
    const response = await api.get("/api/users/me/comments");
    return response.data;
  },
);

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch comments";
      })
      // Add comment
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        const comment = action.payload;
        if (comment.parent_id) {
          // Add reply to parent comment
          const parentComment = state.comments.find(
            (c) => c.id === comment.parent_id,
          );
          if (parentComment) {
            parentComment.replies = parentComment.replies || [];
            parentComment.replies.unshift(comment);
          }
        } else {
          // Add top-level comment
          state.comments.unshift(comment);
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add comment";
      })
      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.loading = false;
        const updatedComment = action.payload;
        if (updatedComment.parent_id) {
          // Update reply
          const parentComment = state.comments.find(
            (c) => c.id === updatedComment.parent_id,
          );
          if (parentComment?.replies) {
            const replyIndex = parentComment.replies.findIndex(
              (r) => r.id === updatedComment.id,
            );
            if (replyIndex !== -1) {
              parentComment.replies[replyIndex] = updatedComment;
            }
          }
        } else {
          // Update top-level comment
          const commentIndex = state.comments.findIndex(
            (c) => c.id === updatedComment.id,
          );
          if (commentIndex !== -1) {
            state.comments[commentIndex] = updatedComment;
          }
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update comment";
      })
      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false;
        const commentId = action.payload;
        // Remove from top-level comments
        state.comments = state.comments.filter((c) => c.id !== commentId);
        // Remove from replies
        state.comments.forEach((comment) => {
          if (comment.replies) {
            comment.replies = comment.replies.filter((r) => r.id !== commentId);
          }
        });
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete comment";
      })
      // Fetch user comments
      .addCase(fetchUserComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserComments.fulfilled, (state, action) => {
        state.loading = false;
        state.userComments = action.payload;
      })
      .addCase(fetchUserComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user comments";
      });
  },
});

export default commentSlice.reducer;

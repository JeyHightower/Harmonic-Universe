import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  addComment,
  deleteComment,
  fetchComments,
  updateComment,
} from '@/store/slices/commentSlice';
import { Box, Button, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import CommentList from './CommentList';

interface CommentSectionProps {
  universeId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ universeId }) => {
  const dispatch = useAppDispatch();
  const { comments, loading, error } = useAppSelector(state => state.comments);
  const currentUser = useAppSelector(state => state.auth.user);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    dispatch(fetchComments(universeId));
  }, [dispatch, universeId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await dispatch(
        addComment({
          universeId,
          content: newComment.trim(),
        })
      ).unwrap();
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!newComment.trim()) return;

    try {
      await dispatch(
        addComment({
          universeId,
          content: newComment.trim(),
          parentId,
        })
      ).unwrap();
      setNewComment('');
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleEdit = async (comment: any) => {
    try {
      await dispatch(
        updateComment({
          universeId,
          commentId: comment.id,
          content: comment.content,
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await dispatch(
        deleteComment({
          universeId,
          commentId,
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography>Loading comments...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>

      {currentUser && (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            variant="outlined"
          />
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </Box>
        </Box>
      )}

      <CommentList
        comments={comments}
        universeId={universeId}
        currentUserId={currentUser?.id || 0}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Box>
  );
};

export default CommentSection;

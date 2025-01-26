import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addComment, fetchComments } from "../../store/slices/commentSlice";
import Comment from "./Comment";
import styles from "./Comments.module.css";

const CommentList = ({ universeId }) => {
  const dispatch = useDispatch();
  const { comments, isLoading, error } = useSelector((state) => state.comments);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    dispatch(fetchComments(universeId));
  }, [dispatch, universeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await dispatch(
        addComment({
          universeId,
          content: newComment,
          parentId: replyTo,
        }),
      ).unwrap();
      setNewComment("");
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleReply = (commentId) => {
    setReplyTo(commentId);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading comments...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.commentList}>
      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
          className={styles.commentInput}
        />
        <div className={styles.formActions}>
          {replyTo && (
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className={styles.cancelButton}
            >
              Cancel Reply
            </button>
          )}
          <button
            type="submit"
            disabled={!newComment.trim()}
            className={styles.submitButton}
          >
            {replyTo ? "Reply" : "Comment"}
          </button>
        </div>
      </form>

      <div className={styles.comments}>
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            universeId={universeId}
            onReply={handleReply}
          />
        ))}
      </div>
    </div>
  );
};

CommentList.propTypes = {
  universeId: PropTypes.number.isRequired,
};

export default CommentList;

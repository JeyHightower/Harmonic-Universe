import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteComment, updateComment } from "../../store/slices/commentSlice";
import styles from "./Comments.module.css";

const Comment = ({ comment, universeId, onReply }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const currentUser = useSelector((state) => state.auth.user);
  const isOwner = currentUser?.id === comment.user.id;

  const handleEdit = async () => {
    if (isEditing) {
      try {
        await dispatch(
          updateComment({
            universeId,
            commentId: comment.id,
            content: editContent,
          }),
        ).unwrap();
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update comment:", error);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await dispatch(
          deleteComment({
            universeId,
            commentId: comment.id,
          }),
        ).unwrap();
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  const handleReply = () => {
    onReply(comment.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.comment}>
      <div className={styles.commentHeader}>
        <span className={styles.username}>{comment.user.username}</span>
        <span className={styles.date}>{formatDate(comment.created_at)}</span>
      </div>

      <div className={styles.commentContent}>
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className={styles.editTextarea}
          />
        ) : (
          <p>{comment.content}</p>
        )}
      </div>

      <div className={styles.commentActions}>
        <button onClick={handleReply} className={styles.actionButton}>
          Reply
        </button>
        {isOwner && (
          <>
            <button onClick={handleEdit} className={styles.actionButton}>
              {isEditing ? "Save" : "Edit"}
            </button>
            <button onClick={handleDelete} className={styles.actionButton}>
              Delete
            </button>
          </>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              universeId={universeId}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    user: PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
    }).isRequired,
    created_at: PropTypes.string.isRequired,
    replies: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  universeId: PropTypes.number.isRequired,
  onReply: PropTypes.func.isRequired,
};

export default Comment;

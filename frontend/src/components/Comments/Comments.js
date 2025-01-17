import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import styles from './Comments.module.css';

const Comment = ({ comment, currentUser }) => (
  <div
    className={`${styles.comment} ${
      comment.userId === currentUser ? styles.ownComment : ''
    }`}
  >
    <div className={styles.commentHeader}>
      <span className={styles.userName}>{comment.userName}</span>
      <span className={styles.timestamp}>
        {new Date(comment.timestamp).toLocaleString()}
      </span>
    </div>
    <div className={styles.commentContent}>{comment.content}</div>
  </div>
);

const Comments = ({ storyboardId }) => {
  const { comments, addComment } = useCollaboration();
  const [newComment, setNewComment] = useState('');

  const storyboardComments = comments.filter(
    comment => comment.storyboardId === storyboardId
  );

  const handleSubmit = e => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(storyboardId, newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className={styles.comments}>
      <h4>Comments</h4>
      <div className={styles.commentsList}>
        {storyboardComments.length === 0 ? (
          <div className={styles.emptyState}>No comments yet</div>
        ) : (
          storyboardComments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={comment.userId}
            />
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className={styles.commentForm}>
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className={styles.commentInput}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className={styles.commentButton}
        >
          Send
        </button>
      </form>
    </div>
  );
};

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
  }).isRequired,
  currentUser: PropTypes.string.isRequired,
};

Comments.propTypes = {
  storyboardId: PropTypes.number.isRequired,
};

export default Comments;

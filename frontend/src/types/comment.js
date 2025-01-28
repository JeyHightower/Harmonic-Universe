import PropTypes from 'prop-types';

export const CommentPropTypes = {
  id: PropTypes.number.isRequired,
  universe_id: PropTypes.number.isRequired,
  user_id: PropTypes.number.isRequired,
  parent_id: PropTypes.number,
  content: PropTypes.string.isRequired,
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
  is_edited: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }),
  replies: PropTypes.arrayOf(PropTypes.shape(CommentPropTypes)),
};

export const CommentStatePropTypes = {
  comments: PropTypes.arrayOf(PropTypes.shape(CommentPropTypes)).isRequired,
  userComments: PropTypes.arrayOf(PropTypes.shape(CommentPropTypes)).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export const AddCommentPayloadPropTypes = {
  universeId: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
  parentId: PropTypes.number,
};

export const UpdateCommentPayloadPropTypes = {
  universeId: PropTypes.number.isRequired,
  commentId: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
};

export const DeleteCommentPayloadPropTypes = {
  universeId: PropTypes.number.isRequired,
  commentId: PropTypes.number.isRequired,
};

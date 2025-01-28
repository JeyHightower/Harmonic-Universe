import PropTypes from 'prop-types';

export const UniversePropTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  is_public: PropTypes.bool.isRequired,
  allow_guests: PropTypes.bool.isRequired,
  creator_id: PropTypes.number.isRequired,
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
  image: PropTypes.string,
  creator: PropTypes.shape(UserPropTypes),
  parameters_count: PropTypes.number.isRequired,
  collaborators_count: PropTypes.number.isRequired,
  comments_count: PropTypes.number.isRequired,
  favorites_count: PropTypes.number.isRequired,
  is_favorited: PropTypes.bool,
};

export const UniverseParameterPropTypes = {
  id: PropTypes.number.isRequired,
  universe_id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  unit: PropTypes.string.isRequired,
  description: PropTypes.string,
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
};

export const UniverseCollaboratorPropTypes = {
  id: PropTypes.number.isRequired,
  universe_id: PropTypes.number.isRequired,
  user_id: PropTypes.number.isRequired,
  role: PropTypes.oneOf(['viewer', 'editor', 'admin']).isRequired,
  user: PropTypes.shape(UserPropTypes),
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
};

export const UniverseCommentPropTypes = {
  id: PropTypes.number.isRequired,
  universe_id: PropTypes.number.isRequired,
  user_id: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
  user: PropTypes.shape(UserPropTypes),
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
};

export const UniverseFavoritePropTypes = {
  id: PropTypes.number.isRequired,
  universe_id: PropTypes.number.isRequired,
  user_id: PropTypes.number.isRequired,
  user: PropTypes.shape(UserPropTypes),
  created_at: PropTypes.string.isRequired,
};

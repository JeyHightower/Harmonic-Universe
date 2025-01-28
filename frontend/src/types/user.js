import PropTypes from 'prop-types';

export const UserPropTypes = {
  id: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  is_active: PropTypes.bool.isRequired,
  is_admin: PropTypes.bool.isRequired,
  avatar: PropTypes.string,
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
  universes_count: PropTypes.number.isRequired,
  collaborations_count: PropTypes.number.isRequired,
  comments_count: PropTypes.number.isRequired,
  favorites_count: PropTypes.number.isRequired,
};

export const UserProfilePropTypes = {
  ...UserPropTypes,
  bio: PropTypes.string,
  location: PropTypes.string,
  website: PropTypes.string,
  social_links: PropTypes.shape({
    twitter: PropTypes.string,
    github: PropTypes.string,
    linkedin: PropTypes.string,
  }),
};

export const UserSettingsPropTypes = {
  id: PropTypes.number.isRequired,
  user_id: PropTypes.number.isRequired,
  email_notifications: PropTypes.bool.isRequired,
  theme_preference: PropTypes.oneOf(['light', 'dark', 'system']).isRequired,
  language: PropTypes.string.isRequired,
  timezone: PropTypes.string.isRequired,
  created_at: PropTypes.string.isRequired,
  updated_at: PropTypes.string.isRequired,
};

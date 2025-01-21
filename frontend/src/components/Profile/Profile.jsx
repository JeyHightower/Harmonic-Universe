import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/userSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
    },
    preferences: {
      showEmail: false,
      showActivity: true,
    },
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        ...user.profile,
        username: user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await dispatch(updateProfile(profile)).unwrap();
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-section">
          <img
            src={profile.avatar || '/default-avatar.png'}
            alt="Profile"
            className="profile-avatar"
          />
          {isEditing && (
            <div className="avatar-upload">
              <label htmlFor="avatar" className="avatar-upload-label">
                Change Avatar
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        <div className="profile-title">
          <h2>{profile.username}'s Profile</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">Profile updated successfully!</div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <section className="profile-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={profile.username}
              onChange={handleChange}
              disabled={!isEditing}
              required
              minLength={3}
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              disabled={!isEditing}
              rows={4}
              maxLength={500}
              placeholder="Tell us about yourself..."
            />
          </div>
        </section>

        <section className="profile-section">
          <h3>Social Links</h3>
          <div className="form-group">
            <label htmlFor="twitter">Twitter</label>
            <input
              type="url"
              id="twitter"
              name="socialLinks.twitter"
              value={profile.socialLinks.twitter}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="https://twitter.com/username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="github">GitHub</label>
            <input
              type="url"
              id="github"
              name="socialLinks.github"
              value={profile.socialLinks.github}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="https://github.com/username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="linkedin">LinkedIn</label>
            <input
              type="url"
              id="linkedin"
              name="socialLinks.linkedin"
              value={profile.socialLinks.linkedin}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
        </section>

        <section className="profile-section">
          <h3>Privacy Preferences</h3>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="preferences.showEmail"
                checked={profile.preferences.showEmail}
                onChange={handleChange}
                disabled={!isEditing}
              />
              Show email on public profile
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="preferences.showActivity"
                checked={profile.preferences.showActivity}
                onChange={handleChange}
                disabled={!isEditing}
              />
              Show activity on public profile
            </label>
          </div>
        </section>

        {isEditing && (
          <div className="form-actions">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;

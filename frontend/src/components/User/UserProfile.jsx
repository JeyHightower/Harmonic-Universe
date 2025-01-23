import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';

const UserProfile = ({ userId, profile: initialProfile }) => {
  const [profile, setProfile] = useState(
    initialProfile || {
      displayName: '',
      bio: '',
      avatar: '',
      email: '',
      settings: {
        profileVisibility: 'public',
        activityVisibility: 'friends',
      },
    }
  );
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (userId && !initialProfile) {
      loadProfile();
    }
  }, [userId, initialProfile]);

  const loadProfile = async () => {
    try {
      const response = await userService.getProfile(userId);
      setProfile(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateProfile = () => {
    if (!profile.displayName || profile.displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateProfile()) return;

    try {
      await userService.updateProfile(profile);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    try {
      await userService.deleteProfile(userId);
      setShowConfirmation(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAvatarChange = async e => {
    if (!userId || !e.target.files?.length) return;

    try {
      const response = await userService.uploadAvatar(
        userId,
        e.target.files[0]
      );
      setProfile(prev => ({
        ...prev,
        avatar: response.data.avatar,
      }));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div data-testid="loading-indicator">Loading...</div>;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={profile.displayName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="avatar">Avatar</label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            data-testid="avatar-upload"
          />
        </div>

        <div>
          <label htmlFor="settings.profileVisibility">Profile Visibility</label>
          <select
            id="settings.profileVisibility"
            name="settings.profileVisibility"
            value={profile.settings.profileVisibility}
            onChange={handleChange}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label htmlFor="settings.activityVisibility">
            Activity Visibility
          </label>
          <select
            id="settings.activityVisibility"
            name="settings.activityVisibility"
            value={profile.settings.activityVisibility}
            onChange={handleChange}
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit">Save</button>
        <button type="button" onClick={() => setShowConfirmation(true)}>
          Delete
        </button>
      </form>

      {profile.avatar && <img src={profile.avatar} alt="Profile avatar" />}

      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to delete your profile?</p>
          <button onClick={handleDelete}>Confirm</button>
          <button onClick={() => setShowConfirmation(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

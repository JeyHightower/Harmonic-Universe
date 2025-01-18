import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setError, setUser } from '../store/session';
import './ProfilePage.css';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, error } = useSelector(state => state.session);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    preferences: {
      theme: user?.preferences?.theme || 'dark',
      defaultBpm: user?.preferences?.defaultBpm || 120,
      defaultScale: user?.preferences?.defaultScale || 'major',
    },
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(setUser(updatedUser));
        setIsEditing(false);
      } else {
        const data = await response.json();
        dispatch(setError(data.error));
      }
    } catch (err) {
      dispatch(setError('Failed to update profile'));
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile</h1>
        {error && <div className="error-message">{error}</div>}

        <div className="profile-header">
          <div className="profile-avatar">
            <img
              src={user?.avatarUrl || '/default-avatar.png'}
              alt={user?.username}
            />
          </div>
          <div className="profile-info">
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
          </div>
          <button
            className="edit-button"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div className="preferences-section">
              <h3>Preferences</h3>

              <div className="form-group">
                <label>Theme</label>
                <select
                  name="preferences.theme"
                  value={formData.preferences.theme}
                  onChange={handleInputChange}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default BPM</label>
                <input
                  type="number"
                  name="preferences.defaultBpm"
                  value={formData.preferences.defaultBpm}
                  onChange={handleInputChange}
                  min="40"
                  max="240"
                />
              </div>

              <div className="form-group">
                <label>Default Scale</label>
                <select
                  name="preferences.defaultScale"
                  value={formData.preferences.defaultScale}
                  onChange={handleInputChange}
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="pentatonic">Pentatonic</option>
                  <option value="blues">Blues</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-section">
              <h3>About</h3>
              <p>{user?.bio || 'No bio yet'}</p>
            </div>

            <div className="detail-section">
              <h3>Preferences</h3>
              <ul>
                <li>
                  <strong>Theme:</strong> {user?.preferences?.theme || 'Dark'}
                </li>
                <li>
                  <strong>Default BPM:</strong>{' '}
                  {user?.preferences?.defaultBpm || 120}
                </li>
                <li>
                  <strong>Default Scale:</strong>{' '}
                  {user?.preferences?.defaultScale || 'Major'}
                </li>
              </ul>
            </div>

            <div className="detail-section">
              <h3>Statistics</h3>
              <ul>
                <li>
                  <strong>Universes Created:</strong>{' '}
                  {user?.stats?.universesCreated || 0}
                </li>
                <li>
                  <strong>Total Compositions:</strong>{' '}
                  {user?.stats?.totalCompositions || 0}
                </li>
                <li>
                  <strong>Member Since:</strong>{' '}
                  {new Date(user?.createdAt).toLocaleDateString()}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

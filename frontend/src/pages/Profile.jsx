import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../components/common/Modal';

function Profile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Handle profile update
  };

  const handleDeleteAccount = () => {
    openModal(
      <div className="delete-account-modal">
        <h2>Delete Account</h2>
        <p>
          Are you sure you want to delete your account? This action cannot be
          undone.
        </p>
        <div className="button-group">
          <button className="cancel-button" onClick={() => closeModal()}>
            Cancel
          </button>
          <button className="delete-button" onClick={confirmDeleteAccount}>
            Delete Account
          </button>
        </div>
      </div>
    );
  };

  const confirmDeleteAccount = async () => {
    // Handle account deletion
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <h1>Profile Settings</h1>
      </header>

      <main className="profile-content">
        <section className="profile-section">
          <h2>Account Information</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="button-group">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button type="submit">Save Changes</button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        <section className="profile-section">
          <h2>Preferences</h2>
          <div className="preferences-form">
            <div className="form-group">
              <label>Theme</label>
              <select>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email Notifications</label>
              <div className="checkbox-group">
                <label>
                  <input type="checkbox" /> Universe updates
                </label>
                <label>
                  <input type="checkbox" /> Collaboration invites
                </label>
                <label>
                  <input type="checkbox" /> Newsletter
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-section danger-zone">
          <h2>Danger Zone</h2>
          <p>
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button onClick={handleDeleteAccount} className="delete-button">
            Delete Account
          </button>
        </section>
      </main>

      <style jsx>{`
        .profile-page {
          padding: 2rem;
        }

        .profile-header {
          margin-bottom: 2rem;
        }

        .profile-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .profile-section h2 {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
        }

        .button-group {
          display: flex;
          gap: 1rem;
        }

        .cancel-button {
          background-color: var(--secondary-color);
        }

        .delete-button {
          background-color: var(--error-color);
        }

        .danger-zone {
          border: 1px solid var(--error-color);
        }

        .danger-zone h2 {
          color: var(--error-color);
        }

        .danger-zone p {
          margin-bottom: 1rem;
          color: #666;
        }

        .delete-account-modal {
          text-align: center;
        }

        .delete-account-modal p {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}

export default Profile;

import React from 'react';
import ThemeSelector from '../../../components/theme/ThemeSelector';
import '../styles/SettingsPage.css';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p className="settings-description">
            Customize your Harmonic Universe experience. Changes are automatically saved.
          </p>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h2>Appearance</h2>
            <div className="settings-card">
              <h3>Theme</h3>
              <p>Choose how Harmonic Universe looks to you. Select a theme below.</p>
              <ThemeSelector />
            </div>
          </div>

          <div className="settings-section">
            <h2>User Preferences</h2>
            <div className="settings-card">
              <h3>Coming Soon</h3>
              <p>Additional settings will be available in future updates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

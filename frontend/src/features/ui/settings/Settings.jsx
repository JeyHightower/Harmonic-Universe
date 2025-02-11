import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserSettings } from "../../store/slices/userSlice";

const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    theme: "light",
    notifications: {
      email: true,
      push: true,
      sound: true,
    },
    audioSettings: {
      volume: 75,
      quality: "high",
      spatialAudio: true,
    },
    performanceSettings: {
      graphicsQuality: "high",
      particleEffects: true,
      shadows: true,
    },
  });

  useEffect(() => {
    if (user?.settings) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        ...user.settings,
      }));
    }
  }, [user]);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setSettings((prev) => ({
      ...prev,
      theme: newTheme,
    }));
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked,
      },
    }));
  };

  const handleAudioSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handlePerformanceSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      performanceSettings: {
        ...prev.performanceSettings,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await dispatch(updateUserSettings(settings)).unwrap();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">Settings updated successfully!</div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <section className="settings-section">
          <h3>Theme</h3>
          <div className="form-group">
            <label htmlFor="theme">Select Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={handleThemeChange}
              className="theme-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h3>Notifications</h3>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="email"
                checked={settings.notifications.email}
                onChange={handleNotificationChange}
              />
              Email Notifications
            </label>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="push"
                checked={settings.notifications.push}
                onChange={handleNotificationChange}
              />
              Push Notifications
            </label>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="sound"
                checked={settings.notifications.sound}
                onChange={handleNotificationChange}
              />
              Sound Notifications
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>Audio Settings</h3>
          <div className="form-group">
            <label htmlFor="volume">Volume</label>
            <input
              type="range"
              id="volume"
              name="volume"
              min="0"
              max="100"
              value={settings.audioSettings.volume}
              onChange={handleAudioSettingChange}
            />
            <span>{settings.audioSettings.volume}%</span>
          </div>
          <div className="form-group">
            <label htmlFor="quality">Audio Quality</label>
            <select
              id="quality"
              name="quality"
              value={settings.audioSettings.quality}
              onChange={handleAudioSettingChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="spatialAudio"
                checked={settings.audioSettings.spatialAudio}
                onChange={handleAudioSettingChange}
              />
              Enable Spatial Audio
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>Performance Settings</h3>
          <div className="form-group">
            <label htmlFor="graphicsQuality">Graphics Quality</label>
            <select
              id="graphicsQuality"
              name="graphicsQuality"
              value={settings.performanceSettings.graphicsQuality}
              onChange={handlePerformanceSettingChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="particleEffects"
                checked={settings.performanceSettings.particleEffects}
                onChange={handlePerformanceSettingChange}
              />
              Enable Particle Effects
            </label>
          </div>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="shadows"
                checked={settings.performanceSettings.shadows}
                onChange={handlePerformanceSettingChange}
              />
              Enable Shadows
            </label>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

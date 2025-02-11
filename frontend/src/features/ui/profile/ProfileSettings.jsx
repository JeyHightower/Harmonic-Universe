import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNotification } from "../../context/NotificationContext";
import { updateUserProfile } from "../../store/slices/userSlice";
import styles from "./ProfileSettings.module.css";

const ProfileSettings = ({ user }) => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const [imagePreview, setImagePreview] = useState(null);
  const [settings, setSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications || false,
    soundEnabled: user?.settings?.soundEnabled || true,
    theme: user?.settings?.theme || "light",
    language: user?.settings?.language || "en",
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        updateUserProfile({
          settings,
          profileImage: imagePreview,
        }),
      ).unwrap();

      showNotification("Profile settings updated successfully", "success");
    } catch (error) {
      showNotification("Failed to update profile settings", "error");
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.imageSection}>
          <div className={styles.profileImage}>
            <img
              src={imagePreview || user?.profileImage || "/default-avatar.png"}
              alt="Profile"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.imageInput}
            />
          </div>
        </div>

        <div className={styles.settingsSection}>
          <h3>Notifications</h3>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                handleSettingChange("emailNotifications", e.target.checked)
              }
            />
            <span className={styles.slider}></span>
            Email Notifications
          </label>

          <h3>Sound</h3>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) =>
                handleSettingChange("soundEnabled", e.target.checked)
              }
            />
            <span className={styles.slider}></span>
            Enable Sound Effects
          </label>

          <h3>Appearance</h3>
          <select
            value={settings.theme}
            onChange={(e) => handleSettingChange("theme", e.target.value)}
            className={styles.select}
          >
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
          </select>

          <h3>Language</h3>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange("language", e.target.value)}
            className={styles.select}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <button type="submit" className={styles.saveButton}>
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;

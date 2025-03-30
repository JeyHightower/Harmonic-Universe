import React, { useEffect, useState } from "react";
import {
  THEMES,
  getCurrentTheme,
  setTheme,
  toggleTheme,
} from "../../utils/themeUtils";
import "../../styles/ThemeToggle.css";

/**
 * ThemeToggle component allows users to switch between light, dark, and system themes
 */
const ThemeToggle = () => {
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  // Update theme state when changed elsewhere
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentTheme(getCurrentTheme());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle theme toggle
  const handleToggle = () => {
    const newTheme = toggleTheme();
    setCurrentTheme(newTheme);
  };

  // Handle theme selection
  const selectTheme = (theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
  };

  // Determine which icon to show based on current theme
  const getThemeIcon = () => {
    if (currentTheme === THEMES.SYSTEM) {
      const systemIsDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return systemIsDark ? "🌙" : "☀️";
    }
    return currentTheme === THEMES.DARK ? "🌙" : "☀️";
  };

  return (
    <div className="theme-toggle-container">
      <button onClick={handleToggle} className="theme-toggle-button">
        {getThemeIcon()}
      </button>

      <div className="theme-select-dropdown">
        <button
          onClick={() => selectTheme(THEMES.LIGHT)}
          className={`theme-option ${
            currentTheme === THEMES.LIGHT ? "active" : ""
          }`}
        >
          ☀️ Light
        </button>

        <button
          onClick={() => selectTheme(THEMES.DARK)}
          className={`theme-option ${
            currentTheme === THEMES.DARK ? "active" : ""
          }`}
        >
          🌙 Dark
        </button>

        <button
          onClick={() => selectTheme(THEMES.SYSTEM)}
          className={`theme-option ${
            currentTheme === THEMES.SYSTEM ? "active" : ""
          }`}
        >
          💻 System
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;

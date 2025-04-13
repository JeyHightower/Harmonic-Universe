/**
 * Theme Utility Functions
 *
 * These functions provide an interface for managing application themes.
 * They handle theme switching, persistence, and system preference detection.
 */

import { THEME_CONFIG } from "./config";

// Available themes
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

/**
 * Get the current theme from local storage or system preferences
 * @returns {string} The current theme (light, dark, or system)
 */
export const getCurrentTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  return savedTheme || THEMES.LIGHT;
};

/**
 * Set the theme for the application
 * @param {string} theme - The theme to set (light, dark, or system)
 */
export const setTheme = (theme) => {
  if (!Object.values(THEMES).includes(theme)) {
    console.error(`Invalid theme: ${theme}`);
    return;
  }
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
};

/**
 * Toggle between light and dark themes
 * @returns {string} The new theme after toggling
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  setTheme(newTheme);
};

export const getThemeColors = () => {
  const currentTheme = getCurrentTheme();
  return THEME_CONFIG[currentTheme.toUpperCase()];
};

export const applyThemeColors = () => {
  const colors = getThemeColors();
  const root = document.documentElement;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

export const getContrastColor = (color) => {
  // Convert hex to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

export const getColorWithOpacity = (color, opacity) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getGradient = (color, direction = "to right") => {
  const baseColor = getColorWithOpacity(color, 1);
  const transparentColor = getColorWithOpacity(color, 0);

  return `linear-gradient(${direction}, ${baseColor}, ${transparentColor})`;
};

export const getBoxShadow = (color) => {
  return `0 2px 4px ${getColorWithOpacity(
    color,
    0.1
  )}, 0 4px 8px ${getColorWithOpacity(color, 0.1)}`;
};

/**
 * Theme Utility Functions
 *
 * These functions provide an interface for managing application themes.
 * They handle theme switching, persistence, and system preference detection.
 */

// Available themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

/**
 * Get the current theme from local storage or system preferences
 * @returns {string} The current theme (light, dark, or system)
 */
export const getCurrentTheme = () => {
  const savedTheme = localStorage.getItem('app-theme');

  if (savedTheme) {
    return savedTheme;
  }

  return THEMES.SYSTEM;
};

/**
 * Set the theme for the application
 * @param {string} theme - The theme to set (light, dark, or system)
 */
export const setTheme = theme => {
  // Save theme preference to localStorage
  localStorage.setItem('app-theme', theme);

  // Apply theme to document
  applyTheme(theme);
};

/**
 * Apply the specified theme to the document
 * @param {string} theme - The theme to apply (light, dark, or system)
 */
export const applyTheme = theme => {
  // Handle system preference
  if (theme === THEMES.SYSTEM) {
    const prefersDarkMode = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    document.documentElement.setAttribute(
      'data-theme',
      prefersDarkMode ? THEMES.DARK : THEMES.LIGHT
    );
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

/**
 * Initialize theme based on saved preference or system settings
 */
export const initializeTheme = () => {
  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);

  // Listen for system preference changes
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = () => {
    const currentTheme = getCurrentTheme();
    if (currentTheme === THEMES.SYSTEM) {
      applyTheme(THEMES.SYSTEM);
    }
  };

  // Modern browsers
  if (darkModeMediaQuery.addEventListener) {
    darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    // Fallback for older browsers
    darkModeMediaQuery.addListener(handleSystemThemeChange);
  }
};

/**
 * Toggle between light and dark themes
 * @returns {string} The new theme after toggling
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  let newTheme;

  // If system theme, just switch to explicit light/dark
  if (currentTheme === THEMES.SYSTEM) {
    const systemIsDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    newTheme = systemIsDark ? THEMES.LIGHT : THEMES.DARK;
  } else {
    // Toggle between light and dark
    newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  }

  setTheme(newTheme);
  return newTheme;
};

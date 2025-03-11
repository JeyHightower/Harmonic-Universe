import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const themes = {
  default: 'light',
  options: [
    {
      id: 'light',
      name: 'Light',
      description: 'Default light theme',
      primaryColor: '#4361ee',
      accentColor: '#7209b7',
      backgroundColor: '#f8f9fa',
      textColor: '#1a1a2e',
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Dark theme for low-light environments',
      primaryColor: '#5e7bff',
      accentColor: '#9d4edd',
      backgroundColor: '#111827',
      textColor: '#f1f5f9',
    },
    {
      id: 'cosmic',
      name: 'Cosmic',
      description: 'Deep space inspired theme',
      primaryColor: '#6b46c1',
      accentColor: '#d53f8c',
      backgroundColor: '#0a0514',
      textColor: '#e2e8f0',
    },
    {
      id: 'harmony',
      name: 'Harmony',
      description: 'Calm, harmonious colors',
      primaryColor: '#38a169',
      accentColor: '#3182ce',
      backgroundColor: '#ebf8ff',
      textColor: '#2a4365',
    },
  ],
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Try to get the theme from localStorage
    const savedTheme = localStorage.getItem('harmonic-universe-theme');
    // Use the saved theme or default to 'light'
    return savedTheme || themes.default;
  });

  // Apply the theme when it changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('harmonic-universe-theme', currentTheme);

    // Remove previous theme classes
    document.body.classList.remove(
      ...themes.options.map(theme => `${theme.id}-theme`)
    );

    // Add new theme class
    document.body.classList.add(`${currentTheme}-theme`);

    // Update CSS variables for the theme
    const themeConfig = themes.options.find(t => t.id === currentTheme);
    if (themeConfig) {
      document.documentElement.style.setProperty(
        '--primary-color',
        themeConfig.primaryColor
      );
      document.documentElement.style.setProperty(
        '--accent-color',
        themeConfig.accentColor
      );
      document.documentElement.style.setProperty(
        '--background-color',
        themeConfig.backgroundColor
      );
      document.documentElement.style.setProperty(
        '--text-primary',
        themeConfig.textColor
      );

      // Derive some additional colors
      const primaryRGB = hexToRgb(themeConfig.primaryColor);
      const accentRGB = hexToRgb(themeConfig.accentColor);

      if (primaryRGB) {
        document.documentElement.style.setProperty(
          '--primary-rgb',
          `${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}`
        );
      }

      if (accentRGB) {
        document.documentElement.style.setProperty(
          '--accent-rgb',
          `${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}`
        );
      }
    }
  }, [currentTheme]);

  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  const toggleTheme = () => {
    const currentIndex = themes.options.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.options.length;
    setCurrentTheme(themes.options[nextIndex].id);
  };

  const setTheme = themeId => {
    if (themes.options.some(t => t.id === themeId)) {
      setCurrentTheme(themeId);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themes: themes.options,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

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
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

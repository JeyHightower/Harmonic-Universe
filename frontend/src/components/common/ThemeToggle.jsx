import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { currentTheme, toggleTheme, themes } = useTheme();

  // Find the current theme object
  const activeTheme = themes.find(theme => theme.id === currentTheme);

  return (
    <div className="theme-toggle">
      <button
        className="theme-toggle-button"
        onClick={toggleTheme}
        aria-label={`Switch theme. Current theme: ${activeTheme.name}`}
        title={`Current theme: ${activeTheme.name}`}
      >
        <div className="theme-icon">
          {currentTheme === 'light' && <span>☀️</span>}
          {currentTheme === 'dark' && <span>🌙</span>}
          {currentTheme === 'cosmic' && <span>✨</span>}
          {currentTheme === 'harmony' && <span>🎵</span>}
        </div>
        <span className="theme-name">{activeTheme.name}</span>
      </button>
    </div>
  );
};

export default ThemeToggle;

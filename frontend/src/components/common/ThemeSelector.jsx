import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeSelector.css';

const ThemeSelector = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div className="theme-selector">
      <h3 className="theme-selector-title">Select Theme</h3>
      <div className="theme-options">
        {themes.map(theme => (
          <button
            key={theme.id}
            className={`theme-option ${
              currentTheme === theme.id ? 'active' : ''
            }`}
            onClick={() => setTheme(theme.id)}
            aria-label={`Switch to ${theme.name} theme`}
            title={theme.description}
          >
            <div
              className="theme-preview"
              style={{
                '--preview-primary': theme.primaryColor,
                '--preview-accent': theme.accentColor,
                '--preview-background': theme.backgroundColor,
                '--preview-text': theme.textColor,
              }}
            >
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-item"></div>
                <div className="preview-item"></div>
              </div>
            </div>
            <span className="theme-option-name">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;

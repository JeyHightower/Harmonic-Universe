// Import all styles
import './App.css';
import './theme.css';

// Export any style utility functions if needed
export const applyTheme = (theme) => {
  const root = document.documentElement;
  Object.keys(theme).forEach(variable => {
    root.style.setProperty(`--${variable}`, theme[variable]);
  });
};

// Example theme override function
export const applyCustomAccentColor = (color) => {
  document.documentElement.style.setProperty('--accent-color', color);
}; 
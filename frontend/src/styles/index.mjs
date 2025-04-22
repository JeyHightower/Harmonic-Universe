// Import all styles
import './App.css';
import './DashboardLayout.css'; // Add specific dashboard styles for better click handling
import './Modal.css';
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

// Function to fix interaction issues with CSS only
export const fixInteractionStyles = () => {
  document.body.style.pointerEvents = 'auto';

  // Make sure all buttons are clickable
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(button => {
    button.style.pointerEvents = 'auto';
    button.style.position = 'relative';
    button.style.zIndex = '5';
  });

  // Fix dashboard specific elements
  const dashboardButtons = document.querySelectorAll('.dashboard-actions button');
  dashboardButtons.forEach(button => {
    button.style.pointerEvents = 'auto';
    button.style.zIndex = '25';
  });

  return true;
};
